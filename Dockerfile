# See:
# https://github.com/devcontainers/images/tree/main/src/javascript-node
ARG NODE_VERSION=20
FROM mcr.microsoft.com/devcontainers/javascript-node:${NODE_VERSION}

WORKDIR /usr/src/app
ADD . /usr/src/app

ADD package.json /package.json

RUN apt-get update \
    && apt-get -y install --no-install-recommends fish

ENV NODE_PATH=/node_modules
ENV PATH=$PATH:/node_modules/.bin

RUN pnpm install
RUN pnpm update -i --latest

CMD ["pnpm", "dev"]
