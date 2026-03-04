# Contributing

## Local development

```bash
npm install
npm run validate
```

## Running locally with pi

For package users (no npm needed):

```bash
cd /target/repo
export ENTIRE_BIN=~/dev/entireio/entire-cli/entire
$ENTIRE_BIN enable --agent pi --absolute-git-hook-path
pi install git:github.com/bry-guy/pi-entire#feat/dogfood-foundation -l
ENTIRE_BIN=$ENTIRE_BIN pi
```

For extension hacking from this checkout:

```bash
pi --extension /absolute/path/to/pi-entire/extensions/entire.ts
```

## Test commands

- `npm run test` – unit tests
- `npm run typecheck` – TypeScript checks
- `npm run validate` – typecheck + tests

## Versioning

- Use SemVer.
- Keep changes under `## [Unreleased]` in `CHANGELOG.md`.
- Cut `0.x` releases while APIs/integration are still evolving.
