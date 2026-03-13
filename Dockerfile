FROM oven/bun:1-alpine AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
COPY packages/shared/package.json /temp/dev/packages/shared/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock* /temp/prod/
COPY packages/shared/package.json /temp/prod/packages/shared/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/package.json ./package.json
COPY --from=prerelease /usr/src/app/packages/shared ./packages/shared
COPY --from=prerelease /usr/src/app/models ./models

RUN mkdir -p /usr/src/app/uploads && chown -R bun:bun /usr/src/app/uploads

USER bun
EXPOSE 3000/tcp
CMD ["bun", "run", "dist/server.js"]
