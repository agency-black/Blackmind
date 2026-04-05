# AGENTS.md - Coding Guidelines for BlackShell

## Build & Development Commands

```bash
# Package manager (REQUIRED: use pnpm, not npm/yarn)
pnpm install

# Development
pnpm dev              # Vite dev server on port 3000
pnpm dev:electron     # Electron main process dev
pnpm dev:desktop      # Full desktop dev (concurrent)

# Build & Production
pnpm build            # Production Vite build
pnpm preview          # Preview production build
pnpm start            # Build + run Electron

# Testing (Jest with multi-project config)
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Run single test
pnpm test -- --testPathPattern="Button"         # Run specific file
pnpm test -- --testNamePattern="should render"   # Run specific test
pnpm test electron/modules/__tests__/WindowConfigurator.test.js  # Single file
```

## Tech Stack

- **Frontend**: React 19, TypeScript 5, Vite 7
- **Desktop**: Electron 41
- **Styling**: Tailwind CSS 4, shadcn/ui (radix-nova style)
- **Testing**: Jest 29, Testing Library, jsdom/node environments
- **Package Manager**: pnpm 9.15.0 (required)

## Code Style Guidelines

### TypeScript

- **Strict mode**: Enabled (`strict: true`)
- **No unused**: Locals and parameters must be used or removed
- **Import extensions**: Use `.ts`/`.tsx` extensions in imports
- **Type imports**: Use `import type { Foo }` for type-only imports
- **Interfaces**: Prefer over `type` for object shapes
- **Props naming**: Use destructured props with explicit types

### Imports & Organization

```typescript
// 1. React/external imports
import * as React from "react"
import { Slot } from "radix-ui"

// 2. Third-party
import { cva, type VariantProps } from "class-variance-authority"

// 3. Internal aliases (@/)
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// 4. Relative imports (when needed)
import { MyComponent } from "./MyComponent"
```

### File Structure

```
src/
├── components/
│   └── ui/           # shadcn components (Button, Input, etc.)
├── features/         # Feature-based modules
│   ├── search/
│   ├── sidebar/
│   └── tabs/
├── lib/
│   └── utils.ts      # `cn()` and utilities
├── types/
│   └── global.d.ts   # Global type declarations
└── hooks/            # Custom React hooks
```

### Component Conventions

```typescript
// Use function declarations, not arrow functions
function Button({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & {
  asChild?: boolean
}) {
  // Implementation
}

// Named exports
export { Button, buttonVariants }

// Props interface (when complex)
interface FeatureProps {
  title: string
  onAction?: (value: string) => void
}
```

### Styling (Tailwind + shadcn)

- Use `cn()` utility for conditional classes
- Prefer HSL color variables from `index.css`
- Use CSS variables for theming (sidebar tokens, etc.)
- Hardware acceleration classes for animations: `animate-hardware`, `gpu-transform`
- Follow shadcn component patterns for consistency

### Naming Conventions

- **Files**: PascalCase for components (`Button.tsx`), camelCase for utilities
- **Components**: PascalCase (`SidebarApp`, `SearchModal`)
- **Hooks**: camelCase starting with `use` (`useMobile`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Props**: camelCase, event handlers prefixed with `on` (`onClick`, `onAction`)
- **CSS Classes**: kebab-case, use Tailwind utilities

### Error Handling

```typescript
// Always check for null/undefined in React roots
const root = document.getElementById('app')
if (!root) {
  console.error('[Component] Root element not found')
  return
}

// Use TypeScript's strict null checks
function processData(data: unknown): asserts data is MyType {
  if (!isValid(data)) throw new Error('Invalid data')
}
```

### Electron Specifics

- Main process code in `electron/` directory
- Modules use CommonJS (`module.exports`)
- Tests in `__tests__/` with `.test.js` suffix
- Preload scripts bridge main/renderer

### Testing

```javascript
// Electron tests (node environment)
describe('Module', () => {
  test('should do something', () => {
    expect(result).toBe(expected)
  })
})

// React tests (jsdom environment)
import { render, screen } from '@testing-library/react'
test('renders button', () => {
  render(<Button>Click</Button>)
  expect(screen.getByText('Click')).toBeInTheDocument()
})
```

### Critical Rules

1. **Always use pnpm** - Never npm/yarn
2. **TypeScript strict** - No `any`, unused vars, or implicit returns
3. **Path aliases** - Use `@/` for imports from `src/`
4. **Component exports** - Named exports, not default
5. **shadcn patterns** - Follow existing UI component conventions
6. **Electron context** - Respect main/renderer process boundaries
