Actualizar todas las dependencias

⚠

---
description: Interactively check and update outdated packages
---

1. **Check for Updates**:
   - Use `npm-check-updates` to see what's new.
   // turbo
   - Run `npx npm-check-updates`

 **WARNING**: Always review major version changes before updating!

2. **Review Changes**:
   - 
   - Check changelogs for breaking changes.
   - Look for major version bumps (e.g., 1.x.x → 2.x.x).

3. **Update package.json**:
   - Update versions in your package file.
   // turbo
   - Run `npx npm-check-updates -u`

4. **Install New Versions**:
   - Install the updated packages.
   // turbo
   - Run `npm install`

5. **Test Thoroughly**:
   - Run your tests immediately after updating.
   // turbo
   - Run `npm test`

6. **Pro Tips**:
   - Use `-i` for interactive mode to selectively update: `npx ncu -i`.
   - Update only minor/patch versions: `npx ncu -u --target minor`.
   - Check for peer dependency conflicts with `npm ls`.

API segura de CSRF

---
description: Prevent CSRF attacks
---

1. **Use SameSite Cookies**:
   ```ts
   response.headers.set('Set-Cookie', 'token=abc; SameSite=Strict; HttpOnly');
   ```

2. **Implement CSRF Tokens**:
   ```ts
   import { randomBytes } from 'crypto';
   export function generateCSRFToken() {
     return randomBytes(32).toString('hex');
   }
   ```

3. **Validate Origin**:
   ```ts
   const origin = request.headers.get('origin');
   if (!allowedOrigins.includes(origin)) {
     return Response.json({ error: 'Invalid origin' }, { status: 403 });
   }
   ```

4. **Pro Tips**:
   - Never use `*` in production.
   - Validate both token and origin.

Auditoría de accesibilidad (a11y)

---
description: Find and fix accessibility violations
---

1. **Install axe-core**:
   - Use the CLI tool for quick audits.
   // turbo
   - Run `npm install -g @axe-core/cli`

2. **Run Audit**:
   - Check a specific URL. Replace with your local or prod URL.
   // turbo
   - Run `axe http://localhost:3000`

3. **Pro Tips**:
   - Use the **Lighthouse** Accessibility audit in Chrome DevTools for a visual 
report.
   - Aim for 100% accessibility score; it helps SEO too.

Cómo sincronizar una bifurcación (de la manera correcta)

---
description: Keep your fork up-to-date with the original repo
---

1. **Add Upstream Remote**:
   - Check if you already have it.
   // turbo
   - Run `git remote -v`
   - If not, add it (replace `[original-repo-url]` with the actual URL):
   // turbo
   - Run `git remote add upstream [original-repo-url]`

2. **Fetch Upstream Changes**:
   - Fetch the latest branches and commits from the upstream repository.
   // turbo
   - Run `git fetch upstream`

3. **Merge into Main**:
   - Switch to your local main branch.
   // turbo
   - Run `git checkout main`
   - Merge the upstream changes.
   // turbo
   - Run `git merge upstream/main`

4. **Push to Your Fork**:
   - Update your fork on GitHub/GitLab.
   // turbo
   - Run `git push origin main`

5. **Pro Tips**:
   - Always sync `main` before creating a new feature branch.
   - Never commit directly to `main` on a fork; always use feature branches.

Comprobación previa al vuelo

---
description: Run type checking, linting, and build verification before pushing
---

1. **Type Check**:
   - Ensure there are no TypeScript errors.
   // turbo
   - Run `npx tsc --noEmit`

2. **Lint Check**:
   - Verify code quality rules.
   // turbo
   - Run `npm run lint`

3. **Build Verification**:
   - Ensure the project builds successfully for production.
   // turbo
   - Run `npm run build`

4. **Pro Tips**:
   - Use a pre-push git hook (using `husky`) to run this automatically.
   - If the build fails locally, it will definitely fail in production.

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

   
Configuración de pruebas E2E (Dramaturgo)

---
description: Boilerplate setup for end-to-end testing
---

1. **Initialize Playwright**:
   - Run the init command.
   // turbo
   - Run `npm init playwright@latest`

2. **Run Tests**:
   - Execute the example tests.
   // turbo
   - Run `npx playwright test`

3. **Show Report**:
   - View the HTML test report.
   // turbo
   - Run `npx playwright show-report`

4. **Pro Tips**:
   - Use the VS Code Playwright extension for a great developer experience.
   - Use `codegen` to record your clicks and generate test code automatically: 
`npx playwright codegen`.

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

   
Configurar base de datos local (Postgres)

---
description: Quick setup for a local Postgres database using Docker
---

1. **Install Docker Desktop**:
   - If you don't have Docker installed, download and install Docker Desktop 
for your OS.
   // turbo
   - Run `open https://www.docker.com/products/docker-desktop/`

2. **Create `docker-compose.yml`**:
   - Create a `docker-compose.yml` file in your project root.
   ```yaml
   version: '3.8'
   services:
     db:
       image: postgres:16-alpine
       restart: always
       environment:
         POSTGRES_DB: mydatabase
         POSTGRES_USER: myuser
         POSTGRES_PASSWORD: mypassword
       ports:
         - "5432:5432"
       volumes:
         - db_data:/var/lib/postgresql/data
   volumes:
     db_data:
   ```

3. **Start Database**:
   - Navigate to your project root and start the Docker containers.
   // turbo
   - Run `docker-compose up -d`

4. **Connect to Database**:
   - Use a client like `psql`, `DBeaver`, or `TablePlus` with:
     - Host: `localhost`
     - Port: `5432`
     - User: `myuser`
     - Password: `mypassword`
     - Database: `mydatabase`

5. **Pro Tips**:
   - To stop the database: `docker-compose down`.
   - To remove all data (use with caution!): `docker-compose down -v`.
   - Add `docker-compose.yml` to your `.gitignore` if you don't want to 
commit it.

Configurar el espacio de trabajo multiraíz de VS Code

---
description: Configure VS Code for monorepo development
---

1. **Create Workspace File**:
   - Create `my-project.code-workspace`.
   ```json
   {
     "folders": [
       { "path": "packages/web", "name": "Web App" },
       { "path": "packages/api", "name": "API" },
       { "path": "packages/shared", "name": "Shared" }
     ],
     "settings": {
       "typescript.tsdk": "node_modules/typescript/lib",
       "eslint.workingDirectories": [
         { "mode": "auto" }
       ]
     }
   }
   ```

2. **Open Workspace**:
   - File → Open Workspace from File → Select `.code-workspace`.

3. **Configure Per-Folder Settings**:
   - Each folder can have its own `.vscode/settings.json`.
   ```json
   {
     "editor.formatOnSave": true,
     "typescript.tsdk": "../../node_modules/typescript/lib"
   }
   ```

4. **Debug Multiple Services**:
   - Create compound launch config in `.vscode/launch.json`.
   ```json
   {
     "compounds": [
       {
         "name": "Full Stack",
         "configurations": ["Web", "API"]

       }
     ],
     "configurations": [
       {
         "name": "Web",
         "type": "node",
         "request": "launch",
         "runtimeExecutable": "npm",
         "runtimeArgs": ["run", "dev"],
         "cwd": "${workspaceFolder:Web App}"
       }
     ]
   }
   ```

5. **Pro Tips**:
   - Use workspace recommendations for extensions.
   - Share workspace file in Git for team consistency.
   - Use `${workspaceFolder:name}` to reference specific folders.

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

Configurar implementaciones de vista previa

---
description: Auto-deploy PRs
---

