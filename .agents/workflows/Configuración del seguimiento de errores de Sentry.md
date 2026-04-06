Configuración del seguimiento de errores de Sentry

---
description: Track and debug production errors with Sentry
---

1. **Install Sentry SDK**:
   - Install the Next.js SDK.
   // turbo
   - Run `npm install @sentry/nextjs`

2. **Initialize Sentry**:
   - Run the wizard.
   // turbo
   - Run `npx @sentry/wizard@latest -i nextjs`
   - This creates `sentry.client.config.ts`, `sentry.server.config.ts`, and updates 
`next.config.js`.

3. **Configure Environment Variables**:
   - Add to `.env.local`.
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

4. **Test Error Tracking**:
   - Trigger a test error.
   ```tsx
   // app/test-error/page.tsx
   export default function TestError() {
     return (
       <button onClick={() => {
         throw new Error('Sentry Test Error');
       }}>
         Trigger Error
       </button>
     );
   }
   ```

5. **Capture User Context**:
   - Add user info to errors.
   ```ts
   import * as Sentry from '@sentry/nextjs';

   Sentry.setUser({
     id: user.id,
     email: user.email,
     username: user.name,
   });
   ```

6. **Track Performance**:
   - Sentry automatically tracks Core Web Vitals.
   - Set sample rate in config.
   ```ts
   Sentry.init({
     tracesSampleRate: 0.1, // 10% of transactions
   });
   ```

7. **Pro Tips**:
   - Set up email/Slack alerts for critical errors.
   - Use source maps to see original code in stack traces.
   - Filter out known errors (e.g., browser extensions).
   - Create releases to track errors by deployment.

   
