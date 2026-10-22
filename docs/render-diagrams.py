#!/usr/bin/env python3
"""Rebuild the documentation SVGs using only Python's standard library.

The diagrams describe public source, private deployment boundaries and recovery
procedures, not production telemetry. Keep them free of private infrastructure and secrets. --check never
modifies files.
"""
import argparse
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COLORS = {
    "blue": ("#2563eb", "#eff6ff"),
    "purple": ("#7c3aed", "#f5f3ff"),
    "teal": ("#0f766e", "#ecfdf5"),
    "amber": ("#b45309", "#fffbeb"),
    "rose": ("#be123c", "#fff1f2"),
    "slate": ("#475569", "#f1f5f9"),
}


class Diagram:
    def __init__(self, title, subtitle, description, height):
        self.height = height
        self.parts = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="{height}" viewBox="0 0 1120 {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title>
<desc id="desc">{escape(description)}</desc>
<defs>
  <linearGradient id="header" x2="1" y2="1"><stop stop-color="#10223f"/><stop offset="1" stop-color="#283b68"/></linearGradient>
  <linearGradient id="accent"><stop stop-color="#38bdf8"/><stop offset="0.5" stop-color="#a78bfa"/><stop offset="1" stop-color="#34d399"/></linearGradient>
  <marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M1 1 L8 4.5 L1 8" fill="none" stroke="#64748b" stroke-width="1.5"/></marker>
