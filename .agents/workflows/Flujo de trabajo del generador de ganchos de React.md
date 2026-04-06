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