1. **Create GitHub Action**:
   ```yaml
   name: Preview
   on:
     pull_request:
       types: [opened, synchronize]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npm run build
         - uses: amondnet/vercel-action@v25
   ```

2. **Comment PR**:
   - Add deployment URL to PR comments.

3. **Pro Tips**:
   - Add E2E tests.
   - Clean up old previews.

Configurar la internacionalización (i18n)

---
description: Configure next-intl for multi-language support
---

1. **Install next-intl**:
   - Install the library.
   // turbo
   - Run `npm install next-intl`

2. **Create Messages**:
   - Create `messages/en.json` and `messages/es.json`.
   ```json
   {
     "Index": {
       "title": "Hello world!"
     }
   }
   ```

3. **Configure Middleware**:
   - Create `src/middleware.ts` to handle locale routing.
   ```ts
   import createMiddleware from 'next-intl/middleware';

   export default createMiddleware({
     locales: ['en', 'es', 'fr'],
     defaultLocale: 'en'
   });

   export const config = {
     matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
   };
   ```

4. **Create i18n Config**:
   - Create `src/i18n.ts` for message loading.
   ```ts
   import { getRequestConfig } from 'next-intl/server';

   export default getRequestConfig(async ({ locale }) => ({
     messages: (await import(`../messages/${locale}.json`)).default
   }));

   
   
   
   ```

5. **Pro Tips**:
   - Keep your translation keys organized by page or component.
   - Use the `useTranslations` hook in client components.
   - Use the `getTranslations` function in server components.

Configurar la regeneración estática incremental

---
description: Serve static pages with auto-updates
---

1. **Enable ISR**:
   ```tsx
   export const revalidate = 60; // seconds

   export default async function Page() {
     const data = await fetchData();
     return <div>{data}</div>;
   }
   ```

2. **On-Demand Revalidation**:
   ```ts
   import { revalidatePath } from 'next/cache';

   export async function POST(request: Request) {
     const { path } = await request.json();
     revalidatePath(path);
     return Response.json({ revalidated: true });
   }
   ```

3. **Pro Tips**:
   - Use tags for bulk revalidation.
   - Perfect for blogs and e-commerce.

   
   
Configurar la siembra de la base de datos

---
description: Populate your database with realistic test data
---

1. **Install Faker**:
   - Generate realistic fake data.
   // turbo
   - Run `npm install --save-dev @faker-js/faker`

2. **Create Seed Script**:
   - Create `prisma/seed.ts`.
   ```ts
   import { PrismaClient } from '@prisma/client';
   import { faker } from '@faker-js/faker';

   const prisma = new PrismaClient();

   async function main() {
     // Clear existing data
     await prisma.post.deleteMany();
     await prisma.user.deleteMany();

     // Create 10 users
     const users = await Promise.all(
       Array.from({ length: 10 }).map(() =>
         prisma.user.create({
           data: {
             email: faker.internet.email(),
             name: faker.person.fullName(),
             avatar: faker.image.avatar(),
           },
         })
       )
     );

     // Create 50 posts
     await Promise.all(
       Array.from({ length: 50 }).map(() =>
         prisma.post.create({
           data: {
             title: faker.lorem.sentence(),
             content: faker.lorem.paragraphs(3),

   
   
     
     
✅

             authorId: faker.helpers.arrayElement(users).id,
           },
         })
       )
     );

     console.log('
   }

 Database seeded successfully');

   main()
     .catch(console.error)
     .finally(() => prisma.$disconnect());
   ```

3. **Configure package.json**:
   - Add seed command.
   ```json
   {
     "prisma": {
       "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/
seed.ts"
     },
     "scripts": {
       "db:seed": "prisma db seed"
     }
   }
   ```

4. **Run Seed**:
   - Populate your database.
   // turbo
   - Run `npm run db:seed`

5. **Reset Database**:
   - Wipe and re-seed.
   // turbo
   - Run `npx prisma migrate reset` (runs seed automatically)

6. **Pro Tips**:
   - Create different seed files for dev/staging/test.
   - Use deterministic seeds for consistent testing.
   - Seed only in development; never in production!
   - Consider using snapshots of production data (anonymized).

     
   
Configurar la simulación de API con MSW

---
description: Mock API requests for testing and development
---

1. **Install MSW**:
   - Mock Service Worker for API mocking.
   // turbo
   - Run `npm install --save-dev msw@latest`

2. **Initialize MSW**:
   - Generate service worker file.
   // turbo
   - Run `npx msw init public/ --save`

3. **Create Handlers**:
   - Define mock API responses.
   ```ts
   // mocks/handlers.ts
   import { http, HttpResponse } from 'msw';

   export const handlers = [
     http.get('/api/user', () => {
       return HttpResponse.json({
         id: '1',
         name: 'John Doe',
         email: 'john@example.com',
       });
     }),

     http.post('/api/login', async ({ request }) => {
       const { email } = await request.json() as { email: string };

       if (email === 'test@example.com') {
         return HttpResponse.json({ token: 'fake-jwt-token' });
       }

       return new HttpResponse(null, { status: 401 });
     }),
   ];
   ```

4. **Setup Browser Worker**:

   
     
       
       
   - Enable mocking in browser.
   ```ts
   // mocks/browser.ts
   import { setupWorker } from 'msw/browser';
   import { handlers } from './handlers';

   export const worker = setupWorker(...handlers);
   ```

5. **Start MSW in Development**:
   - Create a provider to conditionally start MSW.
   ```tsx
   // app/msw-provider.tsx
   'use client'
   import { useEffect, useState } from 'react';

   export function MSWProvider({ children }: { children: React.ReactNode }) {
     const [mswReady, setMswReady] = useState(false);

     useEffect(() => {
       async function init() {
         if (process.env.NODE_ENV === 'development') {
           const { worker } = await import('../mocks/browser');
           await worker.start({
             onUnhandledRequest: 'bypass',
           });
           setMswReady(true);
         } else {
           setMswReady(true);
         }
       }

       init();
     }, []);

     if (!mswReady) return null;
     return <>{children}</>;
   }
   ```
   - Add to layout:
   ```tsx
   // app/layout.tsx
   import { MSWProvider } from './msw-provider';

   
   
   
   
   
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <MSWProvider>{children}</MSWProvider>
         </body>
       </html>
     );
   }
   ```

6. **Use in Tests**:
   - Setup for Vitest/Jest.
   ```ts
   // vitest.setup.ts
   import { afterAll, afterEach, beforeAll } from 'vitest';
   import { setupServer } from 'msw/node';
   import { handlers } from './mocks/handlers';

   const server = setupServer(...handlers);

   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```

7. **Pro Tips**:
   - Use MSW to develop frontend before backend is ready.
   - Override handlers per test for different scenarios.
   - MSW works with fetch, axios, and any HTTP client.
   - The browser worker only runs in development mode.

   
   
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

Configurar RBAC

---
description: Role-based permissions
---

1. **Define Roles**:
   ```prisma
   enum Role {
     USER
     ADMIN
     MODERATOR
   }
   ```

