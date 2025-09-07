FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=@repo/media-browser --prod /prod/media-browser
RUN pnpm deploy --filter=@repo/warforum-indexer --prod /prod/warforum-indexer
RUN pnpm deploy --filter=@repo/csfd-worker --prod /prod/csfd-worker
RUN pnpm deploy --filter=@repo/rt-worker --prod /prod/rt-worker
RUN pnpm deploy --filter=@repo/tmdb-worker --prod /prod/tmdb-worker


FROM base AS media-browser
COPY --from=build /prod/media-browser /prod/media-browser
WORKDIR /prod/media-browser
RUN pnpm run build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

FROM base AS warforum-indexer
COPY --from=build /prod/warforum-indexer /prod/warforum-indexer
WORKDIR /prod/warforum-indexer
CMD ["node", "dist/index.js"]

FROM base AS csfd-worker
COPY --from=build /prod/csfd-worker /prod/csfd-worker
WORKDIR /prod/csfd-worker
CMD ["node", "dist/index.js"]

FROM base AS rt-worker
COPY --from=build /prod/rt-worker /prod/rt-worker
WORKDIR /prod/rt-worker
CMD ["node", "dist/index.js"]

FROM base AS tmdb-worker
COPY --from=build /prod/tmdb-worker /prod/tmdb-worker
WORKDIR /prod/tmdb-worker
CMD ["node", "dist/index.js"]