#!/bin/bash
set -euo pipefail

# Install agent CLIs independently so one unavailable registry package does not block setup.
npm install -g @anthropic-ai/claude-code || echo 'Claude Code CLI installation failed, continuing...'

npm install -g @openai/codex || echo 'OpenAI Codex CLI installation failed, continuing...'

# Keep the mounted Codex state private.
# Non-blocking: a mount whose owner does not match must not stop `pnpm install` below.
# A default is required because `set -u` aborts on an unset variable before `||` can run.
codex_home="${CODEX_HOME:-/home/node/.codex}"

install -d -m 700 "${codex_home}" || echo "Could not secure ${codex_home}, continuing..."

if [[ -e "${codex_home}/auth.json" ]]; then
  chmod 600 "${codex_home}/auth.json" || echo 'Could not secure the Codex auth file, continuing...'
fi

# Codex reads project settings only from CODEX_HOME, so copy the repository source of truth
# there. Overwriting on every setup keeps the two from drifting apart.
install -m 600 .codex/config.toml "${codex_home}/config.toml" || echo 'Could not install the Codex project config, continuing...'

# Install CodeRabbit CLI (continue if fails)
curl -fsSL https://cli.coderabbit.ai/install.sh | sh || echo 'CodeRabbit CLI installation failed, continuing...'

# Install RTK — token optimization proxy for AI coding assistants (60-90% reduction)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh || echo 'RTK installation failed, continuing...'
rtk init -g --auto-patch || echo 'RTK init failed, continuing...'

# Install project dependencies
pnpm install
