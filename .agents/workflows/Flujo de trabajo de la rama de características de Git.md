Flujo de trabajo de la rama de características de Git

Create a workflow to start new feature branches synchronized with main.

Workflow File: .agent/workflows/start_feature.md

```markdown
---
description: Start a new feature branch synchronized with main
---

1. Ask the user for the name of the feature (e.g., "user-auth").
2. Switch to the main branch to ensure we start fresh.
// turbo
3. Run `git checkout main`
4. Pull the latest changes from the remote repository.
// turbo
5. Run `git pull origin main`
6. Create and switch to the new feature branch.
// turbo
7. Run `git checkout -b feature/[feature-name]`
```

Usage:
- Say "Start a new feature" or use /start_feature
- AI will ask for feature name
- Commands run automatically with turbo

Benefits:
- Ensures clean start from main
- Prevents merge conflicts
- Standardizes branch naming
- Saves time on repetitive commands

Variations:
- Add linting check before branch creation
- Include initial commit with boilerplate
- Add branch protection checks

