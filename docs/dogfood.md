# Dogfooding checklist

## Prereqs

1. Local fork of `entireio/cli` built and available on disk.
2. `ENTIRE_BIN` exported to that local binary.
3. Target git repo with at least one commit.

## Flow

You can bootstrap with:

```bash
./scripts/dogfood-local.sh /absolute/path/to/local/entire
```

Manual steps:

1. `entire enable --agent pi`
2. Start pi with local extension path:
   - `pi --extension /path/to/pi-entire/extensions/entire.ts`
3. Run at least 2 turns that edit files.
4. Commit changes.
5. Verify:
   - `entire status` shows active session/checkpoints
   - `entire rewind` lists checkpoints from that pi session
   - rewind restores expected code

## Quick sanity checks

- Run once with `--no-session` and confirm no hooks are emitted.
- Run once with `ENTIRE_BIN` unset and confirm warnings are user-friendly.
