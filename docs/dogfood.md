# Dogfooding checklist

## Prereqs

1. Local fork binary built at `~/dev/entireio/entire-cli/entire`.
2. Target git repo with at least one commit.

## Fast path

```bash
~/dev/pi-entire/scripts/dogfood-local.sh \
  ~/dev/entireio/entire-cli/entire \
  /path/to/target-repo
```

Then run:

```bash
cd /path/to/target-repo
ENTIRE_BIN=~/dev/entireio/entire-cli/entire pi
```

## Manual path

```bash
cd /path/to/target-repo
export ENTIRE_BIN=~/dev/entireio/entire-cli/entire
$ENTIRE_BIN enable --agent pi --absolute-git-hook-path
pi install git:github.com/bry-guy/pi-entire#feat/dogfood-foundation -l
ENTIRE_BIN=$ENTIRE_BIN pi
```

## Verify

- `$ENTIRE_BIN status`
- `$ENTIRE_BIN rewind`

## Sanity checks

- `ENTIRE_BIN=$ENTIRE_BIN pi --no-session` (hooks should be skipped)
- unset `ENTIRE_BIN` and start pi (you should see clear warnings)
