import { eq, desc, and, inArray, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  products, 
  productInstances, 
  scanHistory,
  aiConversations,
  aiProviderSettings,
  productDocuments,
  InsertProduct,
  InsertProductInstance,
  InsertScanHistory,
  InsertAiConversation,
  InsertAiProviderSetting,
  InsertProductDocument
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { encrypt, decrypt } from './_core/crypto';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "languageCode", "countryCode", "postalCode"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Product functions
export async function upsertProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(product).onDuplicateKeyUpdate({
    set: {
      name: product.name,
      brand: product.brand,
      model: product.model,
      category: product.category,
      imageUrl: product.imageUrl,
      barcode: product.barcode,
      metadata: product.metadata,
      updatedAt: new Date(),
    },
  });

  return result;
}

export async function getProductByProductId(productId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.productId, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Product instance functions (user-owned products)
export async function createProductInstance(instance: InsertProductInstance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(productInstances).values(instance);
  return result;
}

export async function getUserProductInstances(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      instance: productInstances,
      product: products,
    })
    .from(productInstances)
    .leftJoin(products, eq(productInstances.productId, products.id))
    .where(eq(productInstances.userId, userId))
    .orderBy(desc(productInstances.addedAt));

  return result;
}

export async function getProductInstanceById(instanceId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      instance: productInstances,
      product: products,
    })
    .from(productInstances)
    .leftJoin(products, eq(productInstances.productId, products.id))
    .where(and(
      eq(productInstances.id, instanceId),
      eq(productInstances.userId, userId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function deleteProductInstance(instanceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(productInstances).where(
    and(
      eq(productInstances.id, instanceId),
      eq(productInstances.userId, userId)
    )
  );
}

// Scan history functions
export async function addToScanHistory(history: InsertScanHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scanHistory).values(history);
  return result;
}

export async function getUserScanHistory(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      history: scanHistory,
      product: products,
    })
    .from(scanHistory)
    .leftJoin(products, eq(scanHistory.productId, products.id))
    .where(eq(scanHistory.userId, userId))
    .orderBy(desc(scanHistory.scannedAt))
    .limit(limit);

  return result;
}

// AI provider settings functions
export async function upsertAiProviderSetting(setting: InsertAiProviderSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const encryptedKey = encrypt(setting.apiKey);

  const result = await db.insert(aiProviderSettings).values({
    ...setting,
    apiKey: encryptedKey,
  }).onDuplicateKeyUpdate({
    set: {
      apiKey: encryptedKey,
      isActive: setting.isActive,
      updatedAt: new Date(),
    },
  });

  return result;
}

export async function getUserAiProviderSettings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(aiProviderSettings)
    .where(eq(aiProviderSettings.userId, userId));

  return result.map(row => ({ ...row, apiKey: decrypt(row.apiKey) }));
}

export async function getActiveAiProvider(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(aiProviderSettings)
    .where(and(
      eq(aiProviderSettings.userId, userId),
      eq(aiProviderSettings.isActive, true)
    ))
    .limit(1);

  if (result.length === 0) return undefined;
  return { ...result[0], apiKey: decrypt(result[0].apiKey) };
}

// AI conversation functions
export async function createAiConversation(conversation: InsertAiConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(aiConversations).values(conversation);
  return result;
}

export async function updateAiConversation(conversationId: number, messages: InsertAiConversation['messages']) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(aiConversations)
    .set({ messages, updatedAt: new Date() })
    .where(eq(aiConversations.id, conversationId));
}

export async function getUserAiConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt));

  return result;
}

