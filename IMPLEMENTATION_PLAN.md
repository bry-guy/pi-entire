# Implementation Plan (Local-first)

## Phase 0 (this repo)
- [x] Harden extension process execution (`spawn`/`spawnSync`).
- [x] Add `ENTIRE_BIN` override for local binary dogfooding.
- [x] Add tests for lifecycle event mapping and failure cases.
- [x] Add changelog + contribution docs.

## Phase 1 (entire fork)
- [ ] Add `pi` agent package under `cmd/entire/cli/agent/pi`.
- [ ] Implement hook install/uninstall for `.pi/extensions/entire.ts`.
- [ ] Implement lifecycle parsing for `session-start|turn-start|turn-end|compaction|session-end`.
- [ ] Implement transcript parsing from pi JSONL sessions.

## Phase 2 (dogfood)
- [ ] Build local Entire binary from fork.
- [ ] Enable in target repo with `--agent pi`.
- [ ] Run end-to-end checkpoint / rewind / resume tests.

## Phase 3 (upstream)
- [ ] Open PR to `entireio/cli` with adapter + tests.
- [ ] Update this repo docs to remove "not yet functional" warning once merged/released.
