#!/usr/bin/env bash
# Pull deployed AWS Lambda source code into lambdas/<function-name>/.
#
# Usage: scripts/sync-lambdas.sh [name-filter]
#   name-filter  optional substring; only functions whose name contains it are synced
#
# Env: AWS_REGION (default us-east-2), AWS_PROFILE (optional)
# Requires: aws CLI v2 (configured), curl, unzip, jq
set -euo pipefail

REGION="${AWS_REGION:-us-east-2}"
FILTER="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/lambdas"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT"

names=$(aws lambda list-functions --region "$REGION" \
  --query 'Functions[].FunctionName' --output text | tr '\t' '\n' | sort)

for name in $names; do
  [[ -n "$FILTER" && "$name" != *"$FILTER"* ]] && continue
  echo "Syncing $name"

  fn=$(aws lambda get-function --region "$REGION" --function-name "$name")
  url=$(jq -r '.Code.Location // empty' <<<"$fn")
  if [[ -z "$url" ]]; then
    echo "  skipped (container image or no downloadable code)"
    continue
  fi

  curl -sSfL "$url" -o "$TMP/$name.zip"
  rm -rf "${OUT:?}/$name"
  mkdir -p "$OUT/$name/src"
  unzip -q -o "$TMP/$name.zip" -d "$OUT/$name/src"

  # Save config, keeping only the *names* of env vars (values often hold secrets).
  jq '.Configuration
      | .EnvironmentVariableNames = ((.Environment.Variables // {}) | keys)
      | del(.Environment, .LastModified, .RevisionId, .CodeSha256, .Version,
            .State, .StateReasonCode, .LastUpdateStatus, .LastUpdateStatusReasonCode)' \
    <<<"$fn" > "$OUT/$name/config.json"
done

echo "Done. Review 'git diff lambdas/' and check for hardcoded secrets before committing."
