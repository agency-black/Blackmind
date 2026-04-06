Configurar Monorepo con Turborepo

---
description: Configure Turborepo for fast monorepo builds
---

1. **Install Turborepo**:
   - Initialize in existing repo.
   // turbo
   - Run `npx create-turbo@latest`
   - Or add to existing: `npm install turbo --save-dev`

2. **Configure turbo.json**:
   - Define pipeline and caching.
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": [".next/**", "dist/**"]
       },
       "dev": {
         "cache": false,
         "persistent": true
       },
       "lint": {
         "dependsOn": ["^lint"]
       }
     }
   }
   ```

3. **Setup Remote Caching**:
   - Link to Vercel for team caching.
   // turbo
   - Run `npx turbo login`
   // turbo
   - Run `npx turbo link`

4. **Run Tasks**:
   - Build all packages.
   // turbo
   - Run `turbo run build`

   - Build specific package: `turbo run build --filter=web`

5. **CI/CD Optimization**:
   - Only build affected packages.
   ```yaml
   # GitHub Actions
   - run: npx turbo run build --filter=[HEAD^1]
   ```

6. **Pro Tips**:
   - Use `--force` to bypass cache when needed.
   - Remote caching saves hours in CI/CD.
   - Structure: `apps/` for deployables, `packages/` for shared code.

