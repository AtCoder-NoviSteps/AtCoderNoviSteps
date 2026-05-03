#!/bin/bash
set -euo pipefail

# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Install CodeRabbit CLI (continue if fails)
curl -fsSL https://cli.coderabbit.ai/install.sh | sh || echo 'CodeRabbit CLI installation failed, continuing...'

# Install RTK — token optimization proxy for AI coding assistants (60-90% reduction)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/master/install.sh | sh
rtk init -g --auto-patch

# Install project dependencies
pnpm install
