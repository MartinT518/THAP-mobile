/**
 * Ask AI Question Framework
 * Based on Master's Thesis Research: Context-Aware AI Communication in Digital Product Management
 * 
 * This framework implements a multi-layered approach to product-related questions:
 * 1. Product Lifecycle Stages (Discovery, Ownership, End-of-Life)
 * 2. Universal Question Categories (8 categories applicable to all products)
 * 3. Domain-Specific Questions (tailored to product categories)
 * 4. Dynamic Context-Aware Selection Logic
 */

// ===== PRODUCT LIFECYCLE STAGES =====

export enum ProductLifecycleStage {
  DISCOVERY = "discovery",     // User is exploring, considering purchase
  OWNERSHIP = "ownership",      // Product is owned by user
  END_OF_LIFE = "end_of_life"  // User wants to dispose/resell
}

// ===== UNIVERSAL QUESTION CATEGORIES =====

export enum QuestionCategory {
  PRODUCT_INFO = "product_info",               // Basic product identification and features
  QUALITY_MATERIALS = "quality_materials",     // Composition, origin, durability, standards
  PRICE_VALUE = "price_value",                 // Economic value over time
  USAGE_MAINTENANCE = "usage_maintenance",     // Longevity and problem prevention
  COMPATIBILITY = "compatibility",             // Ecosystem integration, accessories
  WARRANTY_SUPPORT = "warranty_support",       // Post-purchase confidence
  SUSTAINABILITY = "sustainability",           // Environmental impact, conscious consumption
  RESALE_REUSE = "resale_reuse"               // End-of-life activities
}

// ===== PRODUCT CATEGORIES =====

export enum ProductCategory {
  ELECTRONICS = "electronics",
  CLOTHING_FOOTWEAR = "clothing_footwear",
  FURNITURE_TOOLS = "furniture_tools",
  VEHICLES_BICYCLES = "vehicles_bicycles",
  HOME_APPLIANCES = "home_appliances",
  TOYS_KIDS = "toys_kids",
  OTHER = "other"
}

// ===== QUESTION INTERFACE =====

export interface AIQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  lifecycleStages: ProductLifecycleStage[];
  productCategories: ProductCategory[];  // Empty array = universal (all categories)
  priority: number;  // Higher = more important
}

// ===== UNIVERSAL QUESTIONS (MVP: 10 questions) =====

export const UNIVERSAL_QUESTIONS: AIQuestion[] = [
  // Product Info
  {
    id: "univ_001",
    text: "What are the key features and specifications of this product?",
    category: QuestionCategory.PRODUCT_INFO,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [],
    priority: 10
  },
  {
    id: "univ_002",
    text: "How does this product compare to similar alternatives?",
    category: QuestionCategory.PRODUCT_INFO,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [],
    priority: 9
  },
  
  // Quality & Materials
  {
    id: "univ_003",
    text: "What materials is this product made from and where is it manufactured?",
    category: QuestionCategory.QUALITY_MATERIALS,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [],
    priority: 8
  },
  
  // Price & Value
  {
    id: "univ_004",
    text: "What is the current market price and is this a good deal?",
    category: QuestionCategory.PRICE_VALUE,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [],
    priority: 10
  },
  {
    id: "univ_005",
    text: "What is the estimated resale value of this product?",
    category: QuestionCategory.PRICE_VALUE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP, ProductLifecycleStage.END_OF_LIFE],
    productCategories: [],
    priority: 7
  },
  
  // Usage & Maintenance
  {
    id: "univ_006",
    text: "How do I properly maintain and care for this product?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [],
    priority: 9
  },
  
  // Warranty & Support
  {
    id: "univ_007",
    text: "What warranty coverage does this product have?",
    category: QuestionCategory.WARRANTY_SUPPORT,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [],
    priority: 8
  },
  {
    id: "univ_008",
    text: "Where can I find authorized service centers or support?",
    category: QuestionCategory.WARRANTY_SUPPORT,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [],
    priority: 7
  },
  
  // Sustainability
  {
    id: "univ_009",
    text: "What is the environmental impact and sustainability score of this product?",
    category: QuestionCategory.SUSTAINABILITY,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [],
    priority: 6
  },
  
  // Resale & Reuse
  {
    id: "univ_010",
    text: "What are the best options for selling or donating this product?",
    category: QuestionCategory.RESALE_REUSE,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [],
    priority: 9
  }
];

// ===== ELECTRONICS-SPECIFIC QUESTIONS (MVP: 10 questions) =====

