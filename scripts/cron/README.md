# myProxy Cron Scripts

Scripts for analysing access logs to help identify suspicious traffic patterns.

> For the timing utility used to diagnose where the autonomous coding agent
> spends time during a fix, see [`scripts/agent-timing.sh`](../agent-timing.sh)
> (`npm run timing`).

## ip-report.sh

Groups all proxy requests by IP address and prints a frequency table, sorted by
request count (highest first).

```sh
# Show top 50 IPs for the last 24 hours across all domains
./scripts/cron/ip-report.sh

# Show top 20 IPs for the last 6 hours on a specific domain
./scripts/cron/ip-report.sh --hours 6 --top 20 --domain example.com

# Run every hour and append to a report file
0 * * * * LOGPATH=/home/myproxy/logs /path/to/ip-report.sh >> /var/log/myproxy-ip-report.log 2>&1
```

Sample output:

```
==========================================
 myProxy IP Frequency Report
 Period : last 24 hour(s)
 Generated: 2024-01-15 10:00:00 UTC
==========================================
RANK    IP ADDRESS                                     REQUESTS
------------------------------------------
1       203.0.113.42                                   8471
2       198.51.100.7                                   3204
3       192.0.2.15                                     201
==========================================
```

## suspicious-ips.sh

Prints only IPs that exceed a request threshold within the time window. Exits
silently with no output when no suspicious IPs are found — suitable for cron
jobs that email on non-empty output.

```sh
# Flag IPs with >100 requests in the last hour (default thresholds)
./scripts/cron/suspicious-ips.sh

# Flag IPs with >500 requests in the last 15 minutes
./scripts/cron/suspicious-ips.sh --hours 0.25 --threshold 500

# Run every 15 minutes; send an email only when suspicious IPs are found
# (cron mails stdout automatically when non-empty)
*/15 * * * * LOGPATH=/home/myproxy/logs /path/to/suspicious-ips.sh
```

## Options

| Flag          | Default | Description                          |
|---------------|---------|--------------------------------------|
| `--hours N`   | 24 / 1  | Time window in hours to analyse      |
| `--top N`     | 50      | Max rows in ip-report output         |
| `--threshold N` | 100   | Min requests to flag (suspicious-ips)|
| `--domain D`  | all     | Restrict to one domain's log file    |

## Environment

| Variable  | Default              | Description                    |
|-----------|----------------------|--------------------------------|
| `LOGPATH` | `/home/myproxy/logs` | Directory containing `*-access.log` files |
