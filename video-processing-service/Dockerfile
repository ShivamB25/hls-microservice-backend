FROM oven/bun:1-alpine AS base
RUN apk add --no-cache ffmpeg
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock* /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
COPY --from=install /temp/dev/node_modules/@hls ./node_modules/@hls

ENV NODE_ENV=production
RUN bun run build

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/package.json ./package.json
COPY --from=prerelease /usr/src/app/models ./models

RUN mkdir -p /usr/src/app/uploads /usr/src/app/hls \
  && chown -R bun:bun /usr/src/app/uploads /usr/src/app/hls

USER bun
EXPOSE 3001/tcp
CMD ["bun", "run", "dist/worker.js"]
