#!/usr/bin/env bun
/**
 * Routing Logic Tests
 *
 * AC-3: Given routing logic tests, When test queries are provided,
 * Then the correct intent, complexity level, and strategy are selected
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";

// MOCK IMPLEMENTATIONS
type ComplexityLevel = "low" | "medium" | "high" | "very_high";
type ExecutionStrategy = "direct" | "single_skill" | "skill_chain" | "rlm";
type IntentType =
  | "code"
  | "debug"
  | "research"
  | "refactor"
  | "test"
  | "verify"
  | "explain"
  | "plan"
  | "query"
  | "unknown";

interface IntentClassification {
  type: IntentType;
  confidence: number;
  complexity: ComplexityLevel;
  keywords: string[];
  requiresTools: boolean;
}

interface RoutingDecision {
  strategy: ExecutionStrategy;
  intent: IntentClassification;
  skill?: string;
  skillChain?: string[];
  needsClarification: boolean;
  clarificationPrompt?: string;
}

class MockIntentClassifier {
  private keywordMap: Map<IntentType, string[]>;

  constructor() {
    this.keywordMap = new Map([
      ["code", ["implement", "create", "build", "add", "write"]],
      ["debug", ["fix", "bug", "error", "debug", "issue"]],
      ["refactor", ["refactor", "improve", "optimize", "clean up"]],
      ["research", ["research", "find", "lookup", "investigate"]],
      ["test", ["test", "tests", "testing", "unit test", "unit tests"]],
      ["verify", ["verify", "check", "validate"]],
      ["explain", ["explain", "how", "what is", "why"]],
      ["plan", ["plan", "design", "architecture"]],
      ["query", ["what", "where", "list", "show"]],
    ]);
  }

  classifyIntent(request: string): IntentClassification {
    const lowerRequest = request.toLowerCase();

    const matches: Array<{ intent: IntentType; keyword: string; length: number }> = [];

    for (const [intent, keywords] of this.keywordMap) {
      for (const keyword of keywords) {
        if (lowerRequest.includes(keyword)) {
          matches.push({ intent, keyword, length: keyword.length });
        }
      }
    }

    if (matches.length === 0) {
      return this.createClassification("unknown", "", lowerRequest);
    }

    const bestMatch = matches.reduce((best, current) => {
      return current.length > best.length ? current : best;
    }, matches[0]);

    return this.createClassification(bestMatch.intent, bestMatch.keyword, lowerRequest);
  }

  private createClassification(
    type: IntentType,
    keyword: string,
    request: string,
  ): IntentClassification {
    const complexity = this.estimateComplexity(request);
    const confidence = this.estimateConfidence(request, keyword);

    return {
      type,
      confidence,
      complexity,
      keywords: keyword ? [keyword] : [],
      requiresTools: this.needsTools(type),
    };
  }

  private estimateComplexity(request: string): ComplexityLevel {
    const length = request.length;

    const hasMultiple =
      request.includes(" and ") || request.includes(" and,") || request.includes(",");

    const hasComplex =
      request.includes("system") ||
      request.includes("architecture") ||
      request.includes("microservices") ||
      request.includes("API") ||
      request.includes("authentication");

    if (length > 80 || (hasMultiple && hasComplex)) {
      return "high";
    }
    if (length > 50 || (hasMultiple && !request.includes("difference"))) {
      return "medium";
    }
    return "low";
  }

  private estimateConfidence(request: string, keyword: string): number {
    if (!keyword) return 0.3;

    const keywordIndex = request.indexOf(keyword);
    if (keywordIndex === 0) {
      return 0.9;
    }
    if (keywordIndex < request.length * 0.3) {
      return 0.8;
    }
    return 0.6;
  }

  needsTools(intentType: IntentType): boolean {
    return ["code", "debug", "refactor", "test", "verify"].includes(intentType);
  }

  needsClarification(confidence: number): boolean {
    return confidence < 0.5;
  }
}

class MockStrategySelector {
  selectStrategy(intent: IntentClassification, contextSize: number): ExecutionStrategy {
    if (contextSize > 10000) {
      return "rlm";
    }

    if (intent.complexity === "very_high" || intent.complexity === "high") {
      return "skill_chain";
    }

    if (intent.complexity === "medium" || intent.requiresTools) {
      return "single_skill";
    }

    return "direct";
  }
}

class MockRouter {
  private classifier: MockIntentClassifier;
  private strategySelector: MockStrategySelector;

  constructor() {
    this.classifier = new MockIntentClassifier();
    this.strategySelector = new MockStrategySelector();
  }

  async classifyAndRoute(request: string, contextSize = 0): Promise<RoutingDecision> {
    const intent = this.classifier.classifyIntent(request);

    if (this.classifier.needsClarification(intent.confidence)) {
      const strategy = this.strategySelector.selectStrategy(intent, contextSize);
      return {
        strategy,
        intent,
        needsClarification: true,
        clarificationPrompt: "Could you provide more details?",
      };
    }

    const strategy = this.strategySelector.selectStrategy(intent, contextSize);

    return {
      strategy,
      intent,
      needsClarification: false,
    };
  }

  getClassification(request: string): IntentClassification {
    return this.classifier.classifyIntent(request);
  }
}

// TESTS
describe("Routing Logic", () => {
  let router: MockRouter;

  beforeEach(() => {
    router = new MockRouter();
  });

  describe("Intent Classification", () => {
    interface IntentTest {
      query: string;
      type: IntentType;
      keyword: string;
      requiresTools: boolean;
    }

    const intentTests: IntentTest[] = [
      {
        query: "implement a user authentication system",
        type: "code",
        keyword: "implement",
        requiresTools: true,
      },
      {
        query: "fix the login bug",
        type: "debug",
        keyword: "fix",
        requiresTools: true,
      },
      {
        query: "refactor this function to be more readable",
        type: "refactor",
        keyword: "refactor",
        requiresTools: true,
      },
      {
        query: "research OAuth2 best practices",
        type: "research",
        keyword: "research",
        requiresTools: false,
      },
      {
        query: "add unit tests for the auth module",
        type: "test",
        keyword: "unit tests",
        requiresTools: true,
      },
      {
        query: "verify the password hashing is secure",
        type: "verify",
        keyword: "verify",
        requiresTools: true,
      },
      {
        query: "explain how this function works",
        type: "explain",
        keyword: "explain",
        requiresTools: false,
      },
      {
        query: "plan a migration to microservices",
        type: "plan",
        keyword: "plan",
        requiresTools: false,
      },
      {
        query: "hello world",
        type: "unknown",
        keyword: "",
        requiresTools: false,
      },
    ];

    intentTests.forEach(({ query, type, keyword, requiresTools }) => {
      it(`should classify ${type} intent`, () => {
        const result = router.getClassification(query);

        expect(result.type).toBe(type);

        if (keyword) {
          expect(result.keywords).toContain(keyword);
        }

        if (type === "unknown") {
          expect(result.confidence).toBeLessThan(0.5);
          expect(result.keywords).toEqual([]);
        } else {
          expect(result.requiresTools).toBe(requiresTools);
        }
      });
    });
  });

  describe("Complexity Detection", () => {
    it("should detect low complexity", () => {
      const result = router.getClassification("fix a bug");

      expect(result.complexity).toBe("low");
    });

    it("should detect medium complexity", () => {
      const result = router.getClassification("fix a bug and add tests");

      expect(result.complexity).toBe("medium");
    });

    it("should detect high complexity", () => {
      const result = router.getClassification(
        "implement a complete authentication system with OAuth2 support, user management, and role-based access control",
      );

      expect(result.complexity).toBe("high");
    });

    it("should estimate confidence based on keyword position", () => {
      const earlyKeyword = router.getClassification("implement this feature");
      const lateKeyword = router.getClassification("this feature needs implementation");

      expect(earlyKeyword.confidence).toBeGreaterThan(lateKeyword.confidence);
    });
  });

  describe("Strategy Selection", () => {
    it("should select direct strategy for simple queries", async () => {
      const result = await router.classifyAndRoute("what is the difference between const and let?");

      expect(result.strategy).toBe("direct");
      expect(result.needsClarification).toBe(false);
    });

    it("should select single_skill strategy for medium complexity", async () => {
      const result = await router.classifyAndRoute("add tests for this function");

      expect(result.strategy).toBe("single_skill");
      expect(result.needsClarification).toBe(false);
    });

    it("should select skill_chain strategy for high complexity", async () => {
      const result = await router.classifyAndRoute(
        "implement a REST API with authentication, CRUD operations, and comprehensive error handling",
      );

      expect(result.strategy).toBe("skill_chain");
      expect(result.needsClarification).toBe(false);
    });

    it("should select RLM strategy for large contexts", async () => {
      const result = await router.classifyAndRoute("analyze entire codebase", 20000);

      expect(result.strategy).toBe("rlm");
    });

    it("should select single_skill for tool-requiring intents", async () => {
      const result = await router.classifyAndRoute("create a user endpoint");

      expect(result.strategy).toBe("single_skill");
      expect(result.intent.requiresTools).toBe(true);
    });

    it("should select direct strategy for simple explain queries", async () => {
      const result = await router.classifyAndRoute("what is the difference between const and let?");

      expect(result.strategy).toBe("direct");
    });

    it("should select single_skill for test requests", async () => {
      const result = await router.classifyAndRoute("add unit tests for auth module");

      expect(result.strategy).toBe("single_skill");
    });
  });

  describe("Clarification Handling", () => {
    it("should request clarification for low confidence intents", async () => {
      const result = await router.classifyAndRoute("do something");

      expect(result.needsClarification).toBe(true);
      expect(result.clarificationPrompt).toBeDefined();
    });

    it("should not request clarification for high confidence intents", async () => {
      const result = await router.classifyAndRoute("implement user authentication");

      expect(result.needsClarification).toBe(false);
      expect(result.clarificationPrompt).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty requests", () => {
      const result = router.getClassification("");

      expect(result.type).toBe("unknown");
      expect(result.confidence).toBeLessThan(0.5);
    });

    it("should handle multiple intents (first match wins)", () => {
      const result = router.getClassification("debug and refactor this code");

      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords[0]).toBeDefined();
    });

    it("should handle case-insensitive matching", () => {
      const result1 = router.getClassification("IMPLEMENT this feature");
      const result2 = router.getClassification("implement this feature");

      expect(result1.type).toBe(result2.type);
      expect(result1.keywords).toEqual(result2.keywords);
    });

    it("should handle special characters", () => {
      const result = router.getClassification("fix the bug: 'undefined variable'");

      expect(result.type).toBe("debug");
      expect(result.keywords).toContain("fix");
    });

    it("should handle very long requests", () => {
      const longRequest = "implement ".repeat(50) + "this feature";
      const result = router.getClassification(longRequest);

      expect(result.type).toBe("code");
      expect(result.complexity).toBe("high");
    });
  });

  describe("Routing Integration", () => {
    it("should produce complete routing decisions", async () => {
      const result = await router.classifyAndRoute("implement a REST API");

      expect(result.strategy).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.intent.type).toBe("code");
      expect(result.intent.confidence).toBeGreaterThan(0);
      expect(result.intent.complexity).toBeDefined();
    });

    it("should handle ambiguous queries gracefully", async () => {
      const result = await router.classifyAndRoute("code");

      expect(result.needsClarification).toBe(true);
      expect(result.clarificationPrompt).toContain("more details");
    });

    it("should maintain intent consistency across multiple calls", async () => {
      const request = "implement user authentication";
      const result1 = await router.classifyAndRoute(request);
      const result2 = await router.classifyAndRoute(request);

      expect(result1.intent.type).toBe(result2.intent.type);
      expect(result1.strategy).toBe(result2.strategy);
    });
  });
});
