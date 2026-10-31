FROM node:24-bookworm-slim
WORKDIR /seed
COPY --chmod=644 package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=error
COPY --chmod=644 seed.mjs ./
USER node
ENTRYPOINT ["node", "seed.mjs"]