2. **Protect Routes**:
   ```ts
   if (session?.user?.role !== 'ADMIN') {
     return Response.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

3. **Conditional UI**:
   ```tsx
   {isAdmin && <AdminPanel />}
   ```

4. **Pro Tips**:
   - Use enums for type safety.
   - Cache permissions.

Configurar Storybook para componentes

---
description: Build and test components in isolation with Storybook
---

1. **Install Storybook**:
   - Initialize Storybook in your project.
   // turbo
   - Run `npx storybook@latest init`

2. **Create Your First Story**:
   - Create a story file next to your component.
   ```tsx
   // components/Button.stories.tsx
   import type { Meta, StoryObj } from '@storybook/react';
   import { Button } from './Button';

   const meta: Meta<typeof Button> = {
     title: 'Components/Button',
     component: Button,
     tags: ['autodocs'],
   };

   export default meta;
   type Story = StoryObj<typeof Button>;

   export const Primary: Story = {
     args: {
       variant: 'primary',
       children: 'Click me',
     },
   };

   export const Secondary: Story = {
     args: {
       variant: 'secondary',
       children: 'Click me',
     },
   };
   ```

3. **Run Storybook**:
   - Start the dev server.

   
   
   
   
   // turbo
   - Run `npm run storybook`

4. **Add Interactions**:
   - Test component behavior.
   ```tsx
   import { userEvent, within } from '@storybook/testing-library';
   import { expect } from '@storybook/jest';

   export const Clicked: Story = {
     play: async ({ canvasElement }) => {
       const canvas = within(canvasElement);
       await userEvent.click(canvas.getByRole('button'));
       await expect(canvas.getByText('Clicked!')).toBeInTheDocument();
     },
   };
   ```

5. **Build Static Storybook**:
   - Deploy as a static site.
   // turbo
   - Run `npm run build-storybook`

6. **Pro Tips**:
   - Use Chromatic for visual regression testing.
   - Document props with JSDoc comments.
   - Use args for interactive controls in Storybook UI.

   
Corregir errores de pelusa

---
description: Automatically fix linting and formatting issues across the project
---

1. **Run ESLint Fix**:
   - Attempt to automatically fix all fixable ESLint errors.
   // turbo
   - Run `npm run lint -- --fix`

2. **Run Prettier**:
   - Format all files in the project to ensure consistent style.
   // turbo
   - Run `npx prettier --write .`

3. **Pro Tips**:
   - Run this before every commit to keep your codebase clean.
   - Configure your editor to 'Format on Save' for real-time feedback.

Crear una plantilla de relaciones públicas de GitHub

---
description: Standardize pull request descriptions for better code reviews
---

1. **Create Template Directory**:
   - GitHub looks for templates in `.github/` folder.
   // turbo
   - Run `mkdir -p .github`

2. **Create Pull Request Template**:
   - Create the template file with structured content.
   ```markdown\n   ## Description\n   Briefly describe what this PR does.\n   \n   ## 
Type of Change\n   - [ ] Bug fix\n   - [ ] New feature\n   - [ ] Breaking change\n   - 
[ ] Documentation update\n   \n   ## Testing\n   - [ ] I have tested these changes 
locally\n   - [ ] I have added/updated tests\n   - [ ] All tests pass\n   \n   ## 
Screenshots (if applicable)\n   \n   ## Checklist\n   - [ ] My code follows the 
project's style guidelines\n   - [ ] I have performed a self-review\n   - [ ] I have 
commented complex code\n   - [ ] I have updated documentation\n   - [ ] No new 
warnings generated\n   \n   ## Related Issues\n   Closes #\n   ```\n   - Save this as 
`.github/PULL_REQUEST_TEMPLATE.md`\n
3. **Commit and Push**:
   - Add the template to your repository.
   // turbo
   - Run `git add .github/PULL_REQUEST_TEMPLATE.md && git commit -m \"Add 
PR template\" && git push`

4. **Test It**:
   - Create a new PR and the template will auto-populate.

5. **Pro Tips**:
   - Customize the template for your team's workflow.
   - Add a link to your contributing guidelines.
   - Use multiple templates for different PR types (create `.github/
PULL_REQUEST_TEMPLATE/` folder).

Depuración de la proliferación de 'any' en TypeScript

❌
✅
✅
❌

---
description: Find and eliminate implicit 'any' types for better type safety
---

1. **Enable Strict Mode**:
   - Update `tsconfig.json` to catch implicit any.
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

2. **Find All 'any' Usages**:
   - Use ESLint rule.
   ```json
   // .eslintrc.json
   {
     "rules": {
       "@typescript-eslint/no-explicit-any": "error"
     }
   }
   ```

 Bad

 Good

3. **Common Fixes**:
   - **Event Handlers**:
     ```tsx
     // 
     const handleClick = (e: any) => {};
     // 
     const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {};
     ```
   - **API Responses**:
     ```tsx
     // 
     const data: any = await fetch('/api/user').then(r => r.json());
     // 
     interface User { id: string; name: string; }
     const data: User = await fetch('/api/user').then(r => r.json());

 Good

 Bad

✅

❌

✅

 Bad

     ```
   - **Third-Party Libraries**:
     ```tsx
     // 
     import someLib from 'some-lib'; // Module has no types
     // 
     npm install --save-dev @types/some-lib
     ```

 Good

4. **Use 'unknown' Instead of 'any'**:
   - Forces type checking before use.
   ```tsx
   function handleData(data: unknown) {
     if (typeof data === 'string') {
       console.log(data.toUpperCase()); // 
     }
   }
   ```

 Type-safe

5. **Generate Types for External APIs**:
   - See "Generate TypeScript Types from API" workflow.

6. **Pro Tips**:
   - Enable `noUncheckedIndexedAccess` to catch array/object access bugs.
   - Use type assertions sparingly: `as Type`.
   - Prefer type inference over explicit types when obvious.

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

Depuración de re-renderizados infinitos

---
description: Track down and fix infinite loops in useEffect and component 
rendering
---

1. **Check `useEffect` Dependencies**:
   - The most common culprit is a `useEffect` that updates a state variable which 
is also in its dependency array.
   - **Bad Pattern:**
     ```tsx
     useEffect(() => {
       setCount(count + 1);
     }, [count]); // Depends on 'count' -> Infinite Loop!
     ```
   - **Fix:** Use the functional update form or remove the dependency if not 
needed.

2. **Unstable Object References**:
   - If you pass an object or array as a dependency, React compares it by 
reference. Creating a new object on every render causes the effect to run every 
time.
   - **Fix:** Wrap the object in `useMemo` or move it outside the component.
     ```tsx
     const options = useMemo(() => ({ id: 1 }), []);
     ```

3. **Use `useTraceUpdate` Hook**:
   - Copy this hook to debug exactly which prop is changing.
   ```tsx
   function useTraceUpdate(props) {
     const prev = useRef(props);
     useEffect(() => {
       const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
         if (prev.current[k] !== v) ps[k] = [prev.current[k], v];
         return ps;
       }, {});
       if (Object.keys(changedProps).length > 0) {
         console.log('Changed props:', changedProps);
       }
       prev.current = props;
     });
   }

   ```

4. **Pro Tips**:
   - Install the **eslint-plugin-react-hooks** package. It will automatically warn you 
about missing or circular dependencies.

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

Depurar errores de TypeScript del tipo "No se puede encontrar el módulo"

✅
❌

---
description: Fix TypeScript module resolution issues
---

