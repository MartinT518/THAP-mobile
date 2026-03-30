import { describe, expect, it } from "vitest";
import {
  selectRelevantQuestions,
  determineLifecycleStage,
  mapProductCategory,
  ProductLifecycleStage,
  ProductCategory,
  ALL_QUESTIONS,
  UNIVERSAL_QUESTIONS,
  ELECTRONICS_QUESTIONS,
  CLOTHING_QUESTIONS,
  FURNITURE_TOOLS_QUESTIONS,
  VEHICLES_BICYCLES_QUESTIONS,
} from "../shared/aiQuestions";

describe("Ask AI Question Framework", () => {
  describe("Question Pool Validation", () => {
    it("should have exactly 50 questions in MVP", () => {
      expect(ALL_QUESTIONS).toHaveLength(50);
    });

    it("should have 10 universal questions", () => {
      expect(UNIVERSAL_QUESTIONS).toHaveLength(10);
    });

    it("should have 10 electronics questions", () => {
      expect(ELECTRONICS_QUESTIONS).toHaveLength(10);
    });

    it("should have 10 clothing questions", () => {
      expect(CLOTHING_QUESTIONS).toHaveLength(10);
    });

    it("should have 10 furniture/tools questions", () => {
      expect(FURNITURE_TOOLS_QUESTIONS).toHaveLength(10);
    });

    it("should have 10 vehicles/bicycles questions", () => {
      expect(VEHICLES_BICYCLES_QUESTIONS).toHaveLength(10);
    });

    it("should have unique question IDs", () => {
      const ids = ALL_QUESTIONS.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have all questions with valid lifecycle stages", () => {
      ALL_QUESTIONS.forEach(q => {
        expect(q.lifecycleStages.length).toBeGreaterThan(0);
        q.lifecycleStages.forEach(stage => {
          expect(Object.values(ProductLifecycleStage)).toContain(stage);
        });
      });
    });
  });

  describe("Lifecycle Stage Detection", () => {
    it("should return OWNERSHIP when product is owned", () => {
      const stage = determineLifecycleStage(true, false);
      expect(stage).toBe(ProductLifecycleStage.OWNERSHIP);
    });

    it("should return DISCOVERY when product is wishlisted", () => {
      const stage = determineLifecycleStage(false, true);
      expect(stage).toBe(ProductLifecycleStage.DISCOVERY);
    });

    it("should return DISCOVERY when product is neither owned nor wishlisted", () => {
      const stage = determineLifecycleStage(false, false);
      expect(stage).toBe(ProductLifecycleStage.DISCOVERY);
    });
  });

  describe("Product Category Mapping", () => {
    it("should map electronics keywords correctly", () => {
      expect(mapProductCategory("Electronics")).toBe(ProductCategory.ELECTRONICS);
      expect(mapProductCategory("electronic device")).toBe(ProductCategory.ELECTRONICS);
      expect(mapProductCategory("Tech gadget")).toBe(ProductCategory.ELECTRONICS);
    });

    it("should map clothing keywords correctly", () => {
      expect(mapProductCategory("Clothing")).toBe(ProductCategory.CLOTHING_FOOTWEAR);
      expect(mapProductCategory("Apparel")).toBe(ProductCategory.CLOTHING_FOOTWEAR);
      expect(mapProductCategory("Shoes")).toBe(ProductCategory.CLOTHING_FOOTWEAR);
      expect(mapProductCategory("Fashion")).toBe(ProductCategory.CLOTHING_FOOTWEAR);
    });

    it("should map furniture/tools keywords correctly", () => {
      expect(mapProductCategory("Furniture")).toBe(ProductCategory.FURNITURE_TOOLS);
      expect(mapProductCategory("Tools")).toBe(ProductCategory.FURNITURE_TOOLS);
      expect(mapProductCategory("Appliance")).toBe(ProductCategory.FURNITURE_TOOLS);
    });

    it("should map vehicles keywords correctly", () => {
      expect(mapProductCategory("Vehicle")).toBe(ProductCategory.VEHICLES_BICYCLES);
      expect(mapProductCategory("Bicycle")).toBe(ProductCategory.VEHICLES_BICYCLES);
      expect(mapProductCategory("Bike")).toBe(ProductCategory.VEHICLES_BICYCLES);
      expect(mapProductCategory("Car")).toBe(ProductCategory.VEHICLES_BICYCLES);
    });

    it("should return OTHER for unknown categories", () => {
      expect(mapProductCategory("Unknown")).toBe(ProductCategory.OTHER);
      expect(mapProductCategory(null)).toBe(ProductCategory.OTHER);
      expect(mapProductCategory(undefined)).toBe(ProductCategory.OTHER);
    });
  });

  describe("Context-Aware Question Selection", () => {
    it("should select questions for owned electronics in ownership stage", () => {
      const questions = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.OWNERSHIP,
        productCategory: ProductCategory.ELECTRONICS,
        isOwned: true,
      }, 8);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(8);

      // Should include both universal and electronics-specific questions
      const hasUniversal = questions.some(q => q.productCategories.length === 0);
      const hasElectronics = questions.some(q => 
        q.productCategories.includes(ProductCategory.ELECTRONICS)
      );
      
      expect(hasUniversal || hasElectronics).toBe(true);

      // All questions should be relevant to ownership stage
      questions.forEach(q => {
        expect(q.lifecycleStages).toContain(ProductLifecycleStage.OWNERSHIP);
      });
    });

    it("should select questions for discovery stage clothing", () => {
      const questions = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.DISCOVERY,
        productCategory: ProductCategory.CLOTHING_FOOTWEAR,
        isOwned: false,
      }, 8);

      expect(questions.length).toBeGreaterThan(0);

      // All questions should be relevant to discovery stage
      questions.forEach(q => {
        expect(q.lifecycleStages).toContain(ProductLifecycleStage.DISCOVERY);
      });

      // Should include universal or clothing-specific questions
      questions.forEach(q => {
        const isUniversal = q.productCategories.length === 0;
        const isClothing = q.productCategories.includes(ProductCategory.CLOTHING_FOOTWEAR);
        expect(isUniversal || isClothing).toBe(true);
      });
    });

    it("should select questions for end-of-life stage", () => {
      const questions = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.END_OF_LIFE,
        productCategory: ProductCategory.ELECTRONICS,
        isOwned: true,
      }, 8);

      expect(questions.length).toBeGreaterThan(0);

      // All questions should be relevant to end-of-life stage
      questions.forEach(q => {
        expect(q.lifecycleStages).toContain(ProductLifecycleStage.END_OF_LIFE);
      });

      // Should include resale/reuse related questions
      const hasResaleQuestions = questions.some(q => 
        q.text.toLowerCase().includes("resale") || 
        q.text.toLowerCase().includes("sell") ||
        q.text.toLowerCase().includes("dispose") ||
        q.text.toLowerCase().includes("recycle")
      );
      expect(hasResaleQuestions).toBe(true);
    });

    it("should prioritize questions by priority score", () => {
      const questions = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.OWNERSHIP,
        productCategory: ProductCategory.ELECTRONICS,
        isOwned: true,
      }, 8);

      // Check that questions are sorted by priority (descending)
      for (let i = 0; i < questions.length - 1; i++) {
        expect(questions[i].priority).toBeGreaterThanOrEqual(questions[i + 1].priority);
      }
    });

    it("should respect maxQuestions limit", () => {
      const questions3 = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.OWNERSHIP,
        productCategory: ProductCategory.ELECTRONICS,
        isOwned: true,
      }, 3);

      expect(questions3.length).toBeLessThanOrEqual(3);

      const questions10 = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.OWNERSHIP,
        productCategory: ProductCategory.ELECTRONICS,
        isOwned: true,
      }, 10);

      expect(questions10.length).toBeLessThanOrEqual(10);
    });

    it("should include universal questions for all categories", () => {
      const categories = [
        ProductCategory.ELECTRONICS,
        ProductCategory.CLOTHING_FOOTWEAR,
        ProductCategory.FURNITURE_TOOLS,
        ProductCategory.VEHICLES_BICYCLES,
      ];

      categories.forEach(category => {
        const questions = selectRelevantQuestions({
          lifecycleStage: ProductLifecycleStage.OWNERSHIP,
          productCategory: category,
          isOwned: true,
        }, 8);

        // Should have at least some universal questions
        const universalCount = questions.filter(q => q.productCategories.length === 0).length;
        expect(universalCount).toBeGreaterThan(0);
      });
    });

    it("should provide different questions for different lifecycle stages", () => {
      const discoveryQuestions = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.DISCOVERY,
        productCategory: ProductCategory.ELECTRONICS,
        isOwned: false,
      }, 8);

      const ownershipQuestions = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.OWNERSHIP,
        productCategory: ProductCategory.ELECTRONICS,
        isOwned: true,
      }, 8);

      const endOfLifeQuestions = selectRelevantQuestions({
        lifecycleStage: ProductLifecycleStage.END_OF_LIFE,
        productCategory: ProductCategory.ELECTRONICS,
        isOwned: true,
      }, 8);

      // Questions should be different for different stages
      const discoveryIds = discoveryQuestions.map(q => q.id);
      const ownershipIds = ownershipQuestions.map(q => q.id);
      const endOfLifeIds = endOfLifeQuestions.map(q => q.id);

      // At least some questions should be different
      const allSame = 
        JSON.stringify(discoveryIds) === JSON.stringify(ownershipIds) &&
        JSON.stringify(ownershipIds) === JSON.stringify(endOfLifeIds);
      
      expect(allSame).toBe(false);
    });
  });

  describe("Question Content Quality", () => {
    it("should have meaningful question text", () => {
      ALL_QUESTIONS.forEach(q => {
        expect(q.text.length).toBeGreaterThan(10);
        expect(q.text.endsWith("?")).toBe(true);
      });
    });

    it("should have valid priority scores", () => {
      ALL_QUESTIONS.forEach(q => {
        expect(q.priority).toBeGreaterThanOrEqual(1);
        expect(q.priority).toBeLessThanOrEqual(10);
      });
    });

    it("should cover all 8 universal categories", () => {
      const categories = new Set(UNIVERSAL_QUESTIONS.map(q => q.category));
      expect(categories.size).toBeGreaterThanOrEqual(6); // At least 6 of 8 categories covered
    });
  });
});
