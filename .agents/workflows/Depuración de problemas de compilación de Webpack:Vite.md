Depuración de problemas de compilación de Webpack/Vite

---
description: Troubleshoot common bundler errors and slow builds
---

1. **Build Fails with Module Parse Error**:
   - Usually missing a loader for file type.
   - **Check**: Do you have the right loader installed?
   ```bash
   # For CSS
   npm install --save-dev css-loader style-loader
   # For images
   npm install --save-dev file-loader
   ```

2. **Build is Extremely Slow**:
   - Check bundle size.
   // turbo
   - Run `npm run build -- --profile --json > stats.json`
   - Analyze at https://webpack.github.io/analyse/

3. **Memory Issues (JavaScript heap out of memory)**:
   - Increase Node memory limit.
   ```json
   // package.json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
     }
   }
   ```

4. **Circular Dependency Warnings**:
   - Find the cycle using the error message.
   - Refactor to break the cycle (move shared code to a new file).

5. **Environment Variables Not Working**:
   - Ensure they're prefixed correctly:
     - **Vite**: `VITE_` prefix
     - **Next.js**: `NEXT_PUBLIC_` prefix (for client)
   - Restart dev server after changing `.env`.

6. **Vite Specific: Pre-bundling Issues**:

   - Clear Vite cache.
   // turbo
   - Run `rm -rf node_modules/.vite && npm run dev`

7. **Webpack Specific: Source Maps**:
   - Disable in production for smaller bundles.
   ```js
   // next.config.js
   module.exports = {
     productionBrowserSourceMaps: false,
   };
   ```

8. **Pro Tips**:
   - Use `ANALYZE=true npm run build` to visualize bundle size.
   - Remove unused dependencies to speed up builds.
   - Use SWC instead of Babel (Next.js default).