1. **Check tsconfig.json Paths**:
   - Verify path mappings are correct.
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"],
         "@/components/*": ["./src/components/*"]
       }
     }
   }
   ```

2. **Restart TypeScript Server**:
   - VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server".

 Wrong

3. **Check Module Resolution**:
   - Verify import paths match file structure.
   ```tsx
   // 
   import { Button } from '@/Components/Button';
   // 
   import { Button } from '@/components/Button';
   ```

 Correct (case-sensitive)

4. **Install Missing Type Definitions**:
   - Check if @types package exists.
   // turbo
   - Run `npm install --save-dev @types/node @types/react`

5. **Fix Declaration File Conflicts**:
   - Check for duplicate .d.ts files.
   - Exclude node_modules in tsconfig:
   ```json
   {
     "exclude": ["node_modules", "**/*.spec.ts"]
   }

   ```

6. **Clear TypeScript Cache**:
   - Delete build artifacts.
   // turbo
   - Run `rm -rf .next tsconfig.tsbuildinfo`

7. **Pro Tips**:
   - Use `moduleResolution: "bundler"` for modern projects.
   - Check `package.json` exports field for library imports.
   - Enable `skipLibCheck` to speed up compilation.

Depurar fugas de memoria en React

✅

✅

---
description: Identify and fix memory leaks causing app slowdowns and crashes
---

1. **Take Heap Snapshots**:
   - Open Chrome DevTools → Memory tab.
   - Take a snapshot, interact with your app, take another snapshot.
   - Click "Comparison" to see what objects are being retained.

2. **Common Culprits**:
   - **Event Listeners**: Not removed in cleanup.
   ```tsx
   useEffect(() => {
     const handler = () => console.log('resize');
     window.addEventListener('resize', handler);
     return () => window.removeEventListener('resize', handler); // 
   }, []);
   ```
   - **Timers**: `setInterval` not cleared.
   ```tsx
   useEffect(() => {
     const id = setInterval(() => {}, 1000);
     return () => clearInterval(id); // 
   }, []);
   ```
   - **Subscriptions**: WebSocket/Observable not closed.

 Cleanup

 Cleanup

3. **Use React DevTools Profiler**:
   - Enable "Record why each component rendered".
   - Look for components that never unmount or re-render excessively.

4. **Check for Detached DOM**:
   - In Memory tab, filter by "Detached".
   - These are DOM nodes removed from the page but still in memory.

5. **Pro Tips**:
   - Use `useEffect` cleanup functions religiously.
   - Avoid storing large objects in state unnecessarily.
   - Use React's built-in `AbortController` for fetch cleanup.
   - Test with React Strict Mode enabled (mounts/unmounts twice).

Depurar problemas de conexión de WebSocket

---
description: Fix WebSocket connections
---

1. **Setup with Reconnection**:
   ```tsx
   'use client'
   export function useWebSocket(url: string) {
     const ws = useRef<WebSocket | null>(null);

     useEffect(() => {
       ws.current = new WebSocket(url);
       ws.current.onclose = () => {
         setTimeout(() => connect(), 1000);
       };
     }, [url]);
   }
   ```

2. **Implement Heartbeat**:
   - Send ping every 30 seconds.

3. **Pro Tips**:
   - Use wss:// in production.
   - Test with `wscat`.

     
Depurar rutas de API lentas (creación de perfiles de rendimiento)

---
description: Profile and optimize slow API endpoints
---

1. **Add Timing Logs**:
   - Measure execution time.
   ```ts
   export async function GET() {
     console.time('API /users');
     const users = await db.user.findMany();
     console.timeEnd('API /users');
     return Response.json(users);
   }
   ```

2. **Identify N+1 Queries**:
   - Enable Prisma query logging in schema.

3. **Profile with Chrome DevTools**:
   - Add `--inspect` flag to dev script.
   - Open `chrome://inspect`

4. **Pro Tips**:
   - Use `include` in Prisma.
   - Add database indexes.
   - Cache with Redis.

Deshacer un push público "malo"

---
description: Safely revert a pushed commit without breaking history
---

1. **Find the Bad Commit Hash**:
   - Identify the commit that caused the issue.
   // turbo
   - Run `git log --oneline -n 5`

2. **Revert the Commit**:
   - Use `git revert` to create a *new* commit that is the exact opposite of the bad 
one. Replace `[hash]` with the actual commit hash.
   // turbo
   - Run `git revert [hash]`

3. **Push the Fix**:
   - Push the new revert commit to the remote repository.
   // turbo
   - Run `git push origin HEAD`

4. **Pro Tips**:
   - If you haven't pushed yet, you can just use `git reset --soft HEAD~1` to undo 
the commit locally.
   - `git revert` is safe for shared branches because it only adds history, never 
deletes it.

Dividiendo un insecto

---
description: Automatically find the exact commit that introduced a bug
---

1. **Start Bisect**:
   - Initialize the bisect process.
   // turbo
   - Run `git bisect start`

2. **Mark Current Commit as Bad**:
   - Tell Git that the current version is broken.
   // turbo
   - Run `git bisect bad`

3. **Mark an Old Commit as Good**:
   - Find a commit hash from when the feature was definitely working and mark it 
as good. Replace `[good-commit-hash]` with the actual hash.
   // turbo
   - Run `git bisect good [good-commit-hash]`

4. **Test and Repeat**:
   - Git will checkout a commit in the middle. Test your app.
   - If it works: Run `git bisect good`
   - If it's broken: Run `git bisect bad`
   - Repeat until Git tells you: `[hash] is the first bad commit`.

5. **Finish**:
   - Reset the bisect state to return to the original branch.
   // turbo
   - Run `git bisect reset`

6. **Pro Tips**:
   - You can automate this! Run `git bisect run npm test` to let a test script do the 
work for you.

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

Flujo de trabajo de andamiaje de componentes de React

Create a workflow to generate React components with standard structure.

Workflow File: .agent/workflows/create_component.md

```markdown
---
description: Create a new React component with standard structure and styling
---

1. Ask the user for the name of the new component (e.g., "Button", "Header").
2. Create a new directory for the component in `src/components/
[ComponentName]`.
3. Create the main component file `src/components/[ComponentName]/index.jsx`.
4. Add the following boilerplate code to `index.jsx`:
   ```jsx
   import React from 'react';
   import './styles.css';

   export const [ComponentName] = () => {
     return (
       <div className="[component-name]-container">
         <h1>[ComponentName] Component</h1>
       </div>
     );
   };
   ```
5. Create a CSS file `src/components/[ComponentName]/styles.css`.
6. Add a basic style rule for the container class.
7. Verify that the component is exported correctly.
```

Usage:
- Say "Create a new component"
- AI asks for component name
- Generates complete component structure

Benefits:
- Consistent component structure
- Automatic file organization
- Standard naming conventions
- Includes CSS setup
- Saves boilerplate typing

Customization:
- Add TypeScript support (.tsx)
- Include PropTypes or TypeScript interfaces
- Add test file generation
- Include Storybook story

Flujo de trabajo de implementación de producción

Safe production deployment with testing, building, and verification steps.

Workflow File: .agent/workflows/deploy_production.md

```markdown
---
description: Deploy application to production with safety checks
---

1. Verify we're on the main branch.
2. Pull latest changes to ensure we're up to date.
// turbo
3. Run `git pull origin main`
4. Run all tests to ensure code quality.
// turbo
5. Run `npm test`
6. Build the production bundle.
// turbo
7. Run `npm run build`
8. Verify build completed successfully (check for build errors).
9. Ask user for final confirmation before deploying.
10. Deploy to production.
11. Run `npm run deploy` or platform-specific command
12. Verify deployment succeeded by checking the live URL.
13. Create a git tag for this release.
// turbo
14. Run `git tag -a v[version] -m "Production release [version]"`
15. Push the tag to remote.
// turbo
16. Run `git push origin v[version]`
```

Usage:
- Say "Deploy to production" or use /deploy_production
- Follow prompts for confirmation
- Monitor deployment progress

Safety Features:
- Tests run before deployment
- Build verification
- User confirmation required
- Git tagging for rollback

- Deployment verification

Best Practices:
- Always test before deploying
- Tag releases for tracking
- Verify deployment success
- Keep deployment logs
- Have rollback plan ready

Customization:
- Add database migration step
- Include environment variable checks
- Add Slack/Discord notifications
- Include rollback procedure
- Add performance monitoring

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

