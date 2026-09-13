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

# Install CodeRabbit CLI (continue if fails)
curl -fsSL https://cli.coderabbit.ai/install.sh | sh || echo 'CodeRabbit CLI installation failed, continuing...'

# RTK is an agent-independent CLI. Do not report setup success when its binary is absent.
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh

# Disable telemetry both for this setup process and persistently for later RTK invocations.
export RTK_TELEMETRY_DISABLED=1
rtk telemetry disable
rtk --version
rtk gain >/dev/null

# Agent integration is optional and separate from installing the RTK CLI.
rtk init -g --auto-patch || echo 'RTK init failed, continuing...'

# Install project dependencies
pnpm install
