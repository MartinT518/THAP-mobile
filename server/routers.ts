import { COOKIE_NAME, AXIOS_TIMEOUT_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import axios from "axios";
import * as db from "./db";

const TINGS_API_BASE = "https://tingsapi.test.mindworks.ee";

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

    lookupByQR: protectedProcedure
      .input(z.object({ payload: z.string().min(1).max(2000) }))
      .mutation(async ({ input }) => {
        const { payload } = input;

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
            `${TINGS_API_BASE}/api/products/search`,
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

        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found. The scanned code did not match any known product.",
        });
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
        language: ctx.user.languageCode || 'en',
        country: ctx.user.countryCode || null,
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
        await db.addToScanHistory({
          userId: ctx.user.id,
          productId: input.productId,
        });
        return { success: true };
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

        const result = await invokeLLM({ messages: llmMessages });

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
            provider: "forge",
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

  // Feed — dynamic activity feed
  feed: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { instances, history } = await db.getUserFeedData(ctx.user.id);
      const items: Array<{
        id: string;
        type: "product_added" | "product_scanned" | "warranty_alert" | "care_tip" | "sustainability_insight";
        title: string;
        content: string;
        timestamp: string;
        productId?: number;
        productName?: string;
        productImageUrl?: string | null;
      }> = [];

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

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return items.slice(0, 50);
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
