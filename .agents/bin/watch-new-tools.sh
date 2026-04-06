#!/usr/bin/env zsh
# ============================================================
# ~/.agents/bin/watch-new-tools.sh
# Detecta nuevas carpetas de herramientas AI en $HOME
# y las migra automáticamente a ~/.agents/tools/
# Invocado por LaunchAgent al detectar cambios en $HOME
# ============================================================

BASE="$HOME/.agents"
TOOLS_DIR="$BASE/tools"
LOG="$BASE/logs/watcher.log"
mkdir -p "$BASE/logs"

# Patrones reconocidos como herramientas AI (nombre de carpeta)
KNOWN_PATTERNS=(
  "cursor" "windsurf" "zed" "continue" "cline" "aider" "sweep"
  "supermaven" "tabnine" "codeium" "sourcegraph" "sourcery"
  "aide" "plandex" "smol" "mentat" "gpt-pilot" "opendevin"
  "devon" "swe-agent" "moatless" "agentless" "autocode"
  "replit" "devin" "rift" "grit" "gritql" "ghostwriter"
)

# Archivos internos que identifican herramientas AI (si la carpeta los tiene)
SIGNATURE_FILES=(
  "skills" "GEMINI.md" "config.toml" "settings.json"
  ".personality_migration" "mcp_config.json" "agents.json"
  "models_cache.json" "auth.json"
)

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }

log() { echo "[$(timestamp)] $1" | tee -a "$LOG"; }

is_ai_tool() {
  local dir_name="${1#.}"  # quitar el punto inicial
  local full_path="$HOME/.$dir_name"

  # 1. Verificar si coincide con patrones conocidos
  for pattern in "${KNOWN_PATTERNS[@]}"; do
    if [[ "$dir_name" == *"$pattern"* ]]; then
      return 0
    fi
  done

  # 2. Verificar si contiene archivos firma de herramientas AI
  for sig in "${SIGNATURE_FILES[@]}"; do
    if [ -e "$full_path/$sig" ]; then
      return 0
    fi
  done

  return 1
}

migrate_tool() {
  local tool="$1"          # ej: .cursor
  local src="$HOME/$tool"
  local dest="$TOOLS_DIR/$tool"

  # No migrar si ya es symlink o ya está en tools/
  [ -L "$src" ] && return
  [ -e "$dest" ] && return

  log "🆕 Nueva herramienta detectada: $tool"
  mv "$src" "$dest"
  ln -s "$dest" "$src"
  log "✅ $tool → migrada a $TOOLS_DIR y symlink creado"

  # Si tiene carpeta skills/, vincularla a la fuente centralizada
  if [ -d "$dest/skills" ] && [ ! -L "$dest/skills" ]; then
    rm -rf "$dest/skills"
    ln -s "$BASE/skills" "$dest/skills"
    log "🔗 $tool/skills → vinculada a $BASE/skills"
  fi
}

# Escanear $HOME buscando nuevas carpetas con punto (dotfolders)
log "🔍 Escaneando $HOME por nuevas herramientas AI..."

for entry in "$HOME"/.[^.]*/; do
  dir=$(basename "$entry")
  src="$HOME/$dir"

  # Ignorar symlinks y carpetas del sistema o ya conocidas
  [ -L "$src" ] && continue
  [[ "$dir" == ".agents" ]] && continue
  [[ "$dir" == ".Trash" ]] && continue
  [[ "$dir" == ".ssh" ]] && continue
  [[ "$dir" == ".config" ]] && continue
  [[ "$dir" == ".local" ]] && continue
  [[ "$dir" == ".cache" ]] && continue
  [[ "$dir" == ".npm" ]] && continue
  [[ "$dir" == ".yarn" ]] && continue
  [[ "$dir" == ".bundle" ]] && continue
  [[ "$dir" == ".gradle" ]] && continue
  [[ "$dir" == ".volta" ]] && continue
  [[ "$dir" == ".fig" ]] && continue
  [[ "$dir" == ".zsh_sessions" ]] && continue
  [[ "$dir" == ".pdf-toolkit-files" ]] && continue

  if is_ai_tool "$dir"; then
    migrate_tool "$dir"
  fi
done

log "✅ Escaneo completado"
