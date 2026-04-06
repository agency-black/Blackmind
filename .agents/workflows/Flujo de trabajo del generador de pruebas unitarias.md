Flujo de trabajo del generador de pruebas unitarias

Automatically generate unit test files for existing components or functions.

Workflow File: .agent/workflows/generate_test.md

```markdown
---
description: Generate a unit test file for an existing component or function
---

1. Ask the user for the relative path of the file they want to test.
2. Read the content of the target file to understand its logic.
3. Create a new test file in the same directory with `.test.js` extension.
4. Write comprehensive unit tests for the exported functions using standard Jest/
React Testing Library syntax.
5. Verify that all imports in the test file are correct.
```

Usage:
- Say "Generate tests for [filename]" or use /generate_test
- Provide path to file to test
- AI reads file and creates comprehensive tests

Benefits:
- Saves time writing boilerplate tests
- Ensures test coverage
- Uses best practices (Jest/RTL)
- Tests all exported functions
- Correct import paths

Generated Test Structure:
- describe blocks for each function/component
- Multiple test cases per function
- Edge case testing
- Mock setup when needed
- Proper assertions

Customization:
- Add snapshot testing
- Include integration tests
- Add coverage thresholds
- Support different test frameworks

