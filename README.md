# Movie Harvester

Automated movie harvesting and management system that discovers, downloads, and organizes movies from various sources.

## Architecture

### Apps
- **csfd-scraper** - Scrapes ratings from CSFD.cz
- **rt-scraper** - Scrapes ratings from Rotten Tomatoes
- **webshare-downloader** - Downloads files from Webshare.cz
- **link-checker** - Validates download links
- **warforum-indexer** - Indexes movies from Warforum
- **warforum-extractor** - Extracts download links from Warforum
- **movie-browser** - Web interface for browsing movies
- **metadata-fetcher** - Fetches metadata from TMDB

### Packages
- **@repo/database** - Drizzle ORM with SQLite
- **@repo/shared** - Shared utilities and services
- **@repo/types** - TypeScript type definitions

## Getting Started

```bash
# Install dependencies manually as needed
pnpm add -w typescript tsdown @antfu/eslint-config eslint

# Setup database
pnpm run db:generate
pnpm run db:push

# Build all apps
pnpm run build

# Development mode
pnpm run dev
```

## Workflow

1. **warforum-indexer** → Discover movies and topics
2. **metadata-fetcher** → Fetch TMDB metadata
3. **csfd-scraper** + **rt-scraper** → Get ratings
4. **movie-browser** → User selects movies to download
5. **warforum-extractor** → Extract download links
6. **link-checker** → Validate links
7. **webshare-downloader** → Download movies

## Environment Variables

Copy `.env.example` to `.env` and fill in your API keys and credentials.

## Requirements

- Node.js 22+
- PNPM 9+
