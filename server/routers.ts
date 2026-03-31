import { COOKIE_NAME, AXIOS_TIMEOUT_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { defaultChatModel, openAiCompatibleChatUrl } from "./_core/aiProviders";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import axios, { isAxiosError } from "axios";
import type { FeedItem, RegistrationForm, RegistrationFormField } from "@shared/types";
import type { InsertProduct } from "../drizzle/schema";
import * as db from "./db";
import * as icecat from "./icecat";
import { createScrapedProductId, scrapeOpenGraphUrl } from "./opengraph";
import { parseLegacyTingsDeepLink } from "./deeplinkTings";

function safeHttpUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const u = new URL(url.trim());
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch {
    return undefined;
  }
  return undefined;
}

function tingsV2RequestHeaders(): Record<string, string> | undefined {
  const t = ENV.tingsApiBearerToken;
  return t ? { Authorization: `Bearer ${t}` } : undefined;
}

/** Map Tings `/api/v2/products/*` JSON (see legacy app `ProductItem`) into our `products` row. */
function mapTingsV2ResponseToProduct(data: unknown): InsertProduct | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.id !== "string" || !d.id.trim()) return null;
  const name =
    typeof d.name === "string" && d.name.trim()
      ? d.name.trim()
      : "Unknown Product";
  const brand =
    typeof d.brand === "string" && d.brand.trim() ? d.brand.trim() : null;
  const barcode = typeof d.barcode === "string" ? d.barcode : null;
  const imageUrl = typeof d.imageUrl === "string" ? d.imageUrl : null;
  const description =
    typeof d.description === "string" && d.description.trim()
      ? d.description.trim()
      : undefined;

  const images = Array.isArray(d.images)
    ? (d.images as unknown[]).filter((u): u is string => typeof u === "string" && u.startsWith("http"))
    : undefined;
  const videos = Array.isArray(d.videos)
    ? (d.videos as unknown[]).filter((u): u is string => typeof u === "string" && u.startsWith("http"))
    : undefined;
  const htmlContent = Array.isArray(d.contentBlocks)
    ? (d.contentBlocks as unknown[])
        .filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
        .map((b) => ({
          title: typeof b.title === "string" ? b.title : undefined,
          body: typeof b.body === "string" ? b.body : "",
        }))
        .filter((b) => b.body.trim().length > 0)
    : undefined;

  const metadata: NonNullable<InsertProduct["metadata"]> = {};
  if (description) metadata.description = description;
  if (images?.length) metadata.images = images;
  if (videos?.length) metadata.videos = videos;
  if (htmlContent?.length) metadata.htmlContent = htmlContent;

  return {
    productId: d.id.trim(),
    name,
    brand,
    model: null,
    category: null,
    imageUrl,
    barcode,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  };
}

function parseBoolish(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

function mapTingsRegistrationFieldType(dataType: string): RegistrationFormField["type"] | null {
  switch (dataType) {
    case "text":
    case "email":
    case "textarea":
    case "date":
    case "country":
      return dataType;
    case "numeric":
      return "text";
    default:
      return null;
  }
}

/** Parses Tings registration form JSON (legacy `ProductFormModel` / `formFields`). */
export function parseTingsRegistrationForm(
  productId: string,
  raw: unknown,
): RegistrationForm | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const formFields = o.formFields;
  if (!title || !Array.isArray(formFields) || formFields.length === 0) return null;

  const fields: RegistrationFormField[] = [];
  for (const item of formFields) {
    if (!item || typeof item !== "object") continue;
    const f = item as Record<string, unknown>;
    const label = typeof f.label === "string" ? f.label.trim() : "";
    const dt =
      typeof f.dataType === "string" ? mapTingsRegistrationFieldType(f.dataType) : null;
    if (!label || !dt) continue;

    const prefilledHint =
      typeof f.prefilledValue === "string" && f.prefilledValue.length > 0
        ? f.prefilledValue
        : undefined;

    fields.push({
      key: label,
      label,
      type: dt,
      required: parseBoolish(f.required),
      prefilledHint,
    });
  }

  if (fields.length === 0) return null;

  const description =
    typeof o.description === "string" && o.description.trim()
      ? o.description.trim()
      : undefined;

  return { productId, title, description, fields };
}

function normalizeRegistrationFormData(
  formData: Record<string, unknown>,
): Array<{ key: string; value: string | null }> {
  const maxKeys = 80;
  const maxValLen = 8000;
  return Object.entries(formData)
    .slice(0, maxKeys)
    .map(([key, value]) => {
      if (value === null || value === undefined) return { key, value: null };
      let s = typeof value === "string" ? value : String(value);
      if (s.length > maxValLen) s = s.slice(0, maxValLen);
      return { key, value: s };
    });
}

/**
 * Legacy QR / deep links: `id.tings.info/{id}`, `qr.tings.info/...`, and `*.thap.info` variants.
 */
async function tryResolveLegacyTingsDeepLink(payload: string) {
  const link = parseLegacyTingsDeepLink(payload);
  if (!link) return undefined;

  const base = ENV.tingsApiBase;
  const headers = tingsV2RequestHeaders();

  if (link.kind === "id") {
    const local = await db.searchProductByIdentifier(link.externalId);
    if (local) return local;
    try {
      const { data, status } = await axios.get(
        `${base}/api/v2/products/${encodeURIComponent(link.externalId)}`,
        { timeout: AXIOS_TIMEOUT_MS, headers, validateStatus: () => true },
      );
      if (status >= 200 && status < 300) {
        const row = mapTingsV2ResponseToProduct(data);
        if (row) {
          await db.upsertProduct(row);
          const stored = await db.getProductByProductId(row.productId);
          if (stored) return stored;
        }
      }
    } catch {
      // continue to standard lookup
    }
    return undefined;
  }

  try {
    const { data, status } = await axios.get(`${base}/api/v2/products/find`, {
      params: { qrUrl: link.qrUrl },
      timeout: AXIOS_TIMEOUT_MS,
      headers,
      validateStatus: () => true,
    });
    if (status >= 200 && status < 300) {
      const row = mapTingsV2ResponseToProduct(data);
      if (row) {
        await db.upsertProduct(row);
        const stored = await db.getProductByProductId(row.productId);
        if (stored) return stored;
      }
    }
  } catch {
    // continue
  }
  return undefined;
}

