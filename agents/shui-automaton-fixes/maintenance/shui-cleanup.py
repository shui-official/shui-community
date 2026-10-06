#!/usr/bin/env python3
"""
Fresh start for SHUI's working memory, without touching what judges it.

Run as user automaton, with SHUI stopped:
    sudo systemctl stop shui-agent.service
    sudo -u automaton python3 shui-cleanup.py            # preview only
    sudo -u automaton python3 shui-cleanup.py --apply    # archive + reset
    sudo systemctl start shui-agent.service

Everything removed is first archived in /home/automaton/archive/cleanup-<ts>/
(full state.db backup + moved files). Nothing is deleted from disk.

KEPT (never touched): identity, wallet, config, SOUL/genesis/constitution,
lifespan judge and ledger (shui_* tables, lifespan.* / ledger.* keys), pending
transaction lock, payment requests, audit tables (modifications, policy
decisions, transactions, spend, inference costs), skills, model registry,
heartbeat schedule, the agent code.

RESET: conversation turns and tool calls (the last 20 turns are replayed into
SHUI's context, so old "value creation completed" turns kept steering it),
working/episodic/semantic/procedural/relationship memories, session summaries,
knowledge store, event stream (planner "recent outcomes", incl. fake
successes), goals and tasks, stopped worker records, orchestrator state.
SERVICES: published services that answer are kept online; those that do not
answer are stopped and archived, and folders never published are archived.
Orders, chat history and the Jupiter key are kept.
"""
import argparse
import datetime as dt
import os
import re
import shutil
import sqlite3
import subprocess
import sys

HOME = "/home/automaton"
DB = f"{HOME}/.automaton/state.db"
REPO = f"{HOME}/workspace/automaton-main"
ARCHIVE_ROOT = f"{HOME}/archive"

CLEAR_TABLES = [
    "tool_calls",          # references turns
    "turns",
    "working_memory",
    "episodic_memory",
    "semantic_memory",
    "procedural_memory",
    "relationship_memory",
    "session_summaries",
    "knowledge_store",
    "event_stream",
    "task_graph",          # references goals
    "goals",
]
KV_DELETE_PATTERNS = ["orchestrator.%", "sleep_until"]
KV_PROTECTED_PREFIXES = ("lifespan.", "ledger.", "solana.", "payment.")

# Work folders outside the code: moved to the archive as a whole.
MOVE_PATHS = [
    f"{HOME}/.automaton/workspace",
    f"{HOME}/service",
    f"{HOME}/venv",
    f"{HOME}/arbitrage_env",
]
# Loose files SHUI wrote directly in ~/workspace (next to automaton-main).
WORKSPACE_DIR = f"{HOME}/workspace"
# Untracked items at the root of the code repo that SHUI generated.
REPO_JUNK = re.compile(r"arbitrage|trader|trading|api[_-]?server|defi|revenue|monetiz|deploy_service|value_creation|final_deployment|dashboard|analy[sz]er|scanner|monitor|bot[_-]", re.I)
SERVICES_ROOT = "/srv/shui/services"
SERVICE_HELPER = "/usr/local/sbin/shui-service"


def table_exists(cur, name):
    return cur.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)).fetchone() is not None


def published_services():
    """{name: (state, url)} from the service helper, or None if unavailable."""
    try:
        out = subprocess.run(["sudo", "-n", SERVICE_HELPER, "list"], capture_output=True, text=True, timeout=60)
    except Exception:
        return None
    if out.returncode != 0:
        return None
    found = {}
    for line in out.stdout.splitlines():
        m = re.match(r"^([a-z][a-z0-9-]{1,30}): (\S+) port=\d+ url=(https://\S+)", line)
        if m:
            found[m.group(1)] = (m.group(2), m.group(3))
    return found


def answers(url):
    import urllib.request
    import urllib.error
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return r.status < 500
    except urllib.error.HTTPError as e:
        return e.code < 500
    except Exception:
        return False


