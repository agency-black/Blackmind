Errores de módulo de depuración no encontrado

❌
✅
✅
❌

---
description: Systematically resolve "Cannot find module" errors
---

1. **Check the Import Path**:
   - 
setups)
   - 

 `import { foo } from '../components/Foo'` (missing file extension in some 

 `import { foo } from '../components/Foo.tsx'` or use path aliases

2. **Verify Module is Installed**:
   - Check if it exists in `node_modules`.
   // turbo
   - Run `ls node_modules/<package-name>`
   - If missing, install it:
   // turbo
   - Run `npm install <package-name>`

3. **Check Case Sensitivity**:
   - macOS/Windows are case-insensitive, but Linux (and CI/CD) is not.
   - 
   - 

 `import Foo from './foo'` when file is `Foo.tsx`
 `import Foo from './Foo'`

4. **Clear Module Cache**:
   - Delete `.next`, `node_modules/.cache`, and rebuild.
   // turbo
   - Run `rm -rf .next node_modules/.cache && npm run dev`

5. **Check TypeScript Path Aliases**:
   - Ensure `tsconfig.json` paths match your imports.
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

6. **Monorepo/Workspace Issues**:
   - If using pnpm/yarn workspaces, ensure the package is linked.

   // turbo
   - Run `pnpm install` or `yarn install`

7. **Pro Tips**:
   - Use absolute imports with `@/` to avoid `../../../../` hell.
   - Run `npm ls <package-name>` to check which version is installed.
   - Check for typos in package names (e.g., `react-router-dom` vs `react-
router`).

