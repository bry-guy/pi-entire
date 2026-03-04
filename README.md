# pi-entire

[Entire CLI](https://entire.io) integration for [pi coding agent](https://github.com/badlogic/pi-mono). Captures AI coding sessions as git-linked checkpoints — every commit gets paired with the full agent conversation that produced it.

> **⚠️ Local-fork dogfood mode**: upstream `entireio/cli` does not include the `pi` adapter yet. Use your forked Entire binary locally.

## Quickstart (no npm required)

### 1) Build your local Entire fork binary

```bash
git clone git@github.com:bry-guy/entire-cli.git ~/dev/entireio/entire-cli
cd ~/dev/entireio/entire-cli
mise trust mise.toml
mise run build   # outputs: ~/dev/entireio/entire-cli/entire
```

### 2) Enable Entire + install this extension from git in your target repo

```bash
cd /path/to/your/project
export ENTIRE_BIN=~/dev/entireio/entire-cli/entire
$ENTIRE_BIN enable --agent pi --absolute-git-hook-path
pi install git:github.com/bry-guy/pi-entire#feat/dogfood-foundation -l
```

### 3) Run pi

```bash
ENTIRE_BIN=~/dev/entireio/entire-cli/entire pi
```

That’s it. No npm needed to use the extension.

---

## One-command setup helper

You can also run:

```bash
~/dev/pi-entire/scripts/dogfood-local.sh \
  ~/dev/entireio/entire-cli/entire \
  /path/to/your/project
```

---

## How it works

The extension maps pi lifecycle events to Entire CLI hook calls:

| Pi Event | Entire Hook | When |
|----------|-------------|------|
| `session_start` | `entire hooks pi session-start` | Pi session begins |
| `before_agent_start` | `entire hooks pi turn-start` | User submits a prompt |
| `turn_end` | `entire hooks pi turn-end` | Agent finishes responding |
| `session_before_compact` | `entire hooks pi compaction` | Context is being compacted |
| `session_shutdown` | `entire hooks pi session-end` | Pi exits |

Hook payloads include `session_id`, `session_ref`, `leaf_id`, prompt, and model info.

## Local verification

In your target repo:

```bash
$ENTIRE_BIN status
$ENTIRE_BIN rewind
```

And for ephemeral behavior:

```bash
ENTIRE_BIN=~/dev/entireio/entire-cli/entire pi --no-session
```

---

## Development (only if modifying this repo)

```bash
cd ~/dev/pi-entire
npm install
npm run validate
```

## License

MIT
