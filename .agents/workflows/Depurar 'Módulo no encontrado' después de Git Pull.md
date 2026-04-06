Depurar 'Módulo no encontrado' después de Git Pull

---
description: Fix dependency issues after pulling changes from Git
---

1. **Clear Node Modules Cache**:
   - Remove cached modules and reinstall.
   // turbo
   - Run `rm -rf node_modules .next && npm install`

2. **Check for Lockfile Conflicts**:
   - Look for merge conflicts in package-lock.json.
   // turbo
   - Run `git diff package-lock.json`
   - If conflicted, regenerate: `rm package-lock.json && npm install`

3. **Install Missing Peer Dependencies**:
   - Check for peer dependency warnings.
   // turbo
   - Run `npm install --legacy-peer-deps`

4. **Fix Monorepo Workspace Issues**:
   - If using pnpm workspaces, reinstall from root.
   // turbo
   - Run `pnpm install --force`

5. **Update TypeScript Paths**:
   - Regenerate path mappings if tsconfig changed.
   // turbo
   - Run `npx tsc --noEmit`

6. **Pro Tips**:
   - Use `npm ci` instead of `npm install` in CI/CD for reproducible builds.
   - Check if `.npmrc` or `.yarnrc` was updated.
   - Restart your IDE/TypeScript server after reinstalling.

