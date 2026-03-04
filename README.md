# pi-entire

[Entire CLI](https://entire.io) integration for [pi coding agent](https://github.com/badlogic/pi-mono). Captures AI coding sessions as git-linked checkpoints — every commit gets paired with the full agent conversation that produced it.

> **⚠️ Works with a local Entire fork.** Upstream Entire does not yet include the `pi` adapter. Use your local fork/binary while dogfooding, then upstream the adapter.

## What this does

When working, the full flow is:

1. You use pi to write code
2. This extension sends lifecycle events to Entire CLI (`session-start`, `turn-start`, `turn-end`, etc.)
3. Entire captures your pi session transcript and links it to your git commits
4. You can later `entire rewind` to a known-good checkpoint, or `entire explain` to understand why code was written a certain way

## What Entire provides

- **Session-to-commit linking** — every commit gets a checkpoint with the full agent conversation
- **Rewind** — restore code to any checkpoint when the agent goes sideways
- **Resume** — pick up where you left off with full context
- **Clean git history** — all session metadata lives on a shadow branch (`entire/checkpoints/v1`)
- **Zero maintenance** — hooks run automatically, no extra steps

## Install

```bash
# Install the pi package
pi install git:github.com/bry-guy/pi-entire

# Or for development
pi --extension ./extensions/entire.ts
```

### Prerequisites

1. [Entire CLI](https://entire.io) installed:
   ```bash
   brew tap entireio/tap && brew install entireio/tap/entire
   ```

2. Entire enabled in your repo:
   ```bash
   cd your-project && entire enable --agent pi
   ```

3. **Entire pi agent adapter from your fork** (until upstream ships it).
   - Build/install your forked `entire` binary
   - Optionally set `ENTIRE_BIN=/path/to/local/entire` when running pi

## How it works

The extension maps pi lifecycle events to Entire CLI hook calls:

| Pi Event | Entire Hook | When |
|----------|-------------|------|
| `session_start` | `entire hooks pi session-start` | Pi session begins |
| `before_agent_start` | `entire hooks pi turn-start` | User submits a prompt |
| `turn_end` | `entire hooks pi turn-end` | Agent finishes responding |
| `session_before_compact` | `entire hooks pi compaction` | Context is being compacted |
| `session_shutdown` | `entire hooks pi session-end` | Pi exits |

Each hook call pipes a JSON payload via stdin with session metadata (`session_id`, `session_ref`, `leaf_id`), prompt text, and model info. Entire's agent adapter (Go side) handles the rest — reading pi's JSONL session files, extracting modified files, and creating checkpoints.

## Architecture

```
┌─────────────┐     stdin JSON      ┌──────────────────┐
│  pi agent   │ ──────────────────► │  entire hooks pi  │
│  extension  │   session-start     │  <hook-name>      │
│  (this pkg) │   turn-start        │  (Go adapter)     │
│             │   turn-end          │                    │
│  TypeScript │   compaction        │  Reads pi JSONL    │
│             │   session-end       │  sessions, creates │
│             │                     │  checkpoints       │
└─────────────┘                     └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  Git shadow      │
                                    │  branch:         │
                                    │  entire/         │
                                    │  checkpoints/v1  │
                                    └──────────────────┘
```

## Development

```bash
# In this repo
npm install
npm run validate

# In your target repo (with local Entire fork)
export ENTIRE_BIN=/path/to/local/entire
$ENTIRE_BIN enable --agent pi
pi --extension /path/to/pi-entire/extensions/entire.ts
```

The extension checks for Entire CLI on startup, warns if not installed/enabled, and skips hooks for ephemeral sessions (`--no-session`).

## License

MIT