</defs>
<style>text{{font-family:Arial,Helvetica,sans-serif;fill:#172b46}} .heading{{font-weight:700}} .muted{{fill:#475569}} .white{{fill:#ffffff}} .line{{fill:none;stroke:#64748b;stroke-width:2;marker-end:url(#arrow);stroke-linejoin:round}}</style>
<rect width="1120" height="{height}" rx="20" fill="#f4f7fc"/>
<path d="M20 0 H1100 Q1120 0 1120 20 V122 H0 V20 Q0 0 20 0" fill="url(#header)"/>
<rect y="118" width="1120" height="4" fill="url(#accent)"/>''']
        self.text(40, 29, "ALVIT  /  SPEED DIAL", 12, fill="#bfdbfe", weight=700)
        self.text(40, 69, title, 29, fill="#ffffff", weight=700)
        self.text(40, 99, subtitle, 16, fill="#dbeafe")

    def rect(self, x, y, w, h, fill, stroke="none", radius=14):
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>')

    def text(self, x, y, value, size=16, fill="#172b46", weight=400, anchor="start"):
        self.parts.append(f'<text x="{x}" y="{y}" font-size="{size}" style="fill:{fill}" font-weight="{weight}" text-anchor="{anchor}">{escape(str(value))}</text>')

    def card(self, x, y, w, h, title, lines=(), color="blue"):
        accent, tint = COLORS[color]
        self.rect(x, y, w, h, tint, "#d8e2ef")
        self.rect(x, y + 18, 4, h - 36, accent, radius=2)
        self.text(x + 20, y + 32, title, 19, weight=700)
        for i, line in enumerate(lines):
            self.text(x + 20, y + 60 + i * 22, line, 15, fill="#475569")

    def arrow(self, path, dashed=False):
        dash = ' stroke-dasharray="6 5"' if dashed else ""
        self.parts.append(f'<path d="{path}" class="line"{dash}/>')

    def footer(self, value):
        self.text(40, self.height - 20, value, 12, fill="#475569")

    def render(self):
        return "\n".join(self.parts) + "\n</svg>\n"


def architecture():
    d = Diagram("One board, external credentials", "Self-hosted design: private data and access files stay outside source and images.", "The browser reaches Node through a public ingress. The parent HTTP thread owns the serial queue and persistent writes. A Node worker thread initializes Playwright and captures through a restricted proxy, returning bytes or an error for parent version checks. Deployments supply their own private credentials and data.", 740)
    d.card(40, 160, 270, 135, "Browser", ["Five interface languages", "Access token + signed cookie", "Language in localStorage"], "blue")
    d.card(425, 160, 270, 135, "Public ingress", ["Operator-managed HTTPS", "Optional private tunnel", "Forward to the service"], "purple")
    d.card(810, 160, 270, 135, "Node HTTP thread", ["Pages + JSON API", "Serial queue + version checks", "Only persistence writer"], "blue")
    d.arrow("M310 227 H425"); d.arrow("M695 227 H810")
    d.card(40, 380, 270, 130, "Capture worker thread", ["Playwright initialization", "JPEG bytes or capture error", "No persistence writes"], "purple")
    d.card(425, 380, 270, 130, "Restricted proxy", ["Pinned public IPv4", "HTTP 80 / HTTPS 443", "Egress NetworkPolicy"], "amber")
    d.card(810, 380, 270, 150, "Persistent data", ["SQLite board + edit history", "Generated / uploaded images", "Migrated legacy images", "No built-in private seed"], "teal")
    d.arrow("M310 445 H425")
    d.arrow("M945 295 V380"); d.text(959, 374, "read / write", 13)
    d.arrow("M890 295 V335 H175 V380"); d.text(410, 324, "enqueue capture", 13)
    d.arrow("M260 380 V355 H1015 V295", dashed=True); d.text(525, 373, "JPEG / error to parent", 13)
    d.card(425, 585, 270, 90, "Public websites", ["No personal login cookies"], "slate")
    d.card(810, 585, 270, 104, "External credentials", ["Token + signing-key files", "Read-only; rotate on restart"], "amber")
    d.arrow("M560 510 V585")
    d.arrow("M1080 635 H1100 V228 H1080", dashed=True)
    d.footer("Logical topology only. Protected off-node data and credential backups remain an operator responsibility.")
    return d


def request_flow():
    d = Diagram("A token for each page visit", "A signed session authorizes assets and API; token, key or epoch rotation revokes it.", "A valid access token on the page query establishes an eight-hour cookie. Assets and API use the cookie. A bare page still returns 404. Credential or epoch rotation invalidates previous cookies after restart.", 700)
    for x, title, color in [(60, "Browser", "blue"), (460, "Application", "purple"), (860, "SQLite / files", "teal")]:
        d.card(x, 150, 200, 58, title, color=color)
        d.parts.append(f'<path d="M{x+100} 210 V638" stroke="#b7c6dc" stroke-width="2" stroke-dasharray="5 6"/>')
    for y, label in [(245, "1  Establish the session"), (360, "2  Read authorized data"), (530, "3  Recheck every page visit")]:
        d.text(40, y, label, 13, fill="#475569", weight=700)
    def message(x1, x2, y, label):
        d.arrow(f"M{x1} {y} H{x2}")
        d.text((x1 + x2) / 2, y - 10, label, 14, anchor="middle")
    message(160, 560, 283, "GET /?access=<token>")
    message(560, 160, 327, "200 + signed cookie (8 hours)")
    message(160, 560, 400, "GET assets / API + cookie")
    message(560, 960, 400, "Authorized read")
    message(960, 560, 446, "Current data / file")
    message(560, 160, 491, "200 + no-store response")
    message(160, 560, 571, "GET / without query + cookie")
    message(560, 160, 617, "404 — page token still required")
    d.footer("The token shown is a placeholder. Never publish a real entry URL; GET /healthz is intentionally public.")
    return d


def screenshot_flow():
    d = Diagram("From URL to a safe preview", "Capture off the HTTP thread; the parent validates and persists the result.", "Create, URL change or refresh queues a generation-tagged job in the parent. One Node worker thread initializes Playwright and captures through the restricted proxy without persistence writes. The parent saves only when the tile ID exists and its URL and generation still match.", 720)
    d.card(40, 165, 300, 130, "Queue in HTTP thread", ["Create / change / refresh", "New generation; mark pending", "One capture at a time"], "blue")
    d.card(410, 165, 300, 130, "Node worker thread", ["Import Playwright off-thread", "Restricted public-web proxy", "JPEG bytes or capture error"], "purple")
    d.card(780, 165, 300, 130, "Parent: read current tile", ["The user may have edited it", "An upload may have replaced it", "The tile may have been deleted"], "amber")
    d.arrow("M340 230 H410"); d.arrow("M710 230 H780")
    d.arrow("M930 295 V335 H560 V380")
    d.card(410, 380, 300, 112, "Parent: same tile version?", ["ID exists + URL matches", "Generation is unchanged"], "purple")
    d.card(40, 380, 300, 112, "Discard obsolete work", ["Keep the newer user change", "Do not replace its preview"], "rose")
    d.arrow("M410 436 H340"); d.text(375, 423, "No", 13, anchor="middle")
    d.card(410, 550, 300, 118, "Parent: persist result", ["Success: image + ready", "Failure: keep image + error", "Increment board revision"], "teal")
    d.arrow("M560 492 V550"); d.text(576, 525, "Yes", 13)
    d.card(780, 380, 300, 220, "Preview rules", ["A changed URL clears its", "previous image immediately.", "", "A failed manual refresh", "retains the existing image.", "A newer upload wins."], "amber")
    d.footer("Configured navigation and capture timeouts are limits, not measured performance or latency guarantees.")
    return d


def tile_swap():
    d = Diagram("Swap two tiles, keep the rest", "Example: move column 2 in row 1 onto column 2 in row 2.", "In a 4 by 5 grid, dragging tile 2 onto tile 7 swaps only those two positions. The other 18 tiles do not move. Numbers are synthetic identities for this illustration, not bookmark titles.", 640)
    d.text(244, 166, "BEFORE", 15, weight=700, anchor="middle")
    d.text(876, 166, "AFTER", 15, weight=700, anchor="middle")
    for start_x, swapped in [(40, False), (672, True)]:
        for slot in range(1, 21):
            identity = {2: 7, 7: 2}.get(slot, slot) if swapped else slot
            x, y = start_x + ((slot - 1) % 5) * 84, 190 + ((slot - 1) // 5) * 60
            color = "blue" if identity == 2 else "purple" if identity == 7 else "slate"
            accent, tint = COLORS[color]
            d.rect(x, y, 72, 48, accent if identity in (2, 7) else "#ffffff", "#d8e2ef", 9)
            d.text(x + 36, y + 31, identity, 19, fill="#ffffff" if identity in (2, 7) else "#475569", weight=700, anchor="middle")
    d.arrow("M478 305 H642"); d.text(560, 287, "Swap 2 ↔ 7", 17, anchor="middle", weight=700)
    d.text(560, 351, "Preview follows", 14, anchor="middle")
    d.text(560, 372, "the pointer", 14, anchor="middle")
    d.card(40, 475, 1040, 108, "2 positions change · 18 stay put", ["The grid stays fixed during dragging. Drop on a tile to exchange the two identities.", "Dropping outside a tile or pressing Escape cancels; the keyboard can also swap positions."], "teal")
    d.footer("Illustrative identities in the default 4 × 5 layout. Swapping does not insert a tile or shift its neighbours.")
    return d


def release_process():
    d = Diagram("From public source to private deployment", "Six checkpoints keep application code and operational data separate.", "Pin public source, test isolated fixtures, rehearse migration, review private deployment configuration, deploy in a maintenance window, and verify acceptance. This is an operational procedure, not live telemetry.", 710)
    steps = [
        ("Pin source", ["Public commit", "Verified image", "Generic base"], "blue"),
        ("Test", ["Synthetic fixtures", "Auth revocation", "Docs + image scan"], "purple"),
        ("Rehearse", ["Private snapshot", "Offline migration", "Compare state"], "teal"),
        ("Review", ["Private overlay", "Recovery ready", "Maintenance plan"], "amber"),
        ("Cut over", ["Stop old writer", "Migrate + restart", "Keep rollback"], "purple"),
        ("Accept", ["Auth + images", "Preserve board", "Record outcome"], "teal"),
    ]
    for i, (title, lines, color) in enumerate(steps):
        x = 40 + i * 176; accent, tint = COLORS[color]
        d.rect(x, 170, 160, 220, tint, "#d8e2ef")
        d.rect(x + 16, 186, 40, 34, accent, radius=8)
        d.text(x + 36, 210, f"{i+1:02d}", 17, fill="#ffffff", weight=700, anchor="middle")
        d.text(x + 16, 255, title, 20, weight=700)
        for row, line in enumerate(lines): d.text(x + 16, 288 + row * 25, line, 14)
        if i < 5: d.arrow(f"M{x+160} 270 H{x+176}")
    d.card(40, 450, 320, 166, "Isolated preparation", ["Keep production unchanged.", "Use separate data and credentials.", "Validate before replacing files.", "Keep secret values out of output."], "blue")
    d.card(400, 450, 320, 166, "Operational boundary", ["Review the exact deployment plan.", "Protect the old recovery set.", "Restart to load new credentials.", "Verify old sessions are rejected."], "amber")
    d.card(760, 450, 320, 166, "Source boundary", ["Public source has a clean history.", "Private records remain separate.", "Pin the public source revision.", "Do not duplicate application code."], "rose")
    d.footer("Ordered checkpoints, not elapsed time or completed production work. Each deployment needs its own acceptance record.")
    return d


def release_results():
    d = Diagram("Public source, private data", "One application codebase supplies browser builds and private server deployments.", "The public speeddial repository contains source, tests, docs and generic deployment files. Private operational archives retain recovery records and pin public source without duplicating application code. Browser data remains in each profile; server data and credentials remain in protected storage.", 750)
    d.card(40, 165, 320, 186, "speeddial · public source", ["Browser + server application", "Tests, five languages and docs", "Dockerfile + Kubernetes base", "Clean history; synthetic fixtures", "UNLICENSED source visibility"], "blue")
    d.card(400, 165, 320, 186, "Private operations archive", ["Pinned public commit or image", "Private deployment overlays", "Recovery and acceptance records", "Historical private Git material", "No duplicate application code"], "purple")
    d.card(760, 165, 320, 186, "Protected runtime storage", ["Browser: per-profile IndexedDB", "Server: SQLite + image volume", "External access credentials", "Local or protected backups", "No personal data in public code"], "teal")
    d.arrow("M360 255 H400"); d.arrow("M720 255 H760")
    d.card(40, 420, 500, 220, "Browser-local edition", ["Publish only the frontend build allowlist", "A new browser profile starts empty", "Upload or paste images; no remote capture", "Explicit full backup export and import", "App updates do not synchronize boards"], "teal")
    d.card(580, 420, 500, 220, "Self-hosted edition", ["Pin public source and verify the image", "Keep private configuration outside the build", "Use one writer per SQLite data volume", "Rehearse recovery before migration", "Verify the actual target after deployment"], "amber")
    d.footer("Architecture boundaries, not live deployment status. Private Git history and personal backups never enter public releases.")
    return d


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if generated SVGs differ")
    args = parser.parse_args()
    diagrams = {"architecture": architecture, "request-flow": request_flow, "screenshot-flow": screenshot_flow,
                "tile-swap": tile_swap, "release-process": release_process, "release-results": release_results}
    mismatches = []
    for name, render in diagrams.items():
        path = ROOT / "wiki/images" / f"{name}.svg"
        expected = render().render()
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != expected: mismatches.append(str(path.relative_to(ROOT)))
        else:
            path.write_text(expected, encoding="utf-8")
    if mismatches:
        raise SystemExit("Regenerate diagrams with python3 docs/render-diagrams.py: " + ", ".join(mismatches))
    print(f"Documentation diagrams: {len(diagrams)} {'verified' if args.check else 'rendered'}.")


if __name__ == "__main__":
    main()
