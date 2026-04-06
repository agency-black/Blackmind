Configurar el Service Worker para trabajar sin conexión

---
description: Enable offline functionality
---

1. **Install Workbox**:
   // turbo
   - Run `npm install next-pwa`

2. **Configure**:
   ```js
   const withPWA = require('next-pwa')({
     dest: 'public'
   });
   module.exports = withPWA({});
   ```

3. **Create Manifest**:
   ```json
   {
     "name": "My App",
     "short_name": "App",
     "start_url": "/",
     "display": "standalone"
   }
   ```

4. **Pro Tips**:
   - Test in Chrome DevTools.
   - Cache static assets.

