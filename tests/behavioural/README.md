# Behavioural Tests

Tests for Tachikoma's decision-making logic and workflow execution.

## Purpose

Ensure that Tachikoma routes tasks correctly, selects appropriate strategies, and completes workflows properly.

## Test Files

- `routing-logic.test.ts` - Intent classification, complexity detection, strategy selection
- `workflow-execution.test.ts` - PAUL phases, skill chains, state management
- `verifier.test.ts` - Verification Loop tests (AC-1, AC-2)
- `intent-router.test.ts` - Intent Router tests (AC-3)
- `context-manager.test.ts` - Context Manager tests
- `model-harness.test.ts` - Model Harness tests
- `rlm-handler.ts` - RLM Handler tests

## Running Tests

```bash
bun test tests/behavioural/
```

## What Gets Tested

✅ **Routing Logic**
- Intent classification accuracy
- Complexity level detection (low/medium/high/very high)
- Strategy selection (direct/skill-chain/RLM)
- Edge cases: ambiguous queries, conflicting intents
- Route priority and fallback behavior
- Confidence threshold tuning
- Low confidence clarification handling

✅ **Workflow Execution**
- PAUL phase transitions (PLAN → APPLY → UNIFY)
- Skill chain execution
- State management and transitions
- Error recovery and retry logic
- Tool usage patterns
- Verification loop completion

✅ **Verification Loop** (verifier.test.ts)
- Criteria extraction for various task types
- Generator-Verifier-Reviser pattern implementation
- GVR loop iteration (max 3 iterations)
- Reflection step handling
- Critical domain identification
- Verification logic for specific scenarios

✅ **Intent Router** (intent-router.test.ts)
- Intent classification across 9 intent types
- Complexity detection and level classification
- Strategy selection across 4 strategies
- Confidence threshold testing
- Edge cases for routing decisions

✅ **Context Manager** (context-manager.test.ts)
- AGENTS.md loading from project root
- Context module loading for agent modules
- Position-aware context optimization
- Token estimation for context sizing

✅ **Model Harness** (model-harness.test.ts)
- Model family detection (Claude, GPT, Gemini, etc.)
- Edit format selection based on model
- Edit execution with various formats
- Format compatibility validation

✅ **RLM Handler** (rlm-handler.ts)
- Small context handling (direct execution)
- Adaptive chunking for large contexts
- Parallel processing implementation
- Metadata-only history management
- RLM orchestration for recursive problems

## Expected Test Count

- Routing logic: 10+ test cases
- Workflow execution: 6+ test cases
- verifier.test.ts: 6 test scenarios
- intent-router.ts: 8 test scenarios
- context-manager.ts: 6 test scenarios
- model-harness.ts: 7 test scenarios
- rlm-handler.ts: 6 test scenarios
- **Total: 53 tests** in behavioural category

## Acceptance Criteria

- AC-3: Given routing logic tests, When test queries are provided, Then the correct intent, complexity level, and strategy are selected
- AC-4: Given workflow execution tests, When a PAUL workflow is initiated, Then all phases (PLAN → APPLY → UNIFY) complete with proper state transitions

## Notes

**Migrated from src/**
- All 5 test files were moved from `src/test-*.ts` to `tests/behavioural/`
- Import paths were updated to use relative imports
- Tests maintain their original functionality and test coverage
- Total test count increased from 48 to 103 tests in behavioural category
- */
