# Quality Tests

Tests for the structure and format of Tachikoma's outputs.

## Purpose

Ensure that all agent outputs are well-structured, follow markdown standards, and contain valid code.

## Test Files

- `markdown-validation.test.ts` - Markdown structure, headings, sections
- `code-quality.test.ts` - TypeScript syntax, type checking, best practices
- `output-structure.test.ts` - Response format, required fields, tool calls

## Running Tests

```bash
bun test tests/quality/
```

## What Gets Tested

✅ **Markdown Validation**
- Required sections presence (## Research:, ### Findings:, etc.)
- Heading hierarchy (H1 → H2 → H3)
- Code block formatting with language tags
- Placeholder detection ({{, }}, TODO:)
- Structure compliance per response type
- Link validation
- Line length limits
- Trailing whitespace

✅ **Code Quality**
- TypeScript syntax validation
- Type checking of code blocks
- Best practices compliance
- Code style checks (naming, formatting)
- Error handling presence
- Security patterns

✅ **Output Structure**
- Response type formatting
- Required fields present
- Tool call validation
- Template cleanup
- No orphaned references
- Proper escaping

## Expected Test Count

- Markdown validation: 8+ test cases
- Code quality: 5+ test cases
- Output structure: 6+ test cases

## Acceptance Criteria

AC-5: Given markdown validation tests, When agent output is analyzed, Then required sections are present, heading hierarchy is correct, and no template placeholders remain

AC-6: Given code quality tests, When code blocks are extracted from responses, Then the code is syntactically valid and follows TypeScript best practices
