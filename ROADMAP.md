# Roadmap

This extension is the **pi side** of the integration. For Entire to actually work with pi, a **Go agent adapter** needs to be contributed to the [entireio/cli](https://github.com/entireio/cli) repository. This roadmap covers both sides.

## Status

- [x] Pi extension — maps lifecycle events to `entire hooks pi <event>` CLI calls
- [ ] Entire agent adapter — teaches Entire how to read pi sessions and manage pi hooks

## Phase 1: Entire Agent Adapter (Go — contribute to entireio/cli)

This is the blocking work. Without it, `entire hooks pi <event>` doesn't exist.

### What needs to be built

A new package at `cmd/entire/cli/agent/pi/` in the Entire repo, following the pattern of the existing OpenCode adapter (`cmd/entire/cli/agent/opencode/`). The adapter needs these files:

#### `pi.go` — Agent registration
- Implement `agent.Agent` interface
- Register `"pi"` in the agent registry (`cmd/entire/cli/agent/registry.go`)
- Define agent metadata (name, display name, detection logic)

#### `hooks.go` — Hook installation
- Implement `agent.HookSupport` interface
- `InstallHooks()` — Write this extension to `.pi/extensions/entire.ts` (similar to how the OpenCode adapter writes its plugin to `.opencode/plugins/entire.ts`)
- `UninstallHooks()` — Remove the extension file
- `AreHooksInstalled()` — Check if the extension exists and contains the marker string

#### `lifecycle.go` — Event parsing
- Implement `ParseHookEvent()` to translate hook names to `agent.Event`:
  - `session-start` → `agent.SessionStart`
  - `session-end` → `agent.SessionEnd`
  - `turn-start` → `agent.TurnStart`
  - `turn-end` → `agent.TurnEnd`
  - `compaction` → `agent.Compaction`
- Determine session transcript path (pi stores sessions at `~/.pi/agent/sessions/`)

#### `transcript.go` — Session parsing
- Implement `agent.TranscriptAnalyzer` and `agent.TranscriptPreparer`
- Parse pi's JSONL session format (see [pi session docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/session.md))
- Extract:
  - User prompts from `user_message` entries
  - Modified files from `tool_call` entries (look for `edit`, `write`, `bash` tool calls)
  - Assistant responses from `assistant_message` entries
- Handle pi's tree structure (`id`/`parentId` linking) — follow the active branch

#### `types.go` — Pi-specific types
- Define structs for pi's JSONL entry types:
  - `header` (version, session ID)
  - `user_message`, `assistant_message`, `tool_call`, `tool_result`
  - `compaction`, `branch_summary`
- Define hook input payloads (`sessionInfoRaw`, `turnStartRaw`, etc.)

### Key differences from OpenCode adapter

| Aspect | OpenCode | Pi |
|--------|----------|----|
| Session format | JSON export via `opencode export` | JSONL file on disk |
| Session location | Export on demand | `~/.pi/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl` |
| Plugin mechanism | `.opencode/plugins/*.ts` (Bun) | `.pi/extensions/*.ts` (Node/esbuild) |
| Transcript access | CLI export command | Direct file read |
| Tree structure | Linear | Tree with `id`/`parentId` branching |

### Reference files in entireio/cli

- `cmd/entire/cli/agent/types/agent.go` — `Agent` interface
- `cmd/entire/cli/agent/opencode/` — Complete reference implementation
- `cmd/entire/cli/agent/registry.go` — Where to register the new agent
- `cmd/entire/cli/agent/event.go` — Event types

## Phase 2: Testing & Refinement

- [ ] Test the full loop: pi extension → Entire hooks → checkpoint creation → rewind/resume
- [ ] Handle edge cases:
  - Ephemeral sessions (`pi --no-session`) — skip Entire hooks
  - Session branching (`/tree`) — how does Entire handle non-linear history?
  - Compaction — ensure Entire captures pre-compaction state
- [ ] Verify `entire rewind` correctly restores pi session state
- [ ] Verify `entire resume` can reconstruct enough context for pi to continue

## Phase 3: Polish & Release

- [ ] Submit PR to entireio/cli with the Go agent adapter
- [ ] Publish pi-entire to npm as a pi package
- [ ] Add `entire enable --agent pi` support
- [ ] Write integration tests
- [ ] Add to pi package gallery

## Phase 4: Nice-to-haves

- [ ] `entire explain` support — generate human-readable summaries of pi sessions
- [ ] Token usage tracking via `agent.TokenCalculator` interface
- [ ] Session condensation support (Entire's way of summarizing long transcripts)
- [ ] Coordinate with pi maintainer on any helpful session export API
  - Currently pi has no `pi export <sessionId>` CLI command
  - The adapter must read JSONL files directly, which is fine but couples to the format

## Contributing

The Entire agent adapter is the main contribution needed. If you're interested:

1. Fork [entireio/cli](https://github.com/entireio/cli)
2. Study the OpenCode adapter at `cmd/entire/cli/agent/opencode/`
3. Create `cmd/entire/cli/agent/pi/` following the same structure
4. Open a PR — reference this repo for the pi extension side

Alternatively, open an issue on entireio/cli requesting pi agent support and link to this repo.
