# Contributing

## Local development

```bash
npm install
npm run validate
```

## Running locally with pi

```bash
# From a target repo
pi --extension /absolute/path/to/pi-entire/extensions/entire.ts
```

## Dogfooding with a local Entire binary

Set `ENTIRE_BIN` so the extension uses your local fork build:

```bash
export ENTIRE_BIN=/absolute/path/to/entire
```

Then enable hooks in the target repo:

```bash
$ENTIRE_BIN enable --agent pi
```

## Test commands

- `npm run test` – unit tests
- `npm run typecheck` – TypeScript checks
- `npm run validate` – typecheck + tests

## Versioning

- Use SemVer.
- Keep changes under `## [Unreleased]` in `CHANGELOG.md`.
- Cut `0.x` releases while APIs/integration are still evolving.