Flujo de trabajo de restablecimiento de dependencia

Fix "it works on my machine" issues by resetting dependencies.

Workflow File: .agent/workflows/reset_deps.md

```markdown
---
description: Completely reset node_modules and reinstall dependencies to fix 
issues
---

1. Delete the existing node_modules folder to ensure a clean slate.
// turbo
2. Run `rm -rf node_modules`
3. Delete the package-lock.json file to avoid version conflicts.
// turbo
4. Run `rm package-lock.json`
5. Reinstall all dependencies from scratch.
// turbo
6. Run `npm install`
```

Usage:
- Say "Reset dependencies" or use /reset_deps
- All commands run automatically with turbo
- Wait for npm install to complete

When to Use:
- Dependency version conflicts
- Corrupted node_modules
- "Module not found" errors
- After switching branches
- Clean environment needed

Safety:
- Uses turbo because commands are safe
- No data loss (only dependencies)
- Can be run anytime
- Reproducible from package.json

Variations:
- Add cache clearing: `npm cache clean --force`
- Support yarn: `rm -rf node_modules yarn.lock && yarn install`

- Include .next or dist folder cleanup
- Add verification step after install

Flujo de trabajo del creador de páginas HTML

Create standardized HTML pages with consistent structure and boilerplate.

Workflow File: .agent/workflows/create_page.md

```markdown
---
description: Create a new HTML page with standard boilerplate and structure
---

1. Ask the user for the name of the new page (e.g., "About Us", "Contact").
2. Convert the page name to a filename (e.g., "about-us.html", "contact.html").
3. Create the HTML file in the project root or specified directory.
4. Add the following boilerplate structure:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>[Page Name]</title>
       <link rel="stylesheet" href="styles/globals.css">
   </head>
   <body>
       <nav class="navbar">
           <!-- Navigation will go here -->
       </nav>
       <main>
           <h1>[Page Name]</h1>
       </main>
       <footer>
           <!-- Footer will go here -->
       </footer>
   </body>
   </html>
   ```
5. Verify the file was created successfully.
```

Usage:
- Say "Create a new page" or use /create_page
- Provide page name
- AI generates complete HTML file

Benefits:
- Consistent page structure
- Includes meta tags
- Links to global styles
- Semantic HTML structure
- Ready for content

Customization:
- Add SEO meta tags
- Include analytics scripts
- Add Open Graph tags
- Include navigation/footer templates

Flujo de trabajo del generador de ganchos de React

Scaffold custom React hooks with standard boilerplate code.

Workflow File: .agent/workflows/create_hook.md

```markdown
---
description: Create a new custom React hook with standard boilerplate
---

1. Ask the user for the name of the hook (must start with "use", e.g., 
"useWindowSize").
2. Create a new file in `src/hooks/[HookName].js`.
3. Add the following boilerplate code to the file:
   ```javascript
   import { useState, useEffect } from 'react';

   export const [HookName] = () => {
     const [data, setData] = useState(null);

     useEffect(() => {
       // Logic goes here
       console.log('[HookName] mounted');
     }, []);

     return { data };
   };
   ```
4. Verify that the hook is exported as a named export.
```

Usage:
- Say "Create a custom hook" or use /create_hook
- Provide hook name (must start with 'use')
- AI generates complete hook file

Benefits:
- Enforces naming conventions
- Standard hook structure
- Includes useState and useEffect setup
- Ready for custom logic

Customization:

- Add TypeScript support (.ts)
- Include additional hooks (useCallback, useMemo)
- Add JSDoc comments
- Include unit test file

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

Fundamentos del flujo de trabajo antigravedad

You are an expert in creating Antigravity Workflows.

Key Principles:
- Workflows are step-by-step recipes for complex tasks
- Must be in .agent/workflows/ directory
- Must be .md (Markdown) files
- Must start with YAML frontmatter containing description
- Use turbo mode for safe, trusted commands

Workflow Structure:
```markdown
---
description: Short description of what this workflow does (max 250 chars)
---

1. First step with clear instruction
2. Second step
// turbo
3. Run `safe-command` (auto-runs with turbo)
4. Final step
```

Location Requirements:
- Workspace workflows: .agent/workflows/ in project root
- Global workflows: Available across all projects
- File naming: use lowercase with underscores (e.g., create_component.md)

Triggering Workflows:
- Smart Detection: AI detects relevant workflow from your question
- Slash Commands: Type /workflow-name to trigger directly
- Example: /deploy triggers .agent/workflows/deploy.md

Turbo Mode:
- // turbo: Auto-run single step (place above the step)
- // turbo-all: Auto-run ALL commands in workflow
- Only use for safe, non-destructive commands
- Great for setup scripts and trusted operations

Best Practices:
- Keep steps numbered and clear
- Ask user for input when needed
- Use placeholders like [ComponentName]

- Include code blocks for boilerplate
- Document prerequisites
- Test workflows before sharing

Generar .env a partir del ejemplo

❌

✅

---
description: Safely create a local .env file from .env.example
---

1. **Check for .env.example**:
   - Ensure the example file exists.
   // turbo
   - Run `test -f .env.example && echo "
"

 .env.example not found"`

 Found .env.example" || echo 

2. **Copy to .env.local**:
   - Create your local config without overwriting if it exists (using -n).
   // turbo
   - Run `cp -n .env.example .env.local || echo ".env.local already exists"`

3. **Validate**:
   - Open `.env.local` and replace all placeholder values.
   - Example: `YOUR_API_KEY_HERE` → `abc123...`

4. **Pro Tips**:
   - Always add `.env.local` to your `.gitignore`.
   - Never commit real secrets to `.env.example`.
   - Use `git secret` or Vercel Environment Variables for production secrets.

Gestionar cargas de archivos (S3)

---
description: Setup secure file uploads to AWS S3
---

