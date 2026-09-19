# See:
# https://github.com/devcontainers/images/tree/main/src/javascript-node
ARG NODE_VERSION=24
FROM mcr.microsoft.com/devcontainers/javascript-node:${NODE_VERSION}

WORKDIR /usr/src/app
COPY . /usr/src/app

RUN apt-get update \
    && apt-get -y install --no-install-recommends fish \
    && rm -rf /var/lib/apt/lists/*

# The container is the isolation boundary; managed settings disable the agents' nested sandboxes
# here only, while the committed project settings keep them on host clones.
COPY .devcontainer/claude-managed-settings.json /etc/claude-code/managed-settings.json
COPY .devcontainer/codex-managed-config.toml /etc/codex/managed_config.toml

ENV NODE_PATH=/node_modules
ENV PATH=/home/node/.local/bin:$PATH:/node_modules/.bin

RUN pnpm install

CMD ["pnpm", "dev"]
