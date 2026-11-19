FROM node:24-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libdbus-1-3 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable \
  && mkdir -p /app/node_modules /app/.antelope \
  && chown -R node:node /app /home/node
USER node
RUN corepack prepare pnpm@10.33.0 --activate
USER root
ENV HOME=/home/node
WORKDIR /app
ENTRYPOINT ["sh", "docker/entrypoint.sh"]
CMD ["sh", "docker/start.sh"]
