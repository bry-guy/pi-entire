# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Test harness for extension lifecycle behavior (`tests/entire.test.ts`).
- TypeScript project config (`tsconfig.json`) and validation scripts.
- Contributor and dogfooding documentation.
- Implementation plan document for local-first pi + Entire integration.

### Changed
- Hardened extension command execution:
  - switched hook invocation from shell piping to `spawn` / `spawnSync`
  - added `ENTIRE_BIN` override for local dogfooding
  - included `session_ref` and `leaf_id` in hook payloads when available
  - skipped hook emission for ephemeral (`--no-session`) runs
