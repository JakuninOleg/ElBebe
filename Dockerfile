# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24-bookworm-slim
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL
ENV EL_BEBE_DOCKER=true EMDASH_SITE_URL=${SITE_URL}
RUN npm run build \
    && node -e 'require("node:fs").writeFileSync("image-origin.txt", process.env.EMDASH_SITE_URL)' \
    && npm prune --omit=dev

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321 \
    EL_BEBE_DOCKER=true EL_BEBE_PRIVATE_DB=/var/lib/el-bebe/office/office.sqlite \
    EMDASH_ENCRYPTION_KEY_FILE=/run/secrets/emdash_encryption_key
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json /app/image-origin.txt ./
COPY --from=build --chown=node:node /app/deploy ./deploy
RUN mkdir -p /var/lib/el-bebe/cms /var/lib/el-bebe/uploads /var/lib/el-bebe/office /var/lib/el-bebe/sessions \
    && chown -R node:node /var/lib/el-bebe \
    && chmod 700 /var/lib/el-bebe /var/lib/el-bebe/cms /var/lib/el-bebe/uploads /var/lib/el-bebe/office /var/lib/el-bebe/sessions
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD ["node", "deploy/healthcheck.mjs"]
CMD ["node", "--import", "./deploy/runtime.mjs", "./dist/server/entry.mjs"]
