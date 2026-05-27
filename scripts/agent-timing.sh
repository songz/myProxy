#!/usr/bin/env bash
# Run a command (or the standard build/test pipeline) and log start, end, and
# duration timestamps to stdout so the agent's full time log can be examined
# for bottlenecks.
#
# Usage:
#   ./scripts/agent-timing.sh <command> [args...]   # time a single command
#   ./scripts/agent-timing.sh --pipeline            # time install, build, test
#   ./scripts/agent-timing.sh                       # same as --pipeline
#
# Output format (one line each, prefixed with [TIMING]):
#   [TIMING] start  YYYY-MM-DD HH:MM:SS UTC | <label>
#   [TIMING] end    YYYY-MM-DD HH:MM:SS UTC | <label> | exit=<code> | duration=<secs>s
#
# Exit code matches the last command run.

set -uo pipefail

run_timed() {
  local label="$1"
  shift
  local start_epoch end_epoch duration exit_code
  start_epoch=$(date -u +%s)
  echo "[TIMING] start  $(date -u '+%Y-%m-%d %H:%M:%S UTC') | ${label}"
  "$@"
  exit_code=$?
  end_epoch=$(date -u +%s)
  duration=$(( end_epoch - start_epoch ))
  echo "[TIMING] end    $(date -u '+%Y-%m-%d %H:%M:%S UTC') | ${label} | exit=${exit_code} | duration=${duration}s"
  return "$exit_code"
}

run_pipeline() {
  local overall_start overall_end overall_duration step_exit
  overall_start=$(date -u +%s)
  echo "[TIMING] ===== pipeline start $(date -u '+%Y-%m-%d %H:%M:%S UTC') ====="

  run_timed "npm install" npm install
  step_exit=$?
  if [[ $step_exit -ne 0 ]]; then
    echo "[TIMING] pipeline aborted after 'npm install' (exit=${step_exit})"
    return "$step_exit"
  fi

  run_timed "npm run build" npm run build
  step_exit=$?
  if [[ $step_exit -ne 0 ]]; then
    echo "[TIMING] pipeline aborted after 'npm run build' (exit=${step_exit})"
    return "$step_exit"
  fi

  run_timed "npm test" npm test
  step_exit=$?

  overall_end=$(date -u +%s)
  overall_duration=$(( overall_end - overall_start ))
  echo "[TIMING] ===== pipeline end   $(date -u '+%Y-%m-%d %H:%M:%S UTC') | total=${overall_duration}s ====="
  return "$step_exit"
}

if [[ $# -eq 0 || "${1:-}" == "--pipeline" ]]; then
  run_pipeline
  exit $?
fi

label="$*"
run_timed "$label" "$@"
exit $?
