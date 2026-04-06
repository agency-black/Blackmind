#!/usr/bin/env zsh
# ============================================================
# ~/.agents/bin/register.sh
# Migra manualmente una herramienta AI al sistema centralizado
# Uso: register.sh <nombre>   ejemplo: register.sh .cursor
# ============================================================

BASE="$HOME/.agents"
TOOLS_DIR="$BASE/tools"

if [ -z "$1" ]; then
  echo "❌ Uso: register.sh <nombre>   (ejemplo: register.sh .cursor)"
  exit 1
fi

TOOL="$1"
SRC="$HOME/$TOOL"
DEST="$TOOLS_DIR/$TOOL"

# ── Si la carpeta ya está en tools/ solo crear el symlink ──
if [ -d "$DEST" ] && [ ! -L "$SRC" ]; then
  ln -s "$DEST" "$SRC"
  echo "✅ Symlink creado: ~/$TOOL → $DEST"

# ── Si existe en $HOME como carpeta real, migrarla ──
elif [ -d "$SRC" ] && [ ! -L "$SRC" ]; then
  mv "$SRC" "$DEST"
  ln -s "$DEST" "$SRC"
  echo "✅ $TOOL migrada a $DEST + symlink creado"

# ── Si ya es symlink ──
elif [ -L "$SRC" ]; then
  echo "ℹ️  $TOOL ya está registrado (es symlink)"
  readlink "$SRC"
  exit 0

# ── Herramienta no existe, crearla vacía ──
else
  mkdir -p "$DEST"
  ln -s "$DEST" "$SRC"
  echo "✅ $TOOL creada en $DEST + symlink en ~/$TOOL"
fi

# Vincular skills/ si existe y no es symlink
if [ -d "$DEST/skills" ] && [ ! -L "$DEST/skills" ]; then
  rm -rf "$DEST/skills"
  ln -s "$BASE/skills" "$DEST/skills"
  echo "🔗 $TOOL/skills → $BASE/skills"
fi

echo "🎉 $TOOL integrada al ecosistema ~/.agents"
