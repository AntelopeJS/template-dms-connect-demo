FROM node:24-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/*
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable \
  && mkdir -p /app/node_modules \
  && chown -R node:node /app /home/node
USER node
RUN corepack prepare pnpm@10.2.0 --activate
WORKDIR /app
CMD ["sh", "docker/start.sh"]