1. **Install AWS SDK**:
   - Install the S3 client and presigner.
   // turbo
   - Run `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

2. **Create Presigned URL (Server Action)**:
   - Generate a presigned URL on the server for direct client uploads.
   ```ts
   'use server'
   import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

   const s3Client = new S3Client({
     region: process.env.AWS_REGION!,
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });

   export async function getUploadUrl(filename: string, contentType: string) {
     const command = new PutObjectCommand({
       Bucket: process.env.AWS_BUCKET_NAME!,
       Key: `uploads/${Date.now()}-${filename}`,
       ContentType: contentType,
     });

     const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
     return url;
   }
   ```

3. **Upload from Client**:
   - Use the presigned URL to upload directly to S3.
   ```tsx
   async function handleUpload(file: File) {
     const uploadUrl = await getUploadUrl(file.name, file.type);
     await fetch(uploadUrl, {

   
   
     
       method: 'PUT',
       body: file,
       headers: { 'Content-Type': file.type },
     });
   }
   ```

4. **Pro Tips**:
   - Configure CORS on your S3 bucket: allow PUT from your domain.
   - Use presigned URLs to avoid exposing AWS credentials to clients.
   - Set expiration times (3600s = 1 hour) to limit upload window.

Implementación del límite de error

---
description: Prevent white screens of death with a fallback UI
---

1. **Create Component**:
   - Create `src/components/ErrorBoundary.tsx`.
   ```tsx
   'use client';
   import React, { Component, ReactNode } from 'react';

   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
   }

   interface State {
     hasError: boolean;
   }

   class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false };
     }

     static getDerivedStateFromError(_: Error): State {
       return { hasError: true };
     }

     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       console.error('ErrorBoundary caught:', error, errorInfo);
     }

     render() {
       if (this.state.hasError) {
         return this.props.fallback || (
           <div className="p-8 text-center">
             <h1 className="text-2xl font-bold">Something went wrong</h1>
             <button onClick={() => this.setState({ hasError: false })}>
               Try again
             </button>
           </div>

   
     
     
     
         );
       }
       return this.props.children;
     }
   }

   export default ErrorBoundary;
   ```

2. **Wrap App**:
   - Use it in `layout.tsx` or specific page components.
   ```tsx
   <ErrorBoundary>
     {children}
   </ErrorBoundary>
   ```

3. **Pro Tips**:
   - In Next.js App Router, use the `error.tsx` file convention for route-level error 
handling.
   - Error boundaries only catch errors in child components, not in event handlers 
or async code.

   
Implementar actualizaciones optimistas de la interfaz de usuario

---
description: Update UI before server confirms
---

1. **Install React Query**:
   // turbo
   - Run `npm install @tanstack/react-query`

2. **Setup Optimistic Mutation**:
   ```tsx
   const addTodo = useMutation({
     mutationFn: (text) => fetch('/api/todos', { method: 'POST', body: 
JSON.stringify({ text }) }),
     onMutate: async (newTodo) => {
       await queryClient.cancelQueries({ queryKey: ['todos'] });
       const previous = queryClient.getQueryData(['todos']);
       queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);
       return { previous };
     },
     onError: (err, newTodo, context) => {
       queryClient.setQueryData(['todos'], context.previous);
     },
   });
   ```

3. **Pro Tips**:
   - Always implement rollback.
   - Show loading states.

Implementar el modo oscuro

---
description: Add dark mode support using next-themes
---

1. **Install next-themes**:
   - Install the library.
   // turbo
   - Run `npm install next-themes`

2. **Add Provider**:
   - Wrap your app in `app/layout.tsx`.
   ```tsx
   import { ThemeProvider } from 'next-themes';

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en" suppressHydrationWarning>
         <body>
           <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
             {children}
           </ThemeProvider>
         </body>
       </html>
     );
   }
   ```

3. **Configure Tailwind**:
   - Ensure `darkMode: 'class'` is in `tailwind.config.ts`.
   ```ts
   export default {
     darkMode: 'class',
     // ... rest of config
   }
   ```

4. **Create Toggle Button**:
   - Build a theme switcher component.
   ```tsx
   'use client'
   import { useTheme } from 'next-themes';
   import { useEffect, useState } from 'react';

   
!