export async function getAiConversationById(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(aiConversations)
    .where(and(
      eq(aiConversations.id, conversationId),
      eq(aiConversations.userId, userId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAiConversationByProductId(productId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(aiConversations)
    .where(and(
      eq(aiConversations.productId, productId),
      eq(aiConversations.userId, userId)
    ))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createAiConversationReturningId(conversation: InsertAiConversation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(aiConversations).values(conversation);
  return result[0].insertId;
}

// Product document functions
export async function createProductDocument(document: InsertProductDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(productDocuments).values(document);
  return result;
}

export async function getProductDocuments(productInstanceId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(productDocuments)
    .where(and(
      eq(productDocuments.productInstanceId, productInstanceId),
      eq(productDocuments.userId, userId)
    ))
    .orderBy(desc(productDocuments.createdAt));

  return result;
}

export async function deleteProductDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(productDocuments).where(
    and(
      eq(productDocuments.id, documentId),
      eq(productDocuments.userId, userId)
    )
  );
}

// Cleanup functions — remove duplicate entries per user
export async function removeDuplicateProductInstances(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userProducts = await getUserProductInstances(userId);
  const seenProductIds = new Set<number>();
  const duplicateInstanceIds: number[] = [];

  for (const item of userProducts) {
    if (item.product && seenProductIds.has(item.product.id)) {
      duplicateInstanceIds.push(item.instance.id);
    } else if (item.product) {
      seenProductIds.add(item.product.id);
    }
  }

  if (duplicateInstanceIds.length > 0) {
    await db.delete(productInstances).where(
      inArray(productInstances.id, duplicateInstanceIds)
    );
  }

  return duplicateInstanceIds.length;
}

export async function removeDuplicateScanHistory(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await getUserScanHistory(userId);
  const seenProductIds = new Set<number>();
  const duplicateScanIds: number[] = [];

  for (const item of history) {
    if (item.product && seenProductIds.has(item.product.id)) {
      duplicateScanIds.push(item.history.id);
    } else if (item.product) {
      seenProductIds.add(item.product.id);
    }
  }

  if (duplicateScanIds.length > 0) {
    await db.delete(scanHistory).where(
      inArray(scanHistory.id, duplicateScanIds)
    );
  }

  return duplicateScanIds.length;
}

// User preferences functions
export async function updateUserPreferences(
  userId: number,
  preferences: { languageCode?: string; countryCode?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<Pick<InsertUser, 'languageCode' | 'countryCode'>> = {};
  if (preferences.languageCode !== undefined) {
    updateData.languageCode = preferences.languageCode;
  }
  if (preferences.countryCode !== undefined) {
    updateData.countryCode = preferences.countryCode;
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}

export async function updateUserProfile(
  userId: number,
  profile: { name?: string; email?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<Pick<InsertUser, 'name' | 'email'>> = {};
  if (profile.name !== undefined) updateData.name = profile.name;
  if (profile.email !== undefined) updateData.email = profile.email;

  if (Object.keys(updateData).length > 0) {
    await db.update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}


// Feed data: recent activity + warranty alerts
export async function getUserFeedData(userId: number) {
  const [instances, history] = await Promise.all([
    getUserProductInstances(userId),
    getUserScanHistory(userId, 20),
  ]);
  return { instances, history };
}

// Search product by barcode or productId string
export async function searchProductByIdentifier(identifier: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(products)
    .where(
      or(
        eq(products.productId, identifier),
        eq(products.barcode, identifier),
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Delete a single scan history entry
export async function deleteScanHistoryEntry(historyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(scanHistory).where(
    and(
      eq(scanHistory.id, historyId),
      eq(scanHistory.userId, userId)
    )
  );
}

// Delete all scan history for a user
export async function clearScanHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(scanHistory).where(eq(scanHistory.userId, userId));
}

// Update product instance
type InstanceUpdateFields = Partial<Pick<InsertProductInstance,
  'nickname' | 'purchaseDate' | 'purchasePrice' | 'purchaseLocation' | 'warrantyExpiry' | 'notes' | 'tags'
>>;

export async function updateProductInstance(
  instanceId: number,
  userId: number,
  updates: InstanceUpdateFields
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: InstanceUpdateFields & { updatedAt?: Date } = {};

  if (updates.nickname !== undefined) updateData.nickname = updates.nickname;
  if (updates.purchaseDate !== undefined) updateData.purchaseDate = updates.purchaseDate;
  if (updates.purchasePrice !== undefined) updateData.purchasePrice = updates.purchasePrice;
  if (updates.purchaseLocation !== undefined) updateData.purchaseLocation = updates.purchaseLocation;
  if (updates.warrantyExpiry !== undefined) updateData.warrantyExpiry = updates.warrantyExpiry;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.tags !== undefined) updateData.tags = updates.tags;

  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();

    await db.update(productInstances)
      .set(updateData)
      .where(and(
        eq(productInstances.id, instanceId),
        eq(productInstances.userId, userId)
      ));
  }
}

export async function deleteUserAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(productDocuments).where(eq(productDocuments.userId, userId));
  await db.delete(aiConversations).where(eq(aiConversations.userId, userId));
  await db.delete(aiProviderSettings).where(eq(aiProviderSettings.userId, userId));
  await db.delete(scanHistory).where(eq(scanHistory.userId, userId));
  await db.delete(productInstances).where(eq(productInstances.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
