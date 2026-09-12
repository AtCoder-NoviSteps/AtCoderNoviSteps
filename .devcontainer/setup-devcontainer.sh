#!/bin/bash
set -euo pipefail

# Install agent CLIs independently so one unavailable registry package does not block setup.
npm install -g @anthropic-ai/claude-code || echo 'Claude Code CLI installation failed, continuing...'

npm install -g @openai/codex || echo 'OpenAI Codex CLI installation failed, continuing...'

# Keep the mounted Codex state private. Project settings live in .codex/config.toml.
# Non-blocking: a mount whose owner does not match must not stop `pnpm install` below.
install -d -m 700 "${CODEX_HOME}" || echo "Could not secure ${CODEX_HOME}, continuing..."

if [[ -e "${CODEX_HOME}/auth.json" ]]; then
  chmod 600 "${CODEX_HOME}/auth.json" || echo 'Could not secure the Codex auth file, continuing...'
fi

# Install CodeRabbit CLI (continue if fails)
curl -fsSL https://cli.coderabbit.ai/install.sh | sh || echo 'CodeRabbit CLI installation failed, continuing...'

# Install RTK — token optimization proxy for AI coding assistants (60-90% reduction)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh || echo 'RTK installation failed, continuing...'
rtk init -g --auto-patch || echo 'RTK init failed, continuing...'

# Install project dependencies
pnpm install