"

   export function ThemeToggle() {
     const [mounted, setMounted] = useState(false);
     const { theme, setTheme } = useTheme();

     useEffect(() => setMounted(true), []);
     if (!mounted) return null;

     return (
       <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
         {theme === 'dark' ? '
'}
       </button>
     );
   }
   ```

' : '

5. **Pro Tips**:
   - Use `suppressHydrationWarning` on the `<html>` tag to prevent hydration 
warnings.
   - The `useEffect` check ensures the component only renders after hydration.

   
     
     
Implementar la deduplicación de solicitudes

---
description: Prevent duplicate API calls in React components
---

1. **Next.js 15 Fetch Caching**:
   - **Change:** `fetch` requests are no longer cached by default in `GET` 
handlers or Server Components unless configured.
   - **Fix:** Explicitly set `cache: 'force-cache'` if you want caching.
   ```ts
   fetch('https://...', { cache: 'force-cache' }); // Cached forever
   fetch('https://...', { next: { revalidate: 3600 } }); // Cached for 1 hour
   ```

2. **React Query (Client-Side)**:
   - Best for client-side deduplication and state management.
   // turbo
   - Run `npm install @tanstack/react-query`
   ```tsx
   const { data } = useQuery({
     queryKey: ['user', id],
     queryFn: () => fetch(`/api/user/${id}`).then(r => r.json()),
     staleTime: 60 * 1000, // Deduplicates requests for 1 minute
   });
   ```

3. **Request Memoization (Server-Side)**:
   - React `cache` function deduplicates requests *within a single render pass*.
   ```tsx
   import { cache } from 'react';

   export const getUser = cache(async (id) => {
     return db.user.findUnique({ where: { id } });
   });
   // Calling getUser(1) multiple times in one request only hits DB once.
   ```

4. **Pro Tips**:
   - Use `react.cache` for DB calls in Server Components.
   - Use React Query for Client Components.
   - Next.js `fetch` deduplication happens automatically for the same URL+options.

   
Implementar la implementación azul-verde

---
description: Zero-downtime deploys
---

1. **Setup Two Environments**:
   - Blue: Current (v1.0)
   - Green: New (v1.1)

2. **Route Traffic Gradually**:
   ```ts
   const rolloutPercent = await get('green_rollout') || 0;
   if (Math.random() * 100 < rolloutPercent) {
     return NextResponse.rewrite(new URL('/green', request.url));
   }
   ```

3. **Monitor Metrics**:
   ```ts
   Sentry.setTag('environment', isGreen ? 'green' : 'blue');
   ```

4. **Pro Tips**:
   - Test thoroughly before routing.
   - Keep blue for rollback.

Implementar limitación de velocidad

---
description: Protect APIs with rate limits
---

1. **Install Upstash**:
   // turbo
   - Run `npm install @upstash/ratelimit @upstash/redis`

2. **Setup**:
   ```ts
   import { Ratelimit } from '@upstash/ratelimit';

   const ratelimit = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(10, '10 s')
   });
   ```

3. **Apply to Routes**:
   ```ts
   const { success } = await ratelimit.limit(ip);
   if (!success) return Response.json({ error: 'Too many requests' }, { status: 429 });
   ```

4. **Pro Tips**:
   - Different limits per endpoint.
   - Log violations.

   
Lista de verificación para fortalecer la seguridad

---
description: Essential security headers, CSP, and rate limiting
---

1. **Security Headers (`next.config.js`)**:
   - Add these headers to prevent common attacks.
   ```js
   module.exports = {
     async headers() {
       return [
         {
           source: '/:path*',
           headers: [
             { key: 'X-DNS-Prefetch-Control', value: 'on' },
             { key: 'Strict-Transport-Security', value: 'max-age=63072000; 
includeSubDomains; preload' },
             { key: 'X-Content-Type-Options', value: 'nosniff' },
             { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
             { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
           ]
         }
       ]
     }
   }
   ```

2. **Content Security Policy (CSP)**:
   - Create `src/middleware.ts`.
   ```ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export function middleware(request: NextRequest) {
     const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
     const cspHeader = `
       default-src 'self';
       script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
       style-src 'self' 'nonce-${nonce}';
       img-src 'self' blob: data:;
       font-src 'self';
       object-src 'none';
       base-uri 'self';

   
       form-action 'self';
       frame-ancestors 'none';
       upgrade-insecure-requests;
     `.replace(/\s{2,}/g, ' ').trim();

     const requestHeaders = new Headers(request.headers);
     requestHeaders.set('x-nonce', nonce);
     requestHeaders.set('Content-Security-Policy', cspHeader);

     const response = NextResponse.next({
       request: {
         headers: requestHeaders,
       },
     });
     response.headers.set('Content-Security-Policy', cspHeader);
     return response;
   }
   ```

3. **Rate Limiting (API Routes)**:
   - Prevent abuse with simple in-memory rate limiting.
   ```ts
   // lib/rate-limit.ts
   const rateLimit = new Map();

   export function checkRateLimit(ip: string, limit = 10) {
     const now = Date.now();
     const windowMs = 60 * 1000; // 1 minute
     const record = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };

     if (now > record.resetTime) {
       record.count = 1;
       record.resetTime = now + windowMs;
     } else {
       record.count++;
     }

     rateLimit.set(ip, record);
     return record.count <= limit;
   }
   ```

4. **Pro Tips**:
   - Never commit `.env` files.

     
   
     
     
   - Regularly audit your dependencies: `npm audit fix`.

Matar puerto 3000

---
description: Instantly find and kill the process hogging your dev port
---

1. **The Best Way (Cross-Platform)**:
   - Kill it in one command using npx. Works on Mac, Windows, and Linux.
   // turbo
   - Run `npx kill-port 3000`

2. **Mac/Linux Manual Method**:
   - Find PID: `lsof -ti:3000`
   - Kill it: `kill -9 $(lsof -ti:3000)`

3. **Windows Manual Method**:
   - Find PID: `netstat -ano | findstr :3000`
   - Kill it: `taskkill /PID <PID> /F`

4. **Pro Tips**:
   - This works for any port, just change 3000 to whatever you need.
   - Add an alias to your shell profile: `alias kill3000="npx kill-port 3000"`.

Migrar de Pages Router a App Router

---
description: Incrementally migrate Next.js Pages Router to App Router
---

1. **Enable App Router**:
   - Create `app` directory alongside `pages`.
   - Both routers work simultaneously during migration.

2. **Convert getServerSideProps**:
   - Pages Router:
   ```tsx
   export async function getServerSideProps() {
     const data = await fetchData();
     return { props: { data } };
   }
   ```
   - App Router (Server Component):
   ```tsx
   async function Page() {
     const data = await fetchData();
     return <div>{data}</div>;
   }
   ```

3. **Convert getStaticProps**:
   - Use `generateStaticParams` for dynamic routes.
   ```tsx
   export async function generateStaticParams() {
     const posts = await getPosts();
     return posts.map((post) => ({ slug: post.slug }));
   }
   ```

4. **Migrate API Routes**:
   - Move from `pages/api/*` to `app/api/*/route.ts`.
   ```ts
   // app/api/users/route.ts
   export async function GET() {
     return Response.json({ users: [] });
   }
   ```

5. **Update Middleware**:
   - Middleware works the same, but update imports.
   ```ts
   import { NextResponse } from 'next/server';
   export function middleware(request) {
     return NextResponse.next();
   }
   ```

6. **Pro Tips**:
   - Migrate page by page, not all at once.
   - Use `use client` directive for client components.
   - Test thoroughly - data fetching patterns are different.
   - App Router is the future; prioritize new features there.

Nuevo componente de andamio

---
description: Quickly generate a new React component structure
---

1. **Create Directory**:
   - Create a folder for the component.
   // turbo
   - Run `mkdir -p src/components/NewComponent`

2. **Create Component File**:
   - Create the main file with boilerplate code.
   // turbo
   - Run `printf "export const NewComponent = () => {\n  return (\n    <div 
className='p-4'>\n      <h1>NewComponent</h1>\n    </div>\n  );\n};" > src/
components/NewComponent/index.tsx`

3. **Pro Tips**:
   - Use a VS Code snippet to automate the typing.
   - Consider using a tool like `plop.js` for advanced scaffolding templates.

Optimizador de elementos esenciales de la web

---
description: Audit and fix LCP, CLS, and INP issues for better ranking
---

1. **Fix LCP (Large Contentful Paint)**:
   - The largest element (usually the hero image) must load fast.
   - **Fix:** Add `priority` to your Hero image.
   ```tsx
   <Image src="/hero.png" alt="Hero" width={800} height={600} priority />
   ```

2. **Fix CLS (Cumulative Layout Shift)**:
   - Elements jumping around as they load cause CLS.
   - **Fix:** Always define `width` and `height` for images (or use `fill` with a 
parent container).
   - **Fix:** Reserve space for ads or dynamic content using CSS `min-height`.

3. **Optimize Fonts**:
   - Fonts loading late cause layout shifts (FOUT/FOIT).
   - **Fix:** Use `next/font` which automatically optimizes and hosts fonts.
   ```tsx
   import { Inter } from 'next/font/google';
   const inter = Inter({ subsets: ['latin'] });
   // Use inter.className in your body or layout
   ```

4. **Pro Tips**:
   - Run a **Lighthouse** audit in Chrome DevTools (Incognito mode) to get a 
baseline score.
   - Use `@next/third-parties` to load scripts like Google Analytics efficiently.

Optimizar imágenes para la Web

---
description: Compress and serve images in modern formats for faster loading
---

1. **Use Next.js Image Component**:
   - Automatic optimization and lazy loading.
   ```tsx
   import Image from 'next/image';

   <Image
     src="/hero.jpg"
     alt="Hero"
     width={1200}
     height={600}
     priority // for above-the-fold images
     placeholder="blur" // optional: shows blur while loading
   />
   ```

2. **Configure Remote Patterns (Next.js 14+)**:
   - `domains` is deprecated. Use `remotePatterns` for better security.
   ```js
   module.exports = {
     images: {
       remotePatterns: [
         {
           protocol: 'https',
           hostname: 'cdn.example.com',
           pathname: '/images/**',
         },
       ],
       formats: ['image/webp', 'image/avif'],
     },
   };
   ```

3. **Modern Formats (AVIF)**:
   - Enable AVIF for smaller file sizes (20% smaller than WebP).
   - Next.js automatically handles format negotiation.

4. **Pro Tips**:
   - Always specify width/height to prevent CLS.

   
   - Use `fill` + `object-fit` for responsive containers.
   - Use `sizes` prop for responsive images: `sizes="(max-width: 768px) 100vw, 
50vw"`.

Páginas 404/500 personalizadas

---
description: Create branded error pages
---

1. **Create Not Found**:
   - Create `src/app/not-found.tsx`.
   ```tsx
   import Link from 'next/link';
   export default function NotFound() {
     return (
       <div>
         <h2>Not Found</h2>
         <p>Could not find requested resource</p>
         <Link href="/">Return Home</Link>
       </div>
     );
   }
   ```

2. **Create Error Page**:
   - Create `src/app/error.tsx` for generic server errors.

3. **Pro Tips**:
   - Add a search bar or helpful links to your 404 page to keep users engaged.

Perfiles de rendimiento de React

---
description: Identify slow components using React Profiler
---

1. **Install DevTools**:
   - Install React Developer Tools extension for Chrome/Firefox.

2. **Record Session**:
   - Open DevTools -> Profiler tab.
   - Click the "Record" circle.
   - Interact with your app (perform the slow action).
   - Stop recording.

3. **Analyze**:
   - Look for yellow/red bars in the flamegraph.
   - Check "Why did this render?" to find unnecessary re-renders.

4. **Pro Tips**:
   - Enable "Highlight updates when components render" in React DevTools 
settings to visualize re-renders in real-time.

⚠
Podar el sistema Docker

---
description: Reclaim disk space by removing unused containers and images
---

1. **Check Current Usage**:
   - See how much space Docker is using.
   // turbo
   - Run `docker system df`

 **WARNING**: This will remove all stopped containers and unused images!

2. **Run Prune**:
   - 
   - Remove all stopped containers, unused networks, and dangling images.
   // turbo
   - Run `docker system prune -a`

3. **Verify Space Reclaimed**:
   - Check the new disk usage.
   // turbo
   - Run `docker system df`

4. **Pro Tips**:
   - Add `--volumes` to also delete unused volumes (DATA LOSS WARNING!).
   - To remove only dangling images: `docker image prune`.
   - Set up automatic cleanup: add `"log-opts": {"max-size": "10m"}` to Docker 
daemon config.

Problemas de API de depuración con la pestaña Red

