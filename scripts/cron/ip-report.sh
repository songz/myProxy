#!/usr/bin/env bash
# Groups all proxy requests by IP address and prints frequency report.
# Run as a cron job, e.g.: 0 * * * * /path/to/ip-report.sh >> /var/log/ip-report.log 2>&1
#
# Usage:
#   ip-report.sh [--hours N] [--top N] [--domain DOMAIN]
#
# Options:
#   --hours N      Only consider requests from the last N hours (default: 24)
#   --top N        Show only the top N IPs (default: 50)
#   --domain DOMAIN  Limit to a specific domain log (default: all domains)
#
# Environment:
#   LOGPATH  Directory containing *-access.log files (default: /home/myproxy/logs)

set -euo pipefail

LOGPATH="${LOGPATH:-/home/myproxy/logs}"
HOURS=24
TOP=50
DOMAIN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hours)  HOURS="$2";  shift 2 ;;
    --top)    TOP="$2";    shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -d "$LOGPATH" ]]; then
  echo "Log directory not found: $LOGPATH" >&2
  exit 1
fi

# Build cutoff timestamp (seconds since epoch)
CUTOFF=$(date -d "${HOURS} hours ago" +%s 2>/dev/null || date -v "-${HOURS}H" +%s)

if [[ -n "$DOMAIN" ]]; then
  LOG_GLOB="${LOGPATH}/${DOMAIN}-access.log"
else
  LOG_GLOB="${LOGPATH}/*-access.log"
fi

shopt -s nullglob
LOG_FILES=($LOG_GLOB)
shopt -u nullglob

if [[ ${#LOG_FILES[@]} -eq 0 ]]; then
  echo "No access log files found in ${LOGPATH}" >&2
  exit 0
fi

echo "=========================================="
echo " myProxy IP Frequency Report"
echo " Period : last ${HOURS} hour(s)"
echo " Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
if [[ -n "$DOMAIN" ]]; then
  echo " Domain : ${DOMAIN}"
fi
echo "=========================================="
printf "%-6s  %-45s  %s\n" "RANK" "IP ADDRESS" "REQUESTS"
echo "------------------------------------------"

# Each access log line: timestamp method host+url status durationMs ip
# Filter by cutoff, extract IP (last field), count, sort, limit
awk -v cutoff="$CUTOFF" '
{
  # Parse ISO timestamp from field 1: 2024-01-15T10:30:00.000Z
  ts = $1
  gsub(/[TZ:.]/, " ", ts)  # replace T, Z, colons, dots with spaces
  gsub(/-/, " ", ts)
  # ts is now: "YYYY MM DD HH MM SS <fractional> "
  split(ts, parts, " ")
  epoch = mktime(parts[1] " " parts[2] " " parts[3] " " parts[4] " " parts[5] " " parts[6])
  if (epoch >= cutoff) {
    ip = $NF
    count[ip]++
  }
}
END {
  for (ip in count) print count[ip], ip
}
' "${LOG_FILES[@]}" | sort -rn | head -n "$TOP" | awk '{printf "%-6d  %-45s  %d\n", NR, $2, $1}'

echo "=========================================="