def untracked_repo_root_items():
    try:
        out = subprocess.run(
            ["git", "-C", REPO, "ls-files", "--others", "--directory", "--exclude-standard"],
            capture_output=True, text=True, check=True,
        ).stdout.splitlines()
    except Exception:
        return [], []
    top = sorted({line.split("/")[0] for line in out if line})
    junk = [name for name in top if REPO_JUNK.search(name)]
    other = [name for name in top if name not in junk]
    return junk, other


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="really archive and reset (default: preview)")
    args = parser.parse_args()

    if os.geteuid() == 0:
        sys.exit("run as user automaton: sudo -u automaton python3 shui-cleanup.py")
    active = subprocess.run(["systemctl", "is-active", "shui-agent.service"], capture_output=True, text=True).stdout.strip()
    if args.apply and active == "active":
        sys.exit("stop SHUI first: sudo systemctl stop shui-agent.service")

    con = sqlite3.connect(DB)
    cur = con.cursor()
    print("== database (rows to reset)")
    for table in CLEAR_TABLES:
        if table_exists(cur, table):
            print(f"  {table:22} {cur.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]}")
    stopped_children = 0
    if table_exists(cur, "children"):
        stopped_children = cur.execute(
            "SELECT COUNT(*) FROM children WHERE status IN ('stopped','failed','dead','cleaned_up')").fetchone()[0]
        print(f"  {'children (stopped)':22} {stopped_children}")
    kv_keys = [row[0] for pattern in KV_DELETE_PATTERNS
               for row in cur.execute("SELECT key FROM kv WHERE key LIKE ?", (pattern,))]
    kv_keys = [k for k in kv_keys if not k.startswith(KV_PROTECTED_PREFIXES)]
    print(f"  {'kv keys':22} {len(kv_keys)}")
    print("== kept: " + ", ".join(sorted(
        r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        if r[0] not in CLEAR_TABLES)))

    moves = [p for p in MOVE_PATHS if os.path.exists(p)]
    loose = [os.path.join(WORKSPACE_DIR, n) for n in sorted(os.listdir(WORKSPACE_DIR))
             if n != "automaton-main" and not n.endswith(".patch")]
    services = published_services()
    keep_services, stop_services, unpublished = [], [], []
    if services is None:
        print("== services: helper unavailable, published services left untouched")
    else:
        for name, (state, url) in sorted(services.items()):
            (keep_services if state == "active" and answers(url) else stop_services).append((name, url))
        if os.path.isdir(SERVICES_ROOT):
            unpublished = [n for n in sorted(os.listdir(SERVICES_ROOT)) if n not in services]
        print("== services kept (they answer):")
        for name, url in keep_services:
            print(f"  {name}  {url}")
        print("== services to stop and archive (no answer or error):")
        for name, url in stop_services:
            print(f"  {name}  {url}")
        print("== service folders never published (to archive):")
        for name in unpublished:
            print(f"  {os.path.join(SERVICES_ROOT, name)}")
    junk, other = untracked_repo_root_items()
    repo_moves = [os.path.join(REPO, n) for n in junk]
    print("== files to archive")
    for p in moves + loose + repo_moves:
        print("  " + p)
    if other:
        print("== untracked in the code repo, NOT moved (review by hand):")
        for n in other:
            print("  " + os.path.join(REPO, n))

    if not args.apply:
        print("\npreview only. Run again with --apply (SHUI stopped) to archive and reset.")
        return

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    archive = os.path.join(ARCHIVE_ROOT, f"cleanup-{stamp}")
    os.makedirs(archive, exist_ok=True)
    backup = sqlite3.connect(os.path.join(archive, "state.db.before-cleanup"))
    con.backup(backup)
    backup.close()
    print(f"\n== backup: {archive}/state.db.before-cleanup")

    with con:
        for table in CLEAR_TABLES:
            if table_exists(cur, table):
                cur.execute(f"DELETE FROM {table}")
        if table_exists(cur, "child_lifecycle_events") and table_exists(cur, "children"):
            cur.execute("DELETE FROM child_lifecycle_events WHERE child_id IN "
                        "(SELECT id FROM children WHERE status IN ('stopped','failed','dead','cleaned_up'))")
        if table_exists(cur, "children"):
            cur.execute("DELETE FROM children WHERE status IN ('stopped','failed','dead','cleaned_up')")
        for key in kv_keys:
            cur.execute("DELETE FROM kv WHERE key = ?", (key,))
    con.execute("VACUUM")
    con.close()
    print("== database reset done")

    for name, _url in stop_services:
        subprocess.run(["sudo", "-n", SERVICE_HELPER, "stop", name], capture_output=True, text=True, timeout=90)
        print(f"  stopped service {name}")
    service_moves = [os.path.join(SERVICES_ROOT, n) for n, _ in stop_services] + [os.path.join(SERVICES_ROOT, n) for n in unpublished]
    for path in moves + loose + repo_moves + [p for p in service_moves if os.path.exists(p)]:
        rel = path.lstrip("/").replace("/", "__")
        shutil.move(path, os.path.join(archive, rel))
        print(f"  archived {path}")
    os.makedirs(f"{HOME}/.automaton/workspace", exist_ok=True)
    print(f"\ndone. Everything removed is in {archive}")


if __name__ == "__main__":
    main()
