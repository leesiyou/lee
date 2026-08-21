FROM node:22.23.2-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM dependencies AS build
ARG BUILD_VERSION=dev
ENV BUILD_VERSION=${BUILD_VERSION}
COPY . .
RUN npm run build
RUN npm prune --omit=dev --workspaces

FROM node:22.23.2-alpine AS runtime
WORKDIR /app
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=4321
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist
USER node
EXPOSE 4321
CMD ["node", "apps/web/dist/server/entry.mjs"]
