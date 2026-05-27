#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SYSTEMS_DIR="${FOUNDRY_DATA:-$HOME/Library/Application Support/FoundryVTT/Data}/systems"
LINK_PATH="$SYSTEMS_DIR/fractal-rpg"

if [[ ! -d "$SYSTEMS_DIR" ]]; then
  echo "Pasta de sistemas não encontrada: $SYSTEMS_DIR"
  echo "Abra o Foundry VTT pelo menos uma vez para criar a estrutura de dados."
  exit 1
fi

if [[ -e "$LINK_PATH" && ! -L "$LINK_PATH" ]]; then
  echo "Já existe uma pasta (não symlink) em: $LINK_PATH"
  echo "Remova ou renomeie manualmente antes de continuar."
  exit 1
fi

ln -sfn "$REPO_ROOT" "$LINK_PATH"
echo "Symlink criado:"
ls -la "$LINK_PATH"

if command -v npm >/dev/null 2>&1; then
  echo ""
  echo "Instalando tipos da API Foundry (IntelliSense no editor)..."
  (cd "$REPO_ROOT" && npm install)
else
  echo ""
  echo "npm não encontrado — pule a instalação de tipos ou instale Node.js."
fi

echo ""
echo "Pronto. Reinicie o Foundry VTT e crie um mundo com o sistema \"Fractal RPG\"."
