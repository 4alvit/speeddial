FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9
ARG VCS_REF=unknown
ARG VERSION=1.1.0
LABEL org.opencontainers.image.title="Alvit Speed Dial" \
      org.opencontainers.image.source="https://github.com/4alvit/speeddial" \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.version=$VERSION
RUN apt-get update && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs screenshot.mjs screenshot-worker.mjs safe-proxy.mjs access.mjs initial-state.mjs bounded-file.mjs ./
COPY public ./public
RUN mkdir /data && chown node:node /data
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data CHROMIUM_PATH=/usr/bin/chromium
USER node
EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.mjs"]
