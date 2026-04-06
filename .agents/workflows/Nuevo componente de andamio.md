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

