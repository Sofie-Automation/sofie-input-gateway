FROM node:22-alpine AS builder

# Environment

WORKDIR /src

# Common

COPY package.json tsconfig.json yarn.lock lerna.json .yarnrc.yml ./
COPY scripts ./scripts
# COPY .yarn ./.yarn

# Pakcages
COPY packages ./packages

# Install
RUN corepack enable
RUN yarn install

# Build
RUN yarn build

# Purge dev-dependencies:
RUN yarn workspaces focus -A --production

RUN rm -r scripts

# Create deploy-image:
FROM node:22-alpine

RUN apk add --no-cache fontconfig alsa-lib

COPY --from=builder /src /src

WORKDIR /src/packages/input-gateway
ENTRYPOINT ["node", "dist/index.js"]