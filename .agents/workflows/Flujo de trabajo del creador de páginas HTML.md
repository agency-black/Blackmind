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

