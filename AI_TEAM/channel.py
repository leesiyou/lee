#!/usr/bin/env python3
"""AI Team Protocol v1 — DSH<->Hermes channel adapter.

Channel LEVEL 1 : Hermes Kanban board `ai-team` (one card per message,
                  replies as comments authored engineering-os / qa-release).
Channel LEVEL 4 : AI_TEAM/messages/*  audit mirror + offline outbox.
Idempotency     : message_id == kanban --idempotency-key.
"""
import json, os, subprocess, sys, time, uuid
from datetime import datetime, timezone

HERMES = os.environ.get("HERMES_BIN", os.path.expanduser("~/.hermes/hermes-agent/venv/bin/hermes"))
BOARD = "ai-team"
REPO = "leesiyou/lee"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DSH_ID, HERMES_ID = "engineering-os", "qa-release"


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _git(*args):
    return subprocess.run(["git", "-C", ROOT, *args],
                          capture_output=True, text=True).stdout.strip()


def envelope(mtype, frm, to, task_id, payload, requires_ack=False, mid=None):
    head = _git("rev-parse", "HEAD")
    return {
        "protocol_version": 1,
        "message_id": mid or f"msg-{mtype.lower().replace('_','-')}-{uuid.uuid4().hex[:12]}",
        "timestamp": _now(),
        "from": frm, "to": to, "type": mtype,
        "task_id": task_id or None,
        "repo": REPO,
        "branch": _git("branch", "--show-current"),
        "base_head": head, "current_head": head,
        "payload": payload,
        "requires_ack": requires_ack,
    }


def mirror(side, direction, env, status):
    d = os.path.join(ROOT, "AI_TEAM", "messages", f"{side}-{direction}")
    os.makedirs(d, exist_ok=True)
    rec = dict(env); rec["mirror_status"] = status; rec["mirror_ts"] = _now()
    fn = f"{rec['mirror_ts'].replace(':','')}-{env['message_id']}.json"
    with open(os.path.join(d, fn), "w") as f:
        json.dump(rec, f, ensure_ascii=False, indent=2)
    return fn


def kanban(*args, capture=True):
    p = subprocess.run([HERMES, "kanban", "--board", BOARD, *args],
                       capture_output=capture, text=True)
    return p


def send(mtype, frm, to, task_id=None, payload=None, requires_ack=False, assignee=None):
    """Create one kanban card carrying the envelope JSON. Returns (task_id, message_id)."""
    env = envelope(mtype, frm, to, task_id, payload or {}, requires_ack)
    title = f"{mtype} {task_id + ' ' if task_id else ''}{env['message_id']}"
    args = ["create", title, "--body", json.dumps(env, ensure_ascii=False),
            "--idempotency-key", env["message_id"],
            "--created-by", frm, "--workspace", f"dir:{ROOT}", "--json"]
    if assignee:
        args += ["--assignee", assignee]
    p = kanban(*args)
    tid = ""
    try:
        d = json.loads(p.stdout)
        tid = d.get("id") or d.get("task", {}).get("id", "")
    except Exception:
        pass
    if not tid:  # fallback: find by idempotency key in list
        q = kanban("list", "--json")
        try:
            for t in json.loads(q.stdout).get("tasks", []):
                if env["message_id"] in t.get("title", ""):
                    tid = t["id"]
        except Exception:
            pass
    side = "dsh" if frm == DSH_ID else "hermes"
    mirror(side, "outbox", env, f"sent:{tid or 'unknown'}")
    return tid, env["message_id"], env


def reply(task_id, author, mtype, payload, task_ref=None, requires_ack=False):
    """Reply on an existing card as a comment carrying an envelope."""
    to = DSH_ID if author == HERMES_ID else HERMES_ID
    env = envelope(mtype, author, to, task_ref, payload, requires_ack)
    env["in_reply_to"] = task_id
    kanban("comment", task_id, json.dumps(env, ensure_ascii=False), "--author", author)
    side = "dsh" if author == DSH_ID else "hermes"
    mirror(side, "outbox", env, f"commented:{task_id}")
    return env["message_id"]


def show(task_id):
    p = kanban("show", task_id, "--json")
    try:
        return json.loads(p.stdout)
    except Exception:
        return {"raw": p.stdout, "stderr": p.stderr}


def board_list():
    p = kanban("list")
    return p.stdout


def find_comments(task_id, author=None, mtype=None):
    """Extract envelope-JSON comments from a card, filtered by author/type."""
    d = show(task_id)
    out = []
    for c in (d.get("comments") or []):
        body = c.get("body", "")
        try:
            env = json.loads(body)
        except Exception:
            continue
        if author and env.get("from") != author:
            continue
        if mtype and env.get("type") != mtype:
            continue
        out.append(env)
    return out


def cli():
    args = sys.argv[1:]
    if not args:
        print(__doc__); return
    cmd, rest = args[0], args[1:]
    if cmd == "send":        # send TYPE FROM TO TASK_ID PAYLOAD_JSON [ack] [assignee]
        tid, mid, _ = send(rest[0], rest[1], rest[2], rest[3] or None,
                           json.loads(rest[4]) if len(rest) > 4 else {},
                           len(rest) > 5 and rest[5] == "ack",
                           rest[6] if len(rest) > 6 else None)
        print(f"{tid} {mid}")
    elif cmd == "reply":     # reply TASK_ID AUTHOR TYPE TASK_REF PAYLOAD_JSON
        print(reply(rest[0], rest[1], rest[2], json.loads(rest[4]), rest[3] or None))
    elif cmd == "show":
        print(json.dumps(show(rest[0]), ensure_ascii=False, indent=2))
    elif cmd == "list":
        print(board_list())
    elif cmd == "comments":  # comments TASK_ID [author] [type]
        print(json.dumps(find_comments(rest[0],
              rest[1] if len(rest) > 1 else None,
              rest[2] if len(rest) > 2 else None), ensure_ascii=False, indent=2))
    else:
        print(__doc__)


if __name__ == "__main__":
    cli()