---
description: Master Chrome DevTools Network tab for API debugging
---

1. **Open Network Tab**:
   - Press F12 → Network tab.
   - Reload the page to capture all requests.

2. **Filter Requests**:
   - Click "Fetch/XHR" to see only API calls.
   - Use the search box to find specific endpoints.

3. **Analyze Failed Requests**:
   - Red requests = failed. Click to see details:
     - **Status**: 400 (bad request), 401 (unauthorized), 404 (not found), 500 
(server error)
     - **Headers**: Check `Authorization`, `Content-Type`
     - **Payload**: See what data was sent
     - **Response**: See the error message

4. **Copy as cURL**:
   - Right-click request → Copy → Copy as cURL.
   - Test in terminal to isolate frontend vs backend issues.

5. **Throttle Network**:
   - Select "Slow 3G" to test loading states.
   - Check if your app shows proper loading indicators.

6. **Check Timing**:
   - Click "Timing" tab in request details.
   - Look for slow DNS lookup, initial connection, or waiting time.

7. **Common Fixes**:
   - **CORS Error**: See "Fix CORS Issues" workflow.
   - **401 Unauthorized**: Check if auth token is being sent.
   ```tsx
   fetch('/api/data', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```
   - **500 Error**: Check server logs, often a backend bug.

8. **Pro Tips**:
   - Enable "Preserve log" to keep requests across page reloads.
   - Use "Disable cache" during development to avoid stale data.
   - Right-click request → "Replay XHR" to re-test without page reload.

Reducir el tamaño del paquete

---
description: Analyze and reduce JS bundle
---

1. **Analyze Bundle**:
   // turbo
   - Run `npm install @next/bundle-analyzer`
   // turbo
   - Run `ANALYZE=true npm run build`

2. **Replace Heavy Libraries**:
   - moment.js → date-fns
   - lodash → Native JS

3. **Use Dynamic Imports**:
   ```tsx
   const Chart = dynamic(() => import('@/components/Chart'), {
     ssr: false
   });
   ```

4. **Pro Tips**:
   - Aim for <200KB initial bundle.
   - Use `npm dedupe`.

Security Hardening Checklist

---
description: Essential security headers, CSP, and rate limiting
---

1. **Security Headers (`next.config.js`)**:
   - Add these headers to prevent common attacks.
   ```js
   module.exports = {
     async headers() {
       return [
         {
           source: '/:path*',
           headers: [
             { key: 'X-DNS-Prefetch-Control', value: 'on' },
             { key: 'Strict-Transport-Security', value: 'max-age=63072000; 
includeSubDomains; preload' },
             { key: 'X-Content-Type-Options', value: 'nosniff' },
             { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
             { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
           ]
         }
       ]
     }
   }
   ```

2. **Content Security Policy (CSP)**:
   - Create `src/middleware.ts`.
   ```ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export function middleware(request: NextRequest) {
     const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
     const cspHeader = `
       default-src 'self';
       script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
       style-src 'self' 'nonce-${nonce}';
       img-src 'self' blob: data:;
       font-src 'self';
       object-src 'none';
       base-uri 'self';

   
       form-action 'self';
       frame-ancestors 'none';
       upgrade-insecure-requests;
     `.replace(/\s{2,}/g, ' ').trim();

     const requestHeaders = new Headers(request.headers);
     requestHeaders.set('x-nonce', nonce);
     requestHeaders.set('Content-Security-Policy', cspHeader);

     const response = NextResponse.next({
       request: {
         headers: requestHeaders,
       },
     });
     response.headers.set('Content-Security-Policy', cspHeader);
     return response;
   }
   ```

3. **Rate Limiting (API Routes)**:
   - Prevent abuse with simple in-memory rate limiting.
   ```ts
   // lib/rate-limit.ts
   const rateLimit = new Map();

   export function checkRateLimit(ip: string, limit = 10) {
     const now = Date.now();
     const windowMs = 60 * 1000; // 1 minute
     const record = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };

     if (now > record.resetTime) {
       record.count = 1;
       record.resetTime = now + windowMs;
     } else {
       record.count++;
     }

     rateLimit.set(ip, record);
     return record.count <= limit;
   }
   ```

4. **Pro Tips**:
   - Never commit `.env` files.

     
   
     
     
   - Regularly audit your dependencies: `npm audit fix`.

Simular una red lenta

---
description: Test how your app behaves under 3G conditions
---

1. **Chrome DevTools**:
   - Open DevTools (F12).
   - Go to the **Network** tab.
   - Locate the "No throttling" dropdown (usually top right of the pane).
   - Select **Fast 3G** or **Slow 3G**.

2. **Verify UX**:
   - Reload the page.
   - Check if loading skeletons appear correctly.
   - Ensure images load gracefully.

3. **Pro Tips**:
   - Create a custom profile to simulate "Offline" or specific latency/throughput 
scenarios.

Solicitudes de seguimiento con OpenTelemetry

---
description: Setup request tracing
---

1. **Install OpenTelemetry**:
   // turbo
   - Run `npm install @opentelemetry/api`

2. **Add Trace IDs**:
   ```ts
   import { trace } from '@opentelemetry/api';
   const traceId = trace.getActiveSpan()?.spanContext().traceId;
   ```

3. **Visualize with Jaeger**:
   // turbo
   - Run `docker run -d -p 16686:16686 jaegertracing/all-in-one`

4. **Pro Tips**:
   - Use Datadog for production.

Solucionar el error "Demasiadas re-renderizaciones"

❌
✅
❌
✅

---
description: Fix infinite render loops
---

1. **State Update During Render**:
   - 
   - 

 `setCount(count + 1)` in render
 Use `useEffect`

2. **Fix Dependencies**:
   ```tsx
   const fetchData = useCallback(() => {
     return { data: 'value' };
   }, []);
   ```

3. **Fix Event Handlers**:
   - 
   - 

 `onClick={handleClick()}`
 `onClick={handleClick}`

4. **Pro Tips**:
   - Use React DevTools Profiler.
   - Enable Strict Mode.

Solucionar problemas de CORS

---
description: Resolve Cross-Origin Resource Sharing errors in API calls
---

1. **Understand the Error**:
   - CORS errors occur when frontend (http://localhost:3000) calls API (http://
api.example.com).
   - Browser blocks the request unless the API explicitly allows it.

2. **Quick Fix (Next.js API Route Proxy)**:
   - Create a proxy to bypass CORS during development.
   ```ts
   // app/api/proxy/route.ts
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url);
     const url = searchParams.get('url');

     const response = await fetch(url!, {
       headers: { 'User-Agent': 'MyApp/1.0' },
     });

     return new Response(response.body, {
       headers: {
         'Content-Type': response.headers.get('Content-Type') || 'application/json',
       },
     });
   }
   ```
   - Call it: `fetch('/api/proxy?url=' + encodeURIComponent('https://
api.example.com/data'))`

3. **Production Fix (Backend)**:
   - Add CORS headers to your API.
   ```ts
   // Express.js
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', 'https://yourdomain.com');
     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
     if (req.method === 'OPTIONS') return res.sendStatus(200);
     next();
   });

     
     
   ```

4. **Next.js Config (Development)**:
   - Add rewrites for local development.
   ```js
   // next.config.js
   module.exports = {
     async rewrites() {
       return [
         {
           source: '/api/:path*',
           destination: 'https://api.example.com/:path*',
         },
       ];
     },
   };
   ```

5. **Pro Tips**:
   - Never use `Access-Control-Allow-Origin: *` in production.
   - For authenticated APIs, include `Access-Control-Allow-Credentials: true`.
   - Use environment variables for allowed origins.

