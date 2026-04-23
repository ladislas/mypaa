# Verification

## Automated

- `node --experimental-strip-types --test extensions/btw/sidecar.test.mjs`
  - verifies hidden sidecar path mapping
  - verifies launch-anchor vs refresh import target resolution
  - verifies legacy inline BTW migration into a new sidecar
  - verifies sidecar reuse per main session id and isolation between different sessions
  - verifies `/btw` side effects stay in the sidecar instead of modifying the main session file
- `node --experimental-strip-types --check extensions/btw/index.ts`
- `node --experimental-strip-types --check extensions/btw/sidecar.ts`

## Manual spot checks

Using a temporary `PI_CODING_AGENT_DIR` and `--session-dir`, I ran `/btw` through the real `pi` CLI in print mode and inspected the generated JSONL files:

- confirmed BTW sidecars are written under `<sessionDir>/.btw-sidecars/<mainSessionId>/default.jsonl`
- confirmed the sidecar session header records `parentSession`
- confirmed the sidecar stores `btw-sidecar-state`, reset, and launch-anchor metadata entries
- confirmed repeated `/btw` runs for the same main session reuse the same hidden sidecar path
- confirmed different main session ids create different hidden sidecar paths
- confirmed legacy inline BTW entries migrate into the sidecar while the main session file remains unchanged
