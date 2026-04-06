GitHub

Qué puedes hacer

Automatice la configuración, administración de permisos y la instalación de 
repositorios complejos en cientos de proyectos simultáneamente.

Supervise el estado y el rendimiento de la flota de ejecutores de GitHub Actions 
en tiempo real, lo que permite el escalamiento proactivo y la resolución de 
problemas.

Genere informes consolidados de seguridad y cumplimiento en múltiples 
organizaciones y repositorios de GitHub para fines de auditoría.

Implemente una lógica de procesamiento de webhook personalizada con acceso 
directo al servidor, lo que permite reacciones de baja latencia a los eventos de 
GitHub.

Sincronice datos de proyectos, problemas y solicitudes de extracción de GitHub 
con sistemas externos de planificación de recursos empresariales (ERP) o de 
gestión de proyectos.

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
"github_pat_11B2HUANA0oMyIsVDHUyGp_y7YCHLBhETjxq8JwN29DIQJwgai9WF
oxwkBziDBVGjUWL4HRQACx4GU7wjy"
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