async function upsertIcecatProduct(product: icecat.IcecatProduct) {
  const metadata: NonNullable<InsertProduct["metadata"]> = {};
  const desc = product.description ?? product.shortDescription ?? undefined;
  if (desc) metadata.description = desc;
  if (Object.keys(product.specifications).length > 0) metadata.specifications = product.specifications;
  if (product.galleryImages.length > 0) metadata.images = product.galleryImages;

  await db.upsertProduct({
    productId: `icecat-${product.icecatId}`,
    name: product.title || product.name,
    brand: product.brand || null,
    model: null,
    category: product.category || null,
    imageUrl: product.imageUrl,
    barcode: product.barcode ?? null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  });
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteUserAccount(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Product management
  products: router({
    // Get user's owned products
    myProducts: protectedProcedure.query(async ({ ctx }) => {
      const instances = await db.getUserProductInstances(ctx.user.id);
      return instances;
    }),

    // Get product by external product ID
    getByProductId: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        const product = await db.getProductByProductId(input.productId);
        return product;
      }),

    // Add product to user's collection
    addToMyThings: protectedProcedure
      .input(z.object({
        productId: z.number(),
        nickname: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createProductInstance({
          userId: ctx.user.id,
          productId: input.productId,
          nickname: input.nickname,
          tags: input.tags,
        });
        return { success: true };
      }),

    // Remove product from user's collection
    removeFromMyThings: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProductInstance(input.instanceId, ctx.user.id);
        return { success: true };
      }),

    // Get single product instance details
    getInstance: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const instance = await db.getProductInstanceById(input.instanceId, ctx.user.id);
        return instance;
      }),

    // Get product by ID with user instance info
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product) return null;
        
        // Check if user owns this product
        const instances = await db.getUserProductInstances(ctx.user.id);
        const instance = instances.find(i => i.product?.id === input.id);
        
        return {
          product,
          instance: instance?.instance || null,
        };
      }),

    // Update product instance
    updateProductInstance: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        productId: z.number(),
        nickname: z.string().optional(),
        purchaseDate: z.date().optional(),
        purchasePrice: z.number().optional(),
        purchaseLocation: z.string().optional(),
        warrantyExpiry: z.date().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { instanceId, ...updateData } = input;
        await db.updateProductInstance(instanceId, ctx.user.id, updateData);
        return { success: true };
      }),

    /** Proxy to Tings: POST /api/v2/products/feedback/{productId} */
    sendFeedback: protectedProcedure
      .input(
        z.object({
          productId: z.string().min(1).max(255),
          feedback: z.string().min(1).max(5000),
          name: z.string().max(200).optional(),
          email: z.union([z.string().email(), z.literal("")]).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const name = input.name?.trim() || undefined;
        const email =
          input.email === undefined || input.email === "" ? undefined : input.email;
        const base = ENV.tingsApiBase.replace(/\/$/, "");
        const url = `${base}/api/v2/products/feedback/${encodeURIComponent(input.productId)}`;
        const headers = tingsV2RequestHeaders();
        try {
          await axios.post(
            url,
            {
              feedback: input.feedback.trim(),
              ...(name !== undefined && { name }),
              ...(email !== undefined && { email }),
            },
            { timeout: AXIOS_TIMEOUT_MS, ...(headers ? { headers } : {}) },
          );
        } catch (err: unknown) {
          const msg = isAxiosError(err)
            ? typeof err.response?.data === "object" &&
                err.response?.data !== null &&
                "message" in err.response.data &&
                typeof (err.response.data as { message?: unknown }).message === "string"
              ? (err.response.data as { message: string }).message
              : err.response?.status
                ? `Tings API error (${err.response.status})`
                : err.message
            : "Feedback request failed";
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: msg,
          });
        }
        return { success: true as const };
      }),

    /**
     * Manufacturer registration form: GET Tings `.../api/v2/products/registration_form/{productId}`
     * (legacy path `/v2/products/registration_form/`).
     */
    getRegistrationForm: protectedProcedure
      .input(z.object({ productId: z.string().min(1).max(255) }))
      .query(async ({ input }) => {
        const base = ENV.tingsApiBase.replace(/\/$/, "");
        const url = `${base}/api/v2/products/registration_form/${encodeURIComponent(input.productId)}`;
        const headers = tingsV2RequestHeaders();
        try {
          const { data, status } = await axios.get(url, {
            timeout: AXIOS_TIMEOUT_MS,
            ...(headers ? { headers } : {}),
            validateStatus: () => true,
          });
          if (status === 404) return null;
          if (status < 200 || status >= 300) {
            throw new TRPCError({
              code: "BAD_GATEWAY",
              message: `Registration form unavailable (${status})`,
            });
          }
          return parseTingsRegistrationForm(input.productId, data);
        } catch (err: unknown) {
          if (err instanceof TRPCError) throw err;
          if (isAxiosError(err) && err.response?.status === 404) return null;
          const msg = isAxiosError(err) ? err.message : "Registration form request failed";
          throw new TRPCError({ code: "BAD_GATEWAY", message: msg });
        }
      }),

    /**
     * Submit manufacturer registration: POST Tings `.../api/v2/tings/{instanceId}/register`
     * with body `{ registrationData: [{ key, value }] }`.
     */
    registerProduct: protectedProcedure
      .input(
        z.object({
          productInstanceId: z.number().int().positive(),
          formData: z.record(z.string(), z.unknown()),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const row = await db.getProductInstanceById(input.productInstanceId, ctx.user.id);
        if (!row) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product instance not found",
          });
        }

        const base = ENV.tingsApiBase.replace(/\/$/, "");
        const url = `${base}/api/v2/tings/${encodeURIComponent(String(input.productInstanceId))}/register`;
        const headers = tingsV2RequestHeaders();
        const body = {
          registrationData: normalizeRegistrationFormData(input.formData),
        };

        try {
          const { status } = await axios.post(url, body, {
            timeout: AXIOS_TIMEOUT_MS,
            ...(headers ? { headers } : {}),
            validateStatus: () => true,
          });
          if (status < 200 || status >= 300) {
            const message =
              status === 404
                ? "Registration endpoint not found for this product instance."
                : `Registration failed (${status})`;
            throw new TRPCError({ code: "BAD_GATEWAY", message });
          }
        } catch (err: unknown) {
          if (err instanceof TRPCError) throw err;
          const msg = isAxiosError(err)
            ? err.response?.status
              ? `Tings API error (${err.response.status})`
              : err.message
            : "Registration request failed";
          throw new TRPCError({ code: "BAD_GATEWAY", message: msg });
        }

        return { success: true as const };
      }),

    lookupByQR: protectedProcedure
      .input(z.object({ payload: z.string().min(1).max(2000) }))
      .mutation(async ({ input }) => {
        const { payload } = input;

        const fromLegacyHost = await tryResolveLegacyTingsDeepLink(payload);
        if (fromLegacyHost) return fromLegacyHost;

        // 1. Try to parse as a known Thap product URL (e.g. .../product/PRODUCT_ID)
        const thapMatch = payload.match(/\/product\/([^/?#]+)/);
        if (thapMatch) {
          const extractedId = thapMatch[1];
          const numericId = parseInt(extractedId, 10);

          if (!isNaN(numericId)) {
            const product = await db.getProductById(numericId);
            if (product) return product;
          }

          const product = await db.searchProductByIdentifier(extractedId);
          if (product) return product;
        }

        // 2. Try local DB lookup by productId / barcode
        const localProduct = await db.searchProductByIdentifier(payload);
        if (localProduct) return localProduct;

        // 3. Try as a plain numeric internal ID
        const numericId = parseInt(payload, 10);
        if (!isNaN(numericId)) {
          const product = await db.getProductById(numericId);
          if (product) return product;
        }

        // 4. Try external API lookup
        try {
          const { data: externalProduct } = await axios.get(
            `${ENV.tingsApiBase}/api/products/search`,
            {
              params: { q: payload },
              timeout: AXIOS_TIMEOUT_MS,
            },
          );

          if (externalProduct && externalProduct.id) {
            await db.upsertProduct({
              productId: String(externalProduct.id),
              name: externalProduct.name ?? "Unknown Product",
              brand: externalProduct.brand ?? null,
              model: externalProduct.model ?? null,
              category: externalProduct.category ?? null,
              imageUrl: externalProduct.imageUrl ?? null,
              barcode: externalProduct.barcode ?? null,
              metadata: externalProduct.metadata ?? null,
            });

            const stored = await db.getProductByProductId(String(externalProduct.id));
            if (stored) return stored;
          }
        } catch {
          // External API unavailable — fall through to not-found
        }

        const icecatProduct = await icecat.lookupByGtin(payload);
        if (icecatProduct) {
          await upsertIcecatProduct(icecatProduct);
          const stored = await db.getProductByProductId(`icecat-${icecatProduct.icecatId}`);
          if (stored) return stored;
        }

        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found. The scanned code did not match any known product.",
        });
      }),

    searchExternal: protectedProcedure
      .input(z.object({ query: z.string().min(2).max(200), lang: z.string().max(5).default("EN") }))
      .mutation(async ({ input }) => {
        const query = input.query.trim();
        const isBarcode = /^\d{8,}$/.test(query);

        const localByIdentifier = await db.searchProductByIdentifier(query);
        if (localByIdentifier) {
          return { products: [localByIdentifier], source: "local" as const };
        }

        if (!isBarcode) {
          const localByName = await db.searchProductsByName(query);
          if (localByName.length > 0) {
            return { products: localByName, source: "local" as const };
          }
        }

        if (!isBarcode) {
          try {
            const { data: externalProduct } = await axios.get(
              `${ENV.tingsApiBase}/api/products/search`,
              { params: { q: query }, timeout: AXIOS_TIMEOUT_MS },
            );

            if (externalProduct && externalProduct.id) {
              await db.upsertProduct({
                productId: String(externalProduct.id),
                name: externalProduct.name ?? "Unknown Product",
                brand: externalProduct.brand ?? null,
                model: externalProduct.model ?? null,
                category: externalProduct.category ?? null,
                imageUrl: externalProduct.imageUrl ?? null,
                barcode: externalProduct.barcode ?? null,
                metadata: externalProduct.metadata ?? null,
              });

              const stored = await db.getProductByProductId(String(externalProduct.id));
              if (stored) return { products: [stored], source: "tings" as const };
            }
          } catch {
            // Tings unavailable — continue
          }
        }

        if (isBarcode) {
          const icecatProduct = await icecat.lookupByGtin(query);
          if (icecatProduct) {
            await upsertIcecatProduct(icecatProduct);
            const stored = await db.getProductByProductId(`icecat-${icecatProduct.icecatId}`);
            if (stored) return { products: [stored], source: "icecat" as const };
          }
        }

        throw new TRPCError({
          code: "NOT_FOUND",
          message: isBarcode
            ? "No product found for this barcode."
            : "No product found matching your search.",
        });
      }),

    scrapeUrl: protectedProcedure
      .input(z.object({ url: z.string().url().max(2000) }))
      .mutation(async ({ input }) => {
        const scraped = await scrapeOpenGraphUrl(input.url);
        const productId = createScrapedProductId(scraped.url);

        await db.upsertProduct({
          productId,
          name: scraped.title,
          brand: scraped.siteName ?? null,
          model: null,
          category: null,
          imageUrl: scraped.imageUrl ?? null,
          barcode: null,
          metadata: scraped.description
            ? { description: scraped.description }
            : null,
        });

        const product = await db.getProductByProductId(productId);
        if (!product) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to store scraped product.",
          });
        }

        return { product, scraped };
      }),
  }),

  tags: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTagsWithCounts(ctx.user.id);
    }),

    rename: protectedProcedure
      .input(
        z.object({
          oldName: z.string().trim().min(1).max(100),
          newName: z.string().trim().min(1).max(100),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await db.renameTag(ctx.user.id, input.oldName, input.newName);
        return { success: true as const };
      }),

    delete: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(100),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await db.deleteTag(ctx.user.id, input.name);
        return { success: true as const };
      }),

    reorder: protectedProcedure
      .input(
        z.object({
          orderedNames: z.array(z.string().trim().min(1).max(100)).max(500),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await db.reorderTags(ctx.user.id, input.orderedNames);
        return { success: true as const };
      }),
  }),

  // Database cleanup utilities
  cleanup: router({
    removeDuplicates: protectedProcedure.mutation(async ({ ctx }) => {
      const removedInstances = await db.removeDuplicateProductInstances(ctx.user.id);
      const removedScans = await db.removeDuplicateScanHistory(ctx.user.id);

      return { 
        success: true, 
        removedInstances,
        removedScans,
      };
    }),
  }),

  // Demo data seeding
  demo: router({
    // Seed demo data for current user
    seedData: protectedProcedure.mutation(async ({ ctx }) => {
      // Get demo products
      const tshirt = await db.getProductByProductId("reet-aus-tshirt-001");
      const headphones = await db.getProductByProductId("sony-wh1000xm5-001");
      
      // Get existing user products to check for duplicates
      const existingProducts = await db.getUserProductInstances(ctx.user.id);
      const existingProductIds = existingProducts.map(p => p.product?.id).filter(Boolean);
      
      if (tshirt && !existingProductIds.includes(tshirt.id)) {
        // Add to scan history only if not already owned
        const existingScans = await db.getUserScanHistory(ctx.user.id);
        const alreadyScanned = existingScans.some(s => s.product?.id === tshirt.id);
        
        if (!alreadyScanned) {
          await db.addToScanHistory({
            userId: ctx.user.id,
            productId: tshirt.id,
          });
        }
      }
      
      if (headphones && !existingProductIds.includes(headphones.id)) {
        // Check if already in scan history
        const existingScans = await db.getUserScanHistory(ctx.user.id);
        const alreadyScanned = existingScans.some(s => s.product?.id === headphones.id);
        
        if (!alreadyScanned) {
          await db.addToScanHistory({
            userId: ctx.user.id,
            productId: headphones.id,
          });
        }
        
        // Add to my things
        await db.createProductInstance({
          userId: ctx.user.id,
          productId: headphones.id,
        });
      }
      
      return { success: true };
    }),
  }),

  // User settings
  userSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return {
        language: ctx.user.languageCode || "en",
        country: ctx.user.countryCode || null,
        name: ctx.user.name ?? null,
        email: ctx.user.email ?? null,
      };
    }),

    update: protectedProcedure
      .input(z.object({
        language: z.string().optional(),
        country: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserPreferences(ctx.user.id, {
          languageCode: input.language,
          countryCode: input.country,
        });
        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email().max(320).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, {
          name: input.name,
          email: input.email,
        });
        return { success: true };
      }),
  }),

  // Scan history
  scanHistory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const history = await db.getUserScanHistory(ctx.user.id);
      return history;
    }),

    add: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isOwned = await db.isProductOwned(ctx.user.id, input.productId);

        if (!isOwned) {
          await db.addToScanHistory({
            userId: ctx.user.id,
            productId: input.productId,
          });
        }

        return { success: true, recorded: !isOwned };
      }),

    delete: protectedProcedure
      .input(z.object({ historyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteScanHistoryEntry(input.historyId, ctx.user.id);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearScanHistory(ctx.user.id);
      return { success: true };
    }),
  }),

  // AI assistant
  ai: router({
    getProviders: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getUserAiProviderSettings(ctx.user.id);
      return settings;
    }),

    getActiveProvider: protectedProcedure.query(async ({ ctx }) => {
      const provider = await db.getActiveAiProvider(ctx.user.id);
      return provider;
    }),

    saveProvider: protectedProcedure
      .input(z.object({
        provider: z.enum(['openai', 'gemini', 'perplexity', 'deepseek']),
        apiKey: z.string(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.isActive) {
          const existingSettings = await db.getUserAiProviderSettings(ctx.user.id);
          for (const setting of existingSettings) {
            if (setting.provider !== input.provider && setting.isActive) {
              await db.upsertAiProviderSetting({
                userId: ctx.user.id,
                provider: setting.provider,
                apiKey: setting.apiKey,
                isActive: false,
              });
            }
          }
        }

        await db.upsertAiProviderSetting({
          userId: ctx.user.id,
          provider: input.provider,
          apiKey: input.apiKey,
          isActive: input.isActive,
        });
        return { success: true };
      }),

    getConversations: protectedProcedure.query(async ({ ctx }) => {
      const conversations = await db.getUserAiConversations(ctx.user.id);
      return conversations;
    }),

    getConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getAiConversationById(input.conversationId, ctx.user.id);
        return conversation ?? null;
      }),

    getConversationByProduct: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getAiConversationByProductId(input.productId, ctx.user.id);
        return conversation ?? null;
      }),

    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(4000),
        productId: z.number(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }

        const activeProvider = await db.getActiveAiProvider(ctx.user.id);
        const hasByok = Boolean(activeProvider?.apiKey?.trim());
        const hasServerLlm =
          ENV.servicesBaseUrl.trim().length > 0 &&
          ENV.servicesApiKey.trim().length > 0;

        if (!hasByok && !hasServerLlm) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "No AI credentials: add an API key in Settings and mark the provider as active, or set THAP_SERVICES_BASE_URL and THAP_SERVICES_API_KEY on the server.",
          });
        }

        let conversationId = input.conversationId;
        let existingMessages: Array<{ role: "user" | "assistant" | "system"; content: string; timestamp: number }> = [];

        if (conversationId) {
          const conversation = await db.getAiConversationById(conversationId, ctx.user.id);
          if (conversation) {
            existingMessages = conversation.messages;
          }
        }

        const metaParts: string[] = [];
        if (product.brand) metaParts.push(`Brand: ${product.brand}`);
        if (product.model) metaParts.push(`Model: ${product.model}`);
        if (product.category) metaParts.push(`Category: ${product.category}`);
        if (product.metadata?.description) metaParts.push(`Description: ${product.metadata.description}`);
        if (product.metadata?.careInstructions?.length) {
          metaParts.push(`Care instructions: ${product.metadata.careInstructions.join("; ")}`);
        }
        if (product.metadata?.warrantyInfo) metaParts.push(`Warranty: ${product.metadata.warrantyInfo}`);
        if (product.metadata?.specifications) {
          const specs = Object.entries(product.metadata.specifications)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          metaParts.push(`Specs: ${specs}`);
        }

        const systemPrompt = [
          "You are Thap AI — a helpful product assistant.",
          "Answer questions about the user's product accurately and concisely using markdown formatting.",
          "If you don't have specific data, say so honestly rather than inventing specifications.",
          "",
          `Product: ${product.name}`,
          ...metaParts,
        ].join("\n");

        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
          ...existingMessages
            .filter(m => m.role !== "system")
            .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: input.message },
        ];

        const llmProviderLabel =
          hasByok && activeProvider ? activeProvider.provider : "forge";

        let result: Awaited<ReturnType<typeof invokeLLM>>;
        try {
          if (hasByok && activeProvider) {
            result = await invokeLLM({
              messages: llmMessages,
              openAiCompatUrl: openAiCompatibleChatUrl(activeProvider.provider),
              bearerToken: activeProvider.apiKey,
              model: defaultChatModel(activeProvider.provider),
            });
          } else {
            result = await invokeLLM({ messages: llmMessages });
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (
            msg.includes("THAP_SERVICES_BASE_URL") ||
            msg.includes("THAP_SERVICES_API_KEY")
          ) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: msg,
            });
          }
          throw e;
        }

        const choice = result.choices[0];
        if (!choice) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No response from AI provider" });
        }

        const responseContent = typeof choice.message.content === "string"
          ? choice.message.content
          : Array.isArray(choice.message.content)
            ? choice.message.content
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map(p => p.text)
                .join("")
            : "";

        const now = Date.now();
        const userMsg = { role: "user" as const, content: input.message, timestamp: now };
        const assistantMsg = { role: "assistant" as const, content: responseContent, timestamp: now + 1 };

        const updatedMessages = [...existingMessages, userMsg, assistantMsg];

        if (conversationId) {
          await db.updateAiConversation(conversationId, updatedMessages);
        } else {
          conversationId = await db.createAiConversationReturningId({
            userId: ctx.user.id,
            provider: llmProviderLabel,
            productId: input.productId,
            messages: updatedMessages,
          });
        }

        return {
          response: responseContent,
          conversationId,
        };
      }),
  }),

  // Feed — brand news/commercials for owned brands + activity
  feed: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { instances, history } = await db.getUserFeedData(ctx.user.id);
      const items: FeedItem[] = [];

      const now = Date.now();
      const DAY_MS = 86_400_000;

      for (const item of instances) {
        if (!item.product) continue;

        items.push({
          id: `added-${item.instance.id}`,
          type: "product_added",
          title: "Product Added",
          content: `You added ${item.product.name} to your collection.`,
          timestamp: new Date(item.instance.addedAt).toISOString(),
          productId: item.product.id,
          productName: item.product.name,
          productImageUrl: item.product.imageUrl,
        });

        if (item.instance.warrantyExpiry) {
          const expiryTime = new Date(item.instance.warrantyExpiry).getTime();
          const daysUntilExpiry = Math.ceil((expiryTime - now) / DAY_MS);

          if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
            items.push({
              id: `warranty-${item.instance.id}`,
              type: "warranty_alert",
              title: "Warranty Reminder",
              content: `Your ${item.product.name} warranty expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}. Consider registering for extended coverage.`,
              timestamp: new Date(now - DAY_MS).toISOString(),
              productId: item.product.id,
              productName: item.product.name,
              productImageUrl: item.product.imageUrl,
            });
          }
        }

        const meta = item.product.metadata;
        if (meta?.careInstructions?.length) {
          const tip = meta.careInstructions[Math.floor(Math.random() * meta.careInstructions.length)];
          items.push({
            id: `care-${item.instance.id}`,
            type: "care_tip",
            title: "Product Care Tip",
            content: `${item.product.name}: ${tip}`,
            timestamp: new Date(now - 2 * DAY_MS).toISOString(),
            productId: item.product.id,
            productName: item.product.name,
            productImageUrl: item.product.imageUrl,
          });
        }

        if (meta?.sustainabilityScore !== undefined) {
          const score = meta.sustainabilityScore;
          const rating = score >= 80 ? "excellent" : score >= 60 ? "good" : "moderate";
          items.push({
            id: `sustainability-${item.instance.id}`,
            type: "sustainability_insight",
            title: "Sustainability Insight",
            content: `${item.product.name} has a ${rating} sustainability score of ${score}/100.`,
            timestamp: new Date(now - 3 * DAY_MS).toISOString(),
            productId: item.product.id,
            productName: item.product.name,
            productImageUrl: item.product.imageUrl,
          });
        }
      }

      for (const scan of history) {
        if (!scan.product) continue;
        items.push({
          id: `scan-${scan.history.id}`,
          type: "product_scanned",
          title: "Product Scanned",
          content: `You scanned ${scan.product.name}.`,
          timestamp: new Date(scan.history.scannedAt).toISOString(),
          productId: scan.product.id,
          productName: scan.product.name,
          productImageUrl: scan.product.imageUrl,
        });
      }

      const brandDisplayByKey = new Map<string, string>();
      const brandKeySet = new Set<string>();
      for (const row of instances) {
        const name = row.product?.brand;
        if (!name) continue;
        const key = db.normalizeBrandKey(name);
        if (!key) continue;
        brandKeySet.add(key);
        if (!brandDisplayByKey.has(key)) {
          brandDisplayByKey.set(key, name.trim());
        }
      }

      const curated = await db.getBrandFeedItemsForBrands(Array.from(brandKeySet), 40);
      for (const row of curated) {
        const link = safeHttpUrl(row.linkUrl);
        items.push({
          id: `brand-${row.kind}-${row.id}`,
          type: row.kind === "news" ? "brand_news" : "brand_commercial",
          title: row.title,
          content: row.summary,
          timestamp: new Date(row.publishedAt).toISOString(),
          linkUrl: link ?? null,
          feedImageUrl: row.imageUrl?.trim() ? row.imageUrl.trim() : null,
          brand: brandDisplayByKey.get(row.brandKey) ?? row.brandKey,
        });
      }

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, 80);
    }),
  }),

  // Product sharing
  sharing: router({
    createShareLink: protectedProcedure
      .input(z.object({ productInstanceId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const instance = await db.getProductInstanceById(input.productInstanceId, ctx.user.id);
        if (!instance) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product instance not found or not owned by you",
          });
        }

        const share = await db.createProductShare(input.productInstanceId, ctx.user.id);
        const protocol = ctx.req.protocol || "https";
        const host = ctx.req.get?.("host") ?? ctx.req.headers?.host ?? "";
        const baseUrl = host ? `${protocol}://${host}` : "";
        return {
          shareToken: share.shareToken,
          shareUrl: `${baseUrl}/share/${share.shareToken}`,
        };
      }),

    getByToken: protectedProcedure
      .input(z.object({ token: z.string().min(1).max(64) }))
      .query(async ({ input }) => {
        const result = await db.getShareByToken(input.token);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found or expired" });
        }
        return result;
      }),

    accept: protectedProcedure
      .input(z.object({ token: z.string().min(1).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.getShareByToken(input.token);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found" });
        }
        if (result.share.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This share has already been used" });
        }
        if (result.share.senderUserId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot accept your own share" });
        }

        await db.acceptShare(result.share.id, ctx.user.id);

        return { success: true as const, productId: result.product.id };
      }),

    dismiss: protectedProcedure
      .input(z.object({ token: z.string().min(1).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.getShareByToken(input.token);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found" });
        }
        if (result.share.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This share has already been used" });
        }
        if (result.share.senderUserId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot dismiss your own share" });
        }

        await db.dismissShare(result.share.id);
        return { success: true as const };
      }),

    revoke: protectedProcedure
      .input(z.object({ shareId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.revokeShare(input.shareId, ctx.user.id);
        return { success: true as const };
      }),

    sharedWithMe: protectedProcedure.query(async ({ ctx }) => {
      return db.getSharedWithMe(ctx.user.id);
    }),

    myOutgoingShares: protectedProcedure.query(async ({ ctx }) => {
      return db.getMyOutgoingShares(ctx.user.id);
    }),
  }),

  // Product documents
  documents: router({
    list: protectedProcedure
      .input(z.object({ productInstanceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const documents = await db.getProductDocuments(input.productInstanceId, ctx.user.id);
        return documents;
      }),

    upload: protectedProcedure
      .input(z.object({
        productInstanceId: z.number(),
        documentType: z.enum(['receipt', 'photo', 'manual', 'note']),
        title: z.string().max(200).optional(),
        fileName: z.string().max(200),
        mimeType: z.string().max(100),
        base64Data: z.string().max(10_000_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const instance = await db.getProductInstanceById(input.productInstanceId, ctx.user.id);
        if (!instance) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product instance not found" });
        }

        const { storagePut } = await import("./storage");

        const buffer = Buffer.from(input.base64Data, "base64");
        const key = `documents/${ctx.user.id}/${input.productInstanceId}/${Date.now()}-${input.fileName}`;

        const { url, key: storedKey } = await storagePut(key, buffer, input.mimeType);

        await db.createProductDocument({
          productInstanceId: input.productInstanceId,
          userId: ctx.user.id,
          documentType: input.documentType,
          title: input.title ?? input.fileName,
          fileUrl: url,
          fileKey: storedKey,
          mimeType: input.mimeType,
        });

        return { success: true, fileUrl: url };
      }),

    create: protectedProcedure
      .input(z.object({
        productInstanceId: z.number(),
        documentType: z.enum(['receipt', 'photo', 'manual', 'note']),
        title: z.string().max(200).optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        mimeType: z.string().optional(),
        textContent: z.string().max(10_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createProductDocument({
          productInstanceId: input.productInstanceId,
          userId: ctx.user.id,
          documentType: input.documentType,
          title: input.title,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          mimeType: input.mimeType,
          textContent: input.textContent,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteProductDocument(input.documentId, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
