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

