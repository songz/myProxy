#!/usr/bin/env bash
# Identifies suspicious IPs whose request frequency exceeds a threshold.
# Prints a condensed report suitable for alert emails or log ingestion.
# Run as a cron job, e.g.: */15 * * * * /path/to/suspicious-ips.sh
#
# Usage:
#   suspicious-ips.sh [--hours N] [--threshold N] [--domain DOMAIN]
#
# Options:
#   --hours N        Time window to analyse (default: 1)
#   --threshold N    Min requests to flag as suspicious (default: 100)
#   --domain DOMAIN  Limit to a specific domain log (default: all)
#
# Environment:
#   LOGPATH  Directory containing *-access.log files (default: /home/myproxy/logs)

set -euo pipefail

LOGPATH="${LOGPATH:-/home/myproxy/logs}"
HOURS=1
THRESHOLD=100
DOMAIN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hours)     HOURS="$2";     shift 2 ;;
    --threshold) THRESHOLD="$2"; shift 2 ;;
    --domain)    DOMAIN="$2";    shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -d "$LOGPATH" ]]; then
  echo "Log directory not found: $LOGPATH" >&2
  exit 1
fi

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
  exit 0
fi

RESULTS=$(awk -v cutoff="$CUTOFF" -v threshold="$THRESHOLD" '
{
  ts = $1
  gsub(/[TZ:.]/, " ", ts)
  gsub(/-/, " ", ts)
  split(ts, parts, " ")
  epoch = mktime(parts[1] " " parts[2] " " parts[3] " " parts[4] " " parts[5] " " parts[6])
  if (epoch >= cutoff) {
    ip = $NF
    count[ip]++
  }
}
END {
  found = 0
  for (ip in count) {
    if (count[ip] >= threshold) {
      print count[ip], ip
      found = 1
    }
  }
  exit (found ? 0 : 1)
}
' "${LOG_FILES[@]}" | sort -rn)

if [[ -z "$RESULTS" ]]; then
  exit 0
fi

echo "=========================================="
echo " myProxy SUSPICIOUS IP ALERT"
echo " Window    : last ${HOURS} hour(s)"
echo " Threshold : ${THRESHOLD} requests"
echo " Generated : $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="
printf "%-45s  %s\n" "IP ADDRESS" "REQUESTS"
echo "------------------------------------------"
echo "$RESULTS" | awk '{printf "%-45s  %d\n", $2, $1}'
echo "=========================================="
