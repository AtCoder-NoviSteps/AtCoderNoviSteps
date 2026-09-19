# See:
# https://github.com/devcontainers/images/tree/main/src/javascript-node
ARG NODE_VERSION=24
FROM mcr.microsoft.com/devcontainers/javascript-node:${NODE_VERSION}

WORKDIR /usr/src/app
COPY . /usr/src/app

RUN apt-get update \
    && apt-get -y install --no-install-recommends fish iptables ipset dnsutils aggregate \
    && rm -rf /var/lib/apt/lists/*

# The container is the isolation boundary; managed settings disable the agents' nested sandboxes
# here only, while the committed project settings keep them on host clones.
COPY .devcontainer/claude-managed-settings.json /etc/claude-code/managed-settings.json
COPY .devcontainer/codex-managed-config.toml /etc/codex/managed_config.toml

# Limit sudo to the firewall so agents cannot undo it or the managed settings.
COPY --chmod=755 .devcontainer/init-firewall.sh /usr/local/bin/init-firewall.sh
RUN echo 'node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh' > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

ENV NODE_PATH=/node_modules
ENV PATH=/home/node/.local/bin:$PATH:/node_modules/.bin
# `playwright install` cannot run later without sudo.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN pnpm install \
    && pnpm exec playwright install --with-deps chromium

CMD ["pnpm", "dev"]
