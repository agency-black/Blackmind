Cerveza casera

Qué puedes hacer

Aprovisione automáticamente una nueva máquina de desarrollo instalando un 
conjunto predefinido de paquetes y contenedores Homebrew.

Integre comprobaciones e instalaciones de dependencias de Homebrew en las 
canalizaciones de CI/CD para garantizar entornos de compilación consistentes.

Programe actualizaciones y mejoras automáticas para todos los paquetes 
Homebrew instalados para mantener las herramientas de desarrollo actualizadas.

Consultar programáticamente los paquetes instalados, sus versiones y 
actualizaciones disponibles para fines de informes o auditoría.

Automatice tareas de mantenimiento como "brew cleanup" para recuperar espacio 
en disco dentro de un entorno de desarrollo.

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
        "GITHUB_PERSONAL_ACCESS_TOKEN": "añade tu token aquí"
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