export const ELECTRONICS_QUESTIONS: AIQuestion[] = [
  {
    id: "elec_001",
    text: "How can I optimize battery life and charging habits?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 10
  },
  {
    id: "elec_002",
    text: "Are software updates still available for this device?",
    category: QuestionCategory.WARRANTY_SUPPORT,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 9
  },
  {
    id: "elec_003",
    text: "What are common failures or issues with this model?",
    category: QuestionCategory.QUALITY_MATERIALS,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 8
  },
  {
    id: "elec_004",
    text: "Is this device compatible with my existing tech ecosystem?",
    category: QuestionCategory.COMPATIBILITY,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 9
  },
  {
    id: "elec_005",
    text: "What accessories or add-ons are recommended for this device?",
    category: QuestionCategory.COMPATIBILITY,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 7
  },
  {
    id: "elec_006",
    text: "How repairable is this device and where can I get spare parts?",
    category: QuestionCategory.SUSTAINABILITY,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 8
  },
  {
    id: "elec_007",
    text: "What is the expected lifespan of this device?",
    category: QuestionCategory.QUALITY_MATERIALS,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 8
  },
  {
    id: "elec_008",
    text: "How should I properly dispose of or recycle this electronic device?",
    category: QuestionCategory.RESALE_REUSE,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 9
  },
  {
    id: "elec_009",
    text: "What data should I backup or erase before selling this device?",
    category: QuestionCategory.RESALE_REUSE,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 10
  },
  {
    id: "elec_010",
    text: "Are there any known security vulnerabilities or recalls for this model?",
    category: QuestionCategory.WARRANTY_SUPPORT,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.ELECTRONICS],
    priority: 9
  }
];

// ===== CLOTHING & FOOTWEAR QUESTIONS (MVP: 10 questions) =====

export const CLOTHING_QUESTIONS: AIQuestion[] = [
  {
    id: "cloth_001",
    text: "How should I wash this item to prevent shrinking or damage?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 10
  },
  {
    id: "cloth_002",
    text: "Does this brand's sizing match standard size charts?",
    category: QuestionCategory.PRODUCT_INFO,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 9
  },
  {
    id: "cloth_003",
    text: "Is this product ethically produced and sustainable?",
    category: QuestionCategory.SUSTAINABILITY,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 8
  },
  {
    id: "cloth_004",
    text: "What fabric composition and care instructions apply to this item?",
    category: QuestionCategory.QUALITY_MATERIALS,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 9
  },
  {
    id: "cloth_005",
    text: "How durable is this material and how long will it last?",
    category: QuestionCategory.QUALITY_MATERIALS,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 7
  },
  {
    id: "cloth_006",
    text: "Can this item be repaired or altered if damaged?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 7
  },
  {
    id: "cloth_007",
    text: "What is the best way to store this item when not in use?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 6
  },
  {
    id: "cloth_008",
    text: "Where can I resell or donate this clothing item?",
    category: QuestionCategory.RESALE_REUSE,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 9
  },
  {
    id: "cloth_009",
    text: "What is the typical resale value for this brand and condition?",
    category: QuestionCategory.PRICE_VALUE,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 8
  },
  {
    id: "cloth_010",
    text: "Can this item be recycled or upcycled instead of discarded?",
    category: QuestionCategory.SUSTAINABILITY,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.CLOTHING_FOOTWEAR],
    priority: 7
  }
];

// ===== FURNITURE & TOOLS QUESTIONS (MVP: 10 questions) =====

export const FURNITURE_TOOLS_QUESTIONS: AIQuestion[] = [
  {
    id: "furn_001",
    text: "When should I perform regular maintenance on this tool?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 9
  },
  {
    id: "furn_002",
    text: "Where can I find replacement parts or accessories?",
    category: QuestionCategory.COMPATIBILITY,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 9
  },
  {
    id: "furn_003",
    text: "How do I troubleshoot error codes or common issues?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 10
  },
  {
    id: "furn_004",
    text: "What materials is this furniture made from?",
    category: QuestionCategory.QUALITY_MATERIALS,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 8
  },
  {
    id: "furn_005",
    text: "How do I clean or maintain this furniture piece?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 9
  },
  {
    id: "furn_006",
    text: "How do I assemble or disassemble this item?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP, ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 8
  },
  {
    id: "furn_007",
    text: "What is the weight capacity or load limit?",
    category: QuestionCategory.PRODUCT_INFO,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 8
  },
  {
    id: "furn_008",
    text: "Is this tool suitable for professional or only DIY use?",
    category: QuestionCategory.PRODUCT_INFO,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 7
  },
  {
    id: "furn_009",
    text: "How can I safely dispose of or recycle this item?",
    category: QuestionCategory.RESALE_REUSE,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 8
  },
  {
    id: "furn_010",
    text: "What is the expected lifespan and durability of this product?",
    category: QuestionCategory.QUALITY_MATERIALS,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.FURNITURE_TOOLS],
    priority: 8
  }
];

// ===== VEHICLES & BICYCLES QUESTIONS (MVP: 10 questions) =====

