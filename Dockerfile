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

FROM base AS media-browser
COPY --from=build /prod/media-browser /prod/media-browser
WORKDIR /prod/media-browser
RUN pnpm run build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

FROM base AS warforum-indexer
COPY --from=build /prod/warforum-indexer /prod/warforum-indexer
WORKDIR /prod/warforum-indexer
RUN pnpm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]