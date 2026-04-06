Cara abrazada

Qué puedes hacer

Busque e integre programáticamente modelos de aprendizaje automático 
relevantes del Hugging Face Hub en aplicaciones de IA personalizadas.

Automatice la exploración, el filtrado y la preparación de conjuntos de datos para 
entrenar o ajustar modelos directamente desde el Hub.

Construya agentes inteligentes que puedan realizar búsquedas semánticas de 
artículos de investigación o espacios para proporcionar información o contexto 
actualizado.

Conéctese y organice espacios de herramientas Gradio compatibles dentro de 
canales de aprendizaje automático automatizados o backends de aplicaciones 
personalizados.

Desarrolle interfaces o paneles personalizados que muestren e interactúen 
dinámicamente con modelos y conjuntos de datos alojados en Hugging Face Hub.

Guía de configuración
1
Visita el repositorio oficial en la URL proporcionada arriba
2
Revise el archivo README.md para obtener instrucciones de instalación 
específicas
3
Instale el servidor MCP usando npm, pip o el administrador de paquetes 
recomendado
4
Configure el servidor con sus claves API o credenciales (si es necesario)
5
Agregue el servidor a su configuración de cliente MCP (por ejemplo, Antigravity, 
Cursor, Claude)
6
Reinicie su cliente MCP para cargar el nuevo servidor
7
Pruebe la conexión invocando una herramienta o recurso desde el servidor

Cómo conectarse en antigravedad

Para conectarse a un servidor MCP personalizado en Antigravity:
1
Abra la tienda MCP a través del menú desplegable "..." en la parte superior del 
panel del agente del editor.
2
Haga clic en "Administrar servidores MCP"
3
Haga clic en "Ver configuración sin procesar"
4
Modifique mcp_config.jsoncon su configuración de servidor MCP personalizada.
A continuación se muestra un ejemplo de configuración compatible con editores 
habilitados para MCP como Antigravity , Windsurf , Claude Desktop y Cursor:
{
  "mcpServers": {
    "servidor supabase-mcp": {
      "comando": "npx",
      "argumentos": [
        "-y",
        "@supabase/mcp-server-supabase@último",
        "--token de acceso",
        "añadir token aquí"
      ],
      "env": {}
    },
    "servidor github-mcp": {
      "comando": "docker",
      "argumentos": [
        "correr",
        "-i",
        "--rm",
        "-mi",
        "TOKEN DE ACCESO PERSONAL DE GITHUB",
        "ghcr.io/github/servidor-github-mcp"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": 
"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"
      }
    }
  }
}
Esta configuración define dos servidores: uno que se ejecuta 
mediante npxSupabase y otro mediante dockerGitHub. Asegúrate de reemplazar 
los tokens de marcador de posición con tus claves API reales.

Para obtener una guía detallada paso a paso, consulte nuestro Tutorial de MCP .

Cómo conectarse en Cursor
Para agregar este servidor MCP a Cursor:
1
Abra Configuración del cursor (Archivo > Preferencias > Configuración del 
cursor).
2
Vaya a Características > Servidores MCP .
3
Haga clic en "Agregar nuevo servidor MCP" .
4
Ingrese el nombre, el comando y los argumentos como se especifica en la 
configuración anterior.

