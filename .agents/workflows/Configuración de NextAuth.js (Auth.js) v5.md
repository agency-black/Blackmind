Configuración de NextAuth.js (Auth.js) v5

---
description: Complete boilerplate for secure authentication with Google/GitHub
---

1. **Install Dependencies**:
   - Install the NextAuth.js beta version.
   // turbo
   - Run `npm install next-auth@beta`

2. **Setup Environment Variables**:
   - Add to `.env.local`:
   ```bash
   AUTH_SECRET="your-secret-here"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```
   - Generate `AUTH_SECRET` with: `openssl rand -base64 32`

3. **Create Auth Config (`auth.ts`)**:
   - Create `src/auth.ts` to export your auth configuration.
   ```ts
   import NextAuth from "next-auth"
   import Google from "next-auth/providers/google"

   export const { handlers, auth, signIn, signOut } = NextAuth({
     providers: [
       Google({
         clientId: process.env.AUTH_GOOGLE_ID!,
         clientSecret: process.env.AUTH_GOOGLE_SECRET!,
       })
     ],
   })
   ```

4. **Create Route Handler**:
   - Create `src/app/api/auth/[...nextauth]/route.ts`.
   ```ts
   import { handlers } from "@/auth"
   export const { GET, POST } = handlers
   ```

5. **Middleware Protection**:
   - Protect your routes using middleware in `src/middleware.ts`.
   ```ts
   export { auth as middleware } from "@/auth"

   export const config = {
     matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
   }
   ```

6. **Pro Tips**:
   - Get Google OAuth credentials from Google Cloud Console.
   - Use the `useSession` hook on the client to access user data.
   - For GitHub: `npm install next-auth@beta` and use `GitHub` provider.

   