export const VEHICLES_BICYCLES_QUESTIONS: AIQuestion[] = [
  {
    id: "veh_001",
    text: "What is the recommended tire pressure for this vehicle?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 9
  },
  {
    id: "veh_002",
    text: "What is the maintenance schedule for chain or brake service?",
    category: QuestionCategory.USAGE_MAINTENANCE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 10
  },
  {
    id: "veh_003",
    text: "What is the average resale value for this model and condition?",
    category: QuestionCategory.PRICE_VALUE,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP, ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 9
  },
  {
    id: "veh_004",
    text: "Are there any recalls or safety notices for this model?",
    category: QuestionCategory.WARRANTY_SUPPORT,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 10
  },
  {
    id: "veh_005",
    text: "What accessories or upgrades are compatible with this model?",
    category: QuestionCategory.COMPATIBILITY,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 7
  },
  {
    id: "veh_006",
    text: "How fuel-efficient or energy-efficient is this vehicle?",
    category: QuestionCategory.SUSTAINABILITY,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 8
  },
  {
    id: "veh_007",
    text: "What are common mechanical issues with this model?",
    category: QuestionCategory.QUALITY_MATERIALS,
    lifecycleStages: [ProductLifecycleStage.DISCOVERY, ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 9
  },
  {
    id: "veh_008",
    text: "Where can I find service manuals or repair guides?",
    category: QuestionCategory.WARRANTY_SUPPORT,
    lifecycleStages: [ProductLifecycleStage.OWNERSHIP],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 8
  },
  {
    id: "veh_009",
    text: "What is the best platform to sell this vehicle?",
    category: QuestionCategory.RESALE_REUSE,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 9
  },
  {
    id: "veh_010",
    text: "How do I prepare this vehicle for sale or trade-in?",
    category: QuestionCategory.RESALE_REUSE,
    lifecycleStages: [ProductLifecycleStage.END_OF_LIFE],
    productCategories: [ProductCategory.VEHICLES_BICYCLES],
    priority: 8
  }
];

// ===== COMBINED QUESTION POOL =====

export const ALL_QUESTIONS: AIQuestion[] = [
  ...UNIVERSAL_QUESTIONS,
  ...ELECTRONICS_QUESTIONS,
  ...CLOTHING_QUESTIONS,
  ...FURNITURE_TOOLS_QUESTIONS,
  ...VEHICLES_BICYCLES_QUESTIONS
];

// ===== DYNAMIC QUESTION SELECTION LOGIC =====

export interface QuestionSelectionContext {
  lifecycleStage: ProductLifecycleStage;
  productCategory: ProductCategory;
  isOwned: boolean;
  hasVerifiedData?: boolean;  // DPP or verified source
}

/**
 * Selects relevant questions based on context
 * Implements the dynamic selection logic from the thesis research
 */
export function selectRelevantQuestions(
  context: QuestionSelectionContext,
  maxQuestions: number = 8
): AIQuestion[] {
  const { lifecycleStage, productCategory, isOwned } = context;
  
  // Filter questions by lifecycle stage and product category
  let relevantQuestions = ALL_QUESTIONS.filter(q => {
    // Check lifecycle stage match
    const stageMatch = q.lifecycleStages.includes(lifecycleStage);
    
    // Check product category match (empty array = universal)
    const categoryMatch = 
      q.productCategories.length === 0 || 
      q.productCategories.includes(productCategory);
    
    return stageMatch && categoryMatch;
  });
  
  // Sort by priority (higher first)
  relevantQuestions.sort((a, b) => b.priority - a.priority);
  
  // Return top N questions
  return relevantQuestions.slice(0, maxQuestions);
}

/**
 * Determines lifecycle stage based on ownership status
 */
export function determineLifecycleStage(isOwned: boolean, isWishlisted: boolean = false): ProductLifecycleStage {
  if (isOwned) {
    return ProductLifecycleStage.OWNERSHIP;
  } else if (isWishlisted) {
    return ProductLifecycleStage.DISCOVERY;
  } else {
    return ProductLifecycleStage.DISCOVERY;
  }
}

/**
 * Maps product category string to ProductCategory enum
 */
export function mapProductCategory(category: string | null | undefined): ProductCategory {
  if (!category) return ProductCategory.OTHER;
  
  const normalized = category.toLowerCase();
  
  if (normalized.includes("electron") || normalized.includes("tech") || normalized.includes("device")) {
    return ProductCategory.ELECTRONICS;
  } else if (normalized.includes("cloth") || normalized.includes("apparel") || normalized.includes("fashion") || normalized.includes("shoe")) {
    return ProductCategory.CLOTHING_FOOTWEAR;
  } else if (normalized.includes("furniture") || normalized.includes("tool") || normalized.includes("appliance")) {
    return ProductCategory.FURNITURE_TOOLS;
  } else if (normalized.includes("vehicle") || normalized.includes("bike") || normalized.includes("bicycle") || normalized.includes("car")) {
    return ProductCategory.VEHICLES_BICYCLES;
  }
  
  return ProductCategory.OTHER;
}
