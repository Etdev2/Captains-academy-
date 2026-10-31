"""Build the AI studio plan: three HTML reports, a CSV, then PDFs via headless Chrome.

All prices live in PRICES and HARDWARE so the reviewer can change one number and rebuild.
Run: python3 -I docs/prototypes/infrastructure/src/build.py
"""
import csv
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "reports")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
AS_OF = "October 31, 2026"
PEOPLE = 6

# Source: claude.com/pricing, read 2026-10-31. "verified" means read from the vendor page that day.
PRICES = {
    "max20": {"name": "Claude Ultra, personal (formerly Max 20x)", "monthly": 200, "annual_per_month": None,
              "pro_units": 10, "api_credit": 200, "status": "verified"},
    "team_premium": {"name": "Claude Team premium seat", "monthly": 125, "annual_per_month": 100,
                     "pro_units": 5, "api_credit": 100, "status": "verified"},
    "team_standard": {"name": "Claude Team standard seat", "monthly": 25, "annual_per_month": 20,
                      "pro_units": 1, "api_credit": 0, "status": "verified"},
    # OpenAI's pricing pages block automated reads. These come from CloudZero (updated 2026-10-21) and
    # Endless (2026-10-19) pricing guides, so they are tagged "check" until confirmed on chatgpt.com/pricing.
    "gpt_pro": {"name": "ChatGPT Pro 200, personal", "monthly": 200, "annual_per_month": None,
                "pro_units": 20, "api_credit": 0, "status": "check"},
    "gpt_business": {"name": "ChatGPT Business premium seat", "monthly": 125, "annual_per_month": 100,
                     "pro_units": 5, "api_credit": 0, "status": "check"},
}

# Linux hub options. "check" prices come from news reports and price trackers in September and October 2026,
# during a memory shortage, so they move week to week. "estimate" prices need a quote.
HARDWARE = {
    "recommended": {
        "label": "Recommended: Linux tower, Ryzen 9 9950X, 64 GB",
        "items": [
            ("AMD Ryzen 9 9950X, 16 cores", 549, "check"),
            ("64 GB DDR5 (two 32 GB sticks)", 880, "check"),
            ("AM5 motherboard with 2.5 Gb Ethernet", 230, "estimate"),
            ("2 TB NVMe SSD", 200, "estimate"),
            ("Case, 850 W power supply and air cooler", 250, "estimate"),
            ("UPS, 1500 VA line-interactive", 250, "estimate"),
            ("Backup drive, 8 TB", 180, "estimate"),
            ("Gigabit switch and Ethernet cables", 60, "estimate"),
        ],
    },
    "middle": {
        "label": "Larger: Framework Desktop, Ryzen AI Max+ 395, 128 GB",
        "items": [
            ("Framework Desktop DIY edition, 128 GB", 3449, "check"),
            ("2 TB NVMe SSD", 200, "estimate"),
            ("UPS, 1500 VA line-interactive", 250, "estimate"),
            ("Backup drive, 8 TB", 180, "estimate"),
            ("Gigabit switch and Ethernet cables", 60, "estimate"),
        ],
    },
    "minimum": {
        "label": "Minimum: Framework Desktop, 32 GB",
        "items": [
            ("Framework Desktop DIY edition, 32 GB", 1139, "check"),
            ("1 TB NVMe SSD", 120, "estimate"),
            ("UPS, 1500 VA line-interactive", 250, "estimate"),
            ("Backup drive, 8 TB", 180, "estimate"),
            ("Gigabit switch and Ethernet cables", 60, "estimate"),
        ],
    },
}
OFFSITE_BACKUP_YEAR = 99  # estimate, one-computer cloud backup plan
TEAM_CREDIT_CAP = 500  # per Team org per month, pooled (platform.claude.com api-credits-for-subscribers)
TAILSCALE_USER_MONTH = 8  # Standard plan; the free Personal plan is non-commercial
API_RESERVE_MONTH = 200  # cash reserve for unattended API use above credits

C_MAX = "#7c3aed"
C_TEAM = "#2563eb"
C_HUB = "#0f766e"
C_CLOUD = "#b45309"
C_GPT = "#15803d"
C_GPTP = "#be185d"
C_INK = "#111827"
C_MUTED = "#6b7280"
C_LINE = "#d1d5db"


def money(n):
    return f"${n:,.0f}"


def hw_total(key):
    return sum(p for _, p, _ in HARDWARE[key]["items"])


# ---------- the numbers ----------
m = PRICES["max20"]
t = PRICES["team_premium"]
gp = PRICES["gpt_pro"]
gb = PRICES["gpt_business"]
ACCOUNTS = PEOPLE * 4
# Individual = Claude Ultra + ChatGPT Pro, paid by each person. Team = Claude Team + ChatGPT Business, paid by the company.
IND_MONTH = PEOPLE * (m["monthly"] + gp["monthly"])
TEAM_MONTHLY = PEOPLE * (t["monthly"] + gb["monthly"])
TEAM_ANNUAL = PEOPLE * (t["annual_per_month"] + gb["annual_per_month"])
SCEN = [
    # (label, individual_per_month, team_per_month)
    ("A. Requested: 24 accounts, team seats billed monthly", IND_MONTH, TEAM_MONTHLY),
    ("A2. Same 24 accounts, team seats billed annually", IND_MONTH, TEAM_ANNUAL),
    ("B. 12 team seats only, billed annually", 0, TEAM_ANNUAL),
    ("C. 12 individual accounts only", IND_MONTH, 0),
]
# per-provider monthly figures with team seats billed annually
PROVIDER = [
    ("Claude", PEOPLE * m["monthly"], PEOPLE * t["annual_per_month"], PEOPLE * t["monthly"]),
    ("ChatGPT", PEOPLE * gp["monthly"], PEOPLE * gb["annual_per_month"], PEOPLE * gb["monthly"]),
]
A2_MONTH = SCEN[1][1] + SCEN[1][2]
A_MONTH = SCEN[0][1] + SCEN[0][2]
HW_REC = hw_total("recommended")
YEAR1_REC = A2_MONTH * 12 + HW_REC + OFFSITE_BACKUP_YEAR
PRO_UNITS_A = PEOPLE * m["pro_units"] + PEOPLE * t["pro_units"]
TEAM_CREDIT = min(PEOPLE * t["api_credit"], TEAM_CREDIT_CAP)
TAILSCALE_YEAR = PEOPLE * TAILSCALE_USER_MONTH * 12
ALL_IN_REC = YEAR1_REC + API_RESERVE_MONTH * 12 + TAILSCALE_YEAR


# ---------- shared page chrome ----------
CSS = f"""
@page {{ size: Letter; margin: 0.6in 0.6in 0.7in 0.6in; }}
* {{ box-sizing: border-box; }}
body {{ font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: {C_INK};
       font-size: 10.5pt; line-height: 1.45; margin: 0; }}
h1 {{ font-size: 22pt; margin: 0 0 4px; letter-spacing: -0.01em; }}
h2 {{ font-size: 14pt; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid {C_INK}; }}
h3 {{ font-size: 11.5pt; margin: 14px 0 6px; }}
p {{ margin: 6px 0; }}
.sub {{ color: {C_MUTED}; font-size: 10pt; margin-bottom: 14px; }}
.kpis {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }}
.kpi {{ border: 1px solid {C_LINE}; border-radius: 8px; padding: 8px 10px; }}
.kpi .v {{ font-size: 17pt; font-weight: 700; }}
.kpi .l {{ font-size: 8.5pt; color: {C_MUTED}; }}
table {{ width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt; }}
th, td {{ text-align: left; padding: 5px 6px; border-bottom: 1px solid {C_LINE}; vertical-align: top; }}
th {{ background: #f3f4f6; font-weight: 600; }}
td.n, th.n {{ text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }}
tr.total td {{ font-weight: 700; border-top: 2px solid {C_INK}; }}
.tag {{ display: inline-block; font-size: 7.5pt; padding: 1px 6px; border-radius: 9px; font-weight: 600; }}
.verified {{ background: #dcfce7; color: #166534; }}
.estimate {{ background: #fef3c7; color: #92400e; }}
.check {{ background: #e0e7ff; color: #3730a3; }}
.note {{ border-left: 3px solid {C_CLOUD}; background: #fffbeb; padding: 8px 10px; margin: 10px 0; font-size: 9.5pt; }}
.rule {{ border-left: 3px solid #b91c1c; background: #fef2f2; padding: 8px 10px; margin: 10px 0; font-size: 9.5pt; }}
.fig {{ margin: 10px 0 4px; break-inside: avoid; }}
.cap {{ font-size: 8.5pt; color: {C_MUTED}; margin-bottom: 10px; }}
ol, ul {{ margin: 6px 0 6px 18px; padding: 0; }}
li {{ margin: 3px 0; }}
.pb {{ break-before: page; }}
.keep {{ break-inside: avoid; }}
code {{ font-family: Menlo, monospace; font-size: 9pt; background: #f3f4f6; padding: 0 3px; border-radius: 3px; }}
pre {{ font-family: Menlo, monospace; font-size: 8.5pt; background: #f3f4f6; padding: 10px; border-radius: 6px;
      white-space: pre-wrap; }}
.foot {{ margin-top: 24px; font-size: 8pt; color: {C_MUTED}; border-top: 1px solid {C_LINE}; padding-top: 6px; }}
"""


def page(title, sub, body):
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>
<style>{CSS}</style></head><body>
<h1>{title}</h1><div class="sub">{sub}</div>
{body}
<div class="foot">Prepared {AS_OF} for Et. Prices tagged "verified" were read from the vendor's page on that date.
Prices tagged "check" come from recent pricing guides because the vendor page blocked automated reads.
Prices tagged "estimate" are placeholders that need a quote before purchase.</div>
</body></html>"""


def tag(status):
    return f'<span class="tag {status}">{status}</span>'


# ---------- SVG helpers ----------
def box(x, y, w, h, fill, stroke, rx=8, sw=1.5):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'


def text(x, y, s, size=10, weight=400, fill=C_INK, anchor="middle"):
    return (f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" '
            f'text-anchor="{anchor}" font-family="-apple-system, Helvetica, Arial">{s}</text>')


def arrow(x1, y1, x2, y2, color=C_MUTED, dash=False):
    d = ' stroke-dasharray="4 3"' if dash else ""
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.4"'
            f' marker-end="url(#ah)"{d}/>')


DEFS = (f'<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" '
        f'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{C_MUTED}"/></marker></defs>')


def architecture_svg():
    s = [f'<svg viewBox="0 0 720 600" width="100%" xmlns="http://www.w3.org/2000/svg">', DEFS]
    s.append(text(8, 14, "SIX PEOPLE, FOUR ACCOUNTS EACH: CLAUDE AND CHATGPT, TEAM AND INDIVIDUAL", 9, 700, C_MUTED, "start"))
    pills = [("Claude Team seat", "#dbeafe", C_TEAM), ("Claude Ultra", "#ede9fe", C_MAX),
             ("ChatGPT Business", "#dcfce7", C_GPT), ("ChatGPT Pro", "#fce7f3", C_GPTP)]
    for i in range(PEOPLE):
        x = 8 + i * 118
        s.append(box(x, 22, 108, 114, "#fff", C_INK))
        s.append(text(x + 54, 40, f"Person {i + 1}", 11, 700))
        for j, (label, fill, stroke) in enumerate(pills):
            s.append(box(x + 8, 48 + j * 22, 92, 18, fill, stroke, 9, 1))
            s.append(text(x + 54, 61 + j * 22, label, 8.5, 600, stroke))
    s.append('<g transform="translate(0,40)">')

    # hub
    s.append(box(8, 128, 482, 300, "#f0fdfa", C_HUB, 12, 2))
    for i in range(PEOPLE):
        x = 18 + i * 78
        s.append(box(x, 172, 70, 54, "#fff", C_HUB, 6, 1))
        s.append(text(x + 35, 189, f"Linux user {i + 1}", 8.5, 700))
        s.append(text(x + 35, 202, "T3 Code", 8.5))
        s.append(text(x + 35, 215, "4 logins", 8, 400, C_MUTED))
    s.append(text(249, 244, "each person's agents run only under that person's own logins", 8.5, 400, C_MUTED))
    services = [("Hill-climb", "scheduler"), ("Eval runner", "tests + benchmark"),
                ("Git worktrees", "one per variant"), ("Results ledger", "score history")]
    for i, (a, b) in enumerate(services):
        x = 18 + i * 117
        s.append(box(x, 270, 108, 50, C_HUB, C_HUB, 6, 1))
        s.append(text(x + 54, 291, a, 10, 700, "#fff"))
        s.append(text(x + 54, 306, b, 8.5, 400, "#ccfbf1"))
    infra = [("restic backup", "8 TB drive, hourly"), ("Offsite backup", "cloud copy"),
             ("UPS", "rides out outages"), ("Ethernet", "no Wi-Fi drops")]
    for i, (a, b) in enumerate(infra):
        x = 18 + i * 117
        s.append(box(x, 340, 108, 44, "#fff", C_LINE, 6, 1))
        s.append(text(x + 54, 358, a, 9.5, 700))
        s.append(text(x + 54, 372, b, 8.5, 400, C_MUTED))
    s.append(text(20, 404, "STUDIO HUB", 9, 700, C_HUB, "start"))
    s.append(text(90, 404, "Ubuntu Server 24.04. Phase 1: a VM on Et's MacBook. Phase 2: Linux tower.", 8.5, 400, C_MUTED, "start"))

    # cloud
    s.append(text(508, 146, "CLOUD SERVICES", 9, 700, C_CLOUD, "start"))
    cloud = [("Anthropic Team org", "6 premium seats, admin console", C_TEAM),
             ("Anthropic personal", "6 Ultra accounts ($200 tier)", C_MAX),
             ("OpenAI Business workspace", "6 premium seats, Codex", C_GPT),
             ("OpenAI personal", "6 ChatGPT Pro accounts ($200 tier)", C_GPTP),
             ("GitHub", "repos, pull requests, CI", C_INK),
             ("Vercel / Supabase", "deploy and data, per project", C_CLOUD)]
    for i, (a, b, c) in enumerate(cloud):
        y = 154 + i * 46
        s.append(box(508, y, 204, 40, "#fff", c, 6, 1.5))
        s.append(text(610, y + 16, a, 10, 700, c))
        s.append(text(610, y + 31, b, 8.5, 400, C_MUTED))
        s.append(arrow(490, 270 if i < 4 else 300, 506, y + 20, C_LINE))

    # remote
    s.append(box(8, 450, 704, 56, "#fff", C_INK, 10, 1.5))
    s.append(text(360, 472, "Remote access: T3 Connect from each person's phone or laptop", 11, 700))
    s.append(text(360, 490, "Each person reaches only their own Linux user's T3 service. Tailscale is the fallback if T3 Connect is down.", 9, 400, C_MUTED))
    s.append(arrow(249, 450, 249, 430))
    s.append(text(8, 530, "Blue and green: company seats, company work. Purple and pink: personal accounts, extra capacity", 9, 400, C_MUTED, "start"))
    s.append(text(8, 546, "only when their owner starts the round. Dark teal: shared hub services with no account of their own.", 9, 400, C_MUTED, "start"))
    s.append("</g>")
    for i in range(PEOPLE):
        s.append(arrow(8 + i * 118 + 54, 136, 53 + i * 78, 211))
    s.append("</svg>")
    return "".join(s)


def hillclimb_svg():
    import math
    s = [f'<svg viewBox="0 0 720 420" width="100%" xmlns="http://www.w3.org/2000/svg">', DEFS]
    cx, cy, r = 260, 210, 150
    steps = [
        ("1. Set the target", "one metric, one held-out set", C_INK),
        ("2. Generate variants", "K ideas, one worktree each", C_TEAM),
        ("3. Evaluate on hub", "same tests, fixed seed", C_HUB),
        ("4. Keep or discard", "beat best by margin, no regressions", C_INK),
        ("5. Cross-review", "the other company's model checks", C_GPT),
        ("6. Log and merge", "ledger row, pull request", C_HUB),
    ]
    pts = []
    for i in range(6):
        a = -math.pi / 2 + i * 2 * math.pi / 6
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    for i in range(6):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % 6]
        # shorten the line so it meets the box edge
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy)
        k = 52 / L
        s.append(arrow(x1 + dx * k, y1 + dy * k, x2 - dx * k, y2 - dy * k, C_MUTED))
    for (x, y), (a, b, c) in zip(pts, steps):
        s.append(box(x - 82, y - 24, 164, 48, "#fff", c, 8, 1.8))
        s.append(text(x, y - 4, a, 10.5, 700, c))
        s.append(text(x, y + 12, b, 8.5, 400, C_MUTED))
    s.append(f'<circle cx="{cx}" cy="{cy}" r="52" fill="#f0fdfa" stroke="{C_HUB}" stroke-width="2"/>')
    s.append(text(cx, cy - 6, "Best score", 11, 700, C_HUB))
    s.append(text(cx, cy + 10, "so far", 11, 700, C_HUB))
    # stop rules panel
    s.append(box(470, 40, 242, 340, "#fff", C_LINE, 10, 1))
    s.append(text(486, 64, "STOP RULES", 9, 700, C_MUTED, "start"))
    rules = ["Weekly budget for the loop", "is used up.", "",
             "N rounds in a row with no", "gain beyond the noise margin.", "",
             "The check-set score drops", "while the training score rises", "(overfitting).", "",
             "A test that used to pass fails.", "",
             "A human says stop."]
    for i, line in enumerate(rules):
        s.append(text(486, 86 + i * 15, line, 9.5, 400, C_INK, "start"))
    s.append(text(486, 300, "One loop = one round of K variants.", 9, 400, C_MUTED, "start"))
    s.append(text(486, 316, "K = free company seats, capped by hub load.", 9, 400, C_MUTED, "start"))
    s.append(text(486, 332, "Personal accounts add K only when", 9, 400, C_MUTED, "start"))
    s.append(text(486, 348, "their owner starts the round.", 9, 400, C_MUTED, "start"))
    s.append("</svg>")
    return "".join(s)


def bars_svg(rows, width=720, unit="/mo"):
    """rows: (label, [(value, color, name), ...])"""
    mx = max(sum(v for v, _, _ in segs) for _, segs in rows)
    left, right = 300, 70
    plot = width - left - right
    h = 34 * len(rows) + 40
    s = [f'<svg viewBox="0 0 {width} {h}" width="100%" xmlns="http://www.w3.org/2000/svg">']
    for i, (label, segs) in enumerate(rows):
        y = 10 + i * 34
        s.append(text(left - 8, y + 16, label, 9, 400, C_INK, "end"))
        x = left
        for v, c, _ in segs:
            w = plot * v / mx
            if w > 0:
                s.append(f'<rect x="{x:.1f}" y="{y + 3}" width="{w:.1f}" height="20" fill="{c}" rx="2"/>')
                if w > 46:
                    s.append(text(x + w / 2, y + 17, money(v), 8.5, 600, "#fff"))
            x += w
        s.append(text(x + 6, y + 17, money(sum(v for v, _, _ in segs)) + unit, 9.5, 700, C_INK, "start"))
    names = []
    for _, segs in rows:
        for _, c, n in segs:
            if (c, n) not in names:
                names.append((c, n))
    lx = left
    for c, n in names:
        s.append(f'<rect x="{lx}" y="{h - 22}" width="12" height="12" fill="{c}" rx="2"/>')
        s.append(text(lx + 18, h - 12, n, 9, 400, C_INK, "start"))
        lx += 30 + 6 * len(n)
    s.append("</svg>")
    return "".join(s)


# ---------- report 1: infrastructure design ----------
def account_rows():
    rows = []
    for i in range(PEOPLE):
        rows.append(f"<tr><td>Person {i + 1}</td><td>Claude Team premium seat<br>ChatGPT Business premium seat</td>"
                    f"<td>Company repositories, hill-climb rounds, anything the company owns</td><td>Company admin (Et)</td></tr>")
        rows.append(f"<tr><td>Person {i + 1}</td><td>Claude Ultra<br>ChatGPT Pro</td><td>Their own projects. Extra hill-climb "
                    f"capacity only when they start the round themselves</td><td>Person {i + 1}</td></tr>")
    return "".join(rows)


def report_infra():
    body = f"""
<div class="kpis">
 <div class="kpi"><div class="v">{ACCOUNTS}</div><div class="l">accounts: 6 people x (Claude + ChatGPT) x (team + individual)</div></div>
 <div class="kpi"><div class="v">{money(IND_MONTH)}</div><div class="l">individual accounts per month, paid by each person</div></div>
 <div class="kpi"><div class="v">{money(TEAM_ANNUAL)}</div><div class="l">team seats per month, billed annually, paid by the company</div></div>
 <div class="kpi"><div class="v">{money(A2_MONTH)}</div><div class="l">combined per month</div></div>
</div>

<h2>What this setup is for</h2>
<p>Six people share one hub that runs hill-climbing loops. A hill-climbing loop tries several changes to a piece of
software, scores each one with the same tests, keeps the best one only if it beats the current best, and repeats.
The hub holds the code, runs the scoring, and records every score. Claude and GPT accounts write the changes.</p>
<p>Every person has four accounts. The Claude Team seat and the ChatGPT Business seat belong to the company and do
company work. The Claude Ultra and ChatGPT Pro accounts belong to the person. They add capacity when their owner
chooses to start a round.</p>

<h2>Infrastructure map</h2>
<div class="fig">{architecture_svg()}</div>
<div class="cap">Figure 1. Accounts on top, the hub in the middle, cloud services on the right, remote access at the bottom.</div>

<div class="rule"><b>Account rule.</b> No account is shared, pooled or routed through a proxy. Each agent runs under the
logged-in person's own account, inside that person's own Linux user. CLIProxyAPI and similar token-pooling proxies are
left out because Anthropic's and OpenAI's terms restrict sharing and routing account credentials. As a company
policy, jobs the scheduler starts on its own use company API keys and the Claude Team credit pool. Whether a subscription login may drive
those jobs is still an open question for Anthropic, so the plan does not depend on it.</div>

<h2 class="pb">The hill-climbing loop</h2>
<div class="fig">{hillclimb_svg()}</div>
<div class="cap">Figure 2. One round of the loop. The center holds the best score so far.</div>
<h3>How a round works</h3>
<ol>
<li>Someone writes the target in a one-page brief. It names the metric, the smallest gain worth keeping, and three
data sets. The tuning set guides the loop. The check set confirms each winner. The audit set is used once, at the end,
and never guides the search. The noise margin is how far a score moves between runs of the same code. Measure it from
enough baseline runs to see the spread, more than three.</li>
<li>The scheduler opens one git worktree per variant. Each free company seat, Claude or ChatGPT, takes one variant
and writes one idea. Mixing the two models gives the round more varied ideas.</li>
<li>The eval runner scores each variant in a throwaway sandbox with no secrets and no network. The tests and benchmark
files live outside the variant's worktree and are checked by hash before each run, so a variant cannot edit them.
The runner checks that every expected test actually ran, not only that the exit code was zero.</li>
<li>The winner and the current best are re-run side by side, in random order, across several seeds. The winner is kept
only if its gain beats the margin in that paired comparison and it breaks no existing test. For pass or fail tests,
exact gates replace the margin.</li>
<li>A model from the other company reviews the winning diff: GPT reviews a Claude winner, and Claude reviews a GPT
winner. It looks for a change that games the metric, for example a test that was deleted or a special case for the
benchmark input.</li>
<li>Only the scheduler writes the ledger, one row per variant. Each row records the run, base and variant commits,
evaluator hash, seed, score, failures and usage. Winners merge one at a time. Each one is rebased onto the current main
branch and scored again before the pull request opens. A person merges it after reading the change, not only the
score.</li>
</ol>

<h3>Who does what</h3>
<table>
<tr><th>Account</th><th>Type</th><th>Used for</th><th>Who controls it</th></tr>
{account_rows()}
</table>

<h2 class="pb">Hardware and software</h2>
<h3>Why Linux</h3>
<p>T3 Code runs on Linux as a systemd user service. With lingering turned on (<code>sudo loginctl enable-linger</code>),
each person's service starts at boot and keeps running after they log out. On macOS the service stops at logout, so
six people would need six logged-in desktop sessions. Linux also needs no screen, keyboard or desktop. Claude Code,
Codex and git all run on Linux.</p>
<h3>Phase 1, now: an Ubuntu VM on Et's MacBook Pro</h3>
<ul>
<li>Run Ubuntu Server 24.04 in a VM (UTM is free). Every setup step then carries over to the tower unchanged.</li>
<li>Turn off sleep on AC power: <code>sudo pmset -c sleep 0</code>. This needs Et's password.</li>
<li>Free at least 80 GB for the VM, worktrees and test runs. The Mac had 7.8 GB free at the last audit.</li>
<li>Add a backup drive. There was no backup destination at the last audit.</li>
<li>Phase 1 runs one or two people at a time, and it is where the six-user test runs before any hardware is bought.</li>
</ul>
<h3>Phase 2: the Linux tower</h3>
<table>
<tr><th>Item</th><th>Why it is needed</th><th class="n">Price</th><th>Status</th></tr>
{''.join(f'<tr><td>{n}</td><td>{w}</td><td class="n">{money(p)}</td><td>{tag(st)}</td></tr>' for (n, p, st), w in zip(HARDWARE['recommended']['items'], ['Sixteen cores for six worktrees building and testing at once', 'Six users, their agents and test runs in memory', 'Wired Ethernet, no Wi-Fi drops', 'Room for six users, worktrees and caches', 'Quiet enough to sit in an office', 'Keeps rounds alive through short outages', 'Local hourly backups with restic', 'Stable link for remote sessions']))}
<tr class="total"><td>Total hardware</td><td></td><td class="n">{money(HW_REC)}</td><td></td></tr>
</table>
<p>Memory prices were inflated in late 2026, so the CPU and memory lines are tagged "check". The Framework Desktop
with 128 GB ({money(hw_total('middle'))} with extras) only makes sense if the team wants to run local models. The 32 GB
Framework ({money(hw_total('minimum'))}) fits two or three people at a time. The Financials report compares all three.</p>
<ul>
<li>Encrypt the disk with LUKS and enroll the TPM chip (<code>systemd-cryptenroll --tpm2-device=auto</code>), so the
tower restarts after a power cut without someone typing a password. The trade-off is that a stolen tower unlocks itself,
so keep it in a locked room.</li>
<li>Set the BIOS to power on after power loss.</li>
<li>Turn on unattended security upgrades, and reboot on a schedule when no round is running.</li>
</ul>
<h3>Software</h3>
<table>
<tr><th>Software</th><th>Role</th><th>Cost</th></tr>
<tr><td>Ubuntu Server 24.04 LTS</td><td>Hub operating system, one Linux user per person</td><td>Free</td></tr>
<tr><td>T3 Code</td><td>Agent workspace for each person, run as that user's systemd service on its own port. Holds a Claude entry and a Codex entry per account, each with its own config folder and login.</td><td>Free, MIT license. T3 Connect is free for now, three machines per account</td></tr>
<tr><td>Claude Code CLI</td><td>Runs the Claude agents inside T3</td><td>Included in both account types</td></tr>
<tr><td>Codex CLI</td><td>Runs the GPT agents and the GPT reviewer</td><td>Included in ChatGPT Business and Pro</td></tr>
<tr><td>Git and GitHub</td><td>Worktrees per variant, pull requests for winners</td><td>Existing plan</td></tr>
<tr><td>Eval runner</td><td>A script that runs tests and the benchmark, then prints one score</td><td>Built in-house, one per project</td></tr>
<tr><td>restic</td><td>Hourly backups to the local drive, nightly copy offsite</td><td>Free. Offsite storage in the budget</td></tr>
<tr><td>Results ledger</td><td>A tab-separated file in the repository, one row per variant</td><td>Free</td></tr>
<tr><td>Tailscale</td><td>Fallback remote access</td><td>Standard plan, {money(TAILSCALE_USER_MONTH)} per user per month. The free plan is non-commercial</td></tr>
</table>

<h2>Rollout</h2>
<table>
<tr><th>Step</th><th>Change</th><th>Pass test</th><th>Rollback</th></tr>
<tr><td>1</td><td>MacBook power, disk and backup fixes. Ubuntu Server VM installed</td><td>Mac stays awake 24 hours on AC. One backup completes. The VM survives a Mac restart</td><td><code>sudo pmset -c sleep 1</code>, delete the VM</td></tr>
<tr><td>2</td><td>Create the Claude Team org and the ChatGPT Business workspace, two monthly premium seats each</td><td>Both people sign in, and Claude Code and Codex each report the company account</td><td>Remove seats before the first bill</td></tr>
<tr><td>3</td><td>One project's eval runner and ledger</td><td>Enough baseline runs to measure the noise margin. Every expected test runs</td><td>Delete the branch</td></tr>
<tr><td>4</td><td>First hill-climb round with two seats</td><td>Ledger has rows. The winner opens a pull request. GPT review is attached</td><td>Close the pull request</td></tr>
<tr><td>5</td><td>In the Ubuntu VM, create six Linux users with lingering, each running T3 on its own port</td><td>All six reach only their own service from a phone on cellular. Services survive logout, reboot and network loss</td><td>Delete the test users</td></tr>
<tr><td>6</td><td>Price the tower parts that week and buy them. Copy the VM's setup to the tower</td><td>Step 5 passed. One task's real CPU and memory use fits six at once</td><td>Return window</td></tr>
<tr><td>7</td><td>Twelve team seats on annual billing, full rounds</td><td>A week of rounds with no account limit hit before the budget stop</td><td>Drop K back to two</td></tr>
</table>
"""
    return page("AI studio infrastructure design", "Six people, 24 Claude and ChatGPT accounts, one hub for hill-climbing loops", body)


# ---------- report 2: financials ----------
def report_fin():
    cu, gpu = PEOPLE * m["monthly"], PEOPLE * gp["monthly"]
    ct_m, gb_m = PEOPLE * t["monthly"], PEOPLE * gb["monthly"]
    ct_a, gb_a = PEOPLE * t["annual_per_month"], PEOPLE * gb["annual_per_month"]
    seg = lambda u, g, ct, gt: [(u, C_MAX, "Claude Ultra"), (g, C_GPTP, "ChatGPT Pro"),
                                (ct, C_TEAM, "Claude Team"), (gt, C_GPT, "ChatGPT Business")]
    scen_rows = [("A. 24 accounts, team seats monthly", seg(cu, gpu, ct_m, gb_m)),
                 ("A2. 24 accounts, team seats annual", seg(cu, gpu, ct_a, gb_a)),
                 ("B. 12 team seats only, annual", seg(0, 0, ct_a, gb_a)),
                 ("C. 12 individual accounts only", seg(cu, gpu, 0, 0))]
    hw_rows = []
    for key in ("recommended", "middle", "minimum"):
        hw_rows.append((HARDWARE[key]["label"].split(": ")[1],
                        [(A2_MONTH * 12, C_TEAM, "Subscriptions, year 1 (A2)"),
                         (hw_total(key) + OFFSITE_BACKUP_YEAR, C_HUB, "Hardware and backup")]))

    def acct(p, usage, credit):
        ann = money(p["annual_per_month"]) if p["annual_per_month"] else "not offered"
        return (f'<tr><td>{p["name"]}</td><td class="n">{money(p["monthly"])}</td><td class="n">{ann}</td>'
                f'<td>{usage}</td><td>{credit}</td><td>{tag(p["status"])}</td></tr>')

    per_account = f"""
<table>
<tr><th>Account type</th><th class="n">Monthly billing</th><th class="n">Annual billing, per month</th>
<th>Usage, per the vendor</th><th>Included API credit</th><th>Status</th></tr>
{acct(m, "10x Claude Pro per week", money(m['api_credit']) + "/mo, owner's only")}
{acct(t, "5x a standard seat, at least 5x Pro", money(t['api_credit']) + "/seat, pooled, " + money(TEAM_CREDIT_CAP) + "/mo cap per org")}
{acct(gp, "Highest individual limits below Pro 500", "none listed")}
{acct(gb, "5x a Business standard seat", "none listed")}
</table>
<p>Usage ratios are each vendor's marketing figures and do not compare across companies. They do not predict how much
finished work a seat produces, so measure completed tasks per seat during the pilot before buying more.</p>
<p>Claude API credits are claimed, not automatic. New subscribers wait seven days, credits expire each billing cycle,
and they do not pay for interactive Claude Code use. Six Claude Team seats give one company pool of
{money(TEAM_CREDIT)} a month. Each Ultra credit belongs to its owner and cannot be moved to the company.</p>
<div class="note">OpenAI's pricing pages block automated reads, so the two ChatGPT prices come from CloudZero's guide
(updated 21 October 2026) and Endless's guide (19 October 2026). They are tagged "check". Confirm them on
chatgpt.com/pricing before buying. One guide says new Pro 200 subscriptions get a lower allowance than before.</div>"""

    prov = "".join(f'<tr><td>{n}</td><td class="n">{money(i)}</td><td class="n">{money(ta)}</td><td class="n">{money(i + ta)}</td>'
                   f'<td class="n">{money((i + ta) * 12)}</td></tr>' for n, i, ta, _ in PROVIDER)
    team_tbl = f"""
<table>
<tr><th></th><th class="n">Individual (6 Ultra + 6 Pro)</th><th class="n">Team (6 Claude + 6 Business)</th><th class="n">Combined</th></tr>
<tr><td>Per month, team seats billed monthly</td><td class="n">{money(SCEN[0][1])}</td><td class="n">{money(SCEN[0][2])}</td><td class="n">{money(A_MONTH)}</td></tr>
<tr><td>Per month, team seats billed annually</td><td class="n">{money(SCEN[1][1])}</td><td class="n">{money(SCEN[1][2])}</td><td class="n">{money(A2_MONTH)}</td></tr>
<tr><td>Per year, team seats billed monthly</td><td class="n">{money(SCEN[0][1] * 12)}</td><td class="n">{money(SCEN[0][2] * 12)}</td><td class="n">{money(A_MONTH * 12)}</td></tr>
<tr><td>Per year, team seats billed annually</td><td class="n">{money(SCEN[1][1] * 12)}</td><td class="n">{money(SCEN[1][2] * 12)}</td><td class="n">{money(A2_MONTH * 12)}</td></tr>
<tr><td>Per person per month (annual team billing)</td><td class="n">{money(SCEN[1][1] / PEOPLE)}</td><td class="n">{money(SCEN[1][2] / PEOPLE)}</td><td class="n">{money(A2_MONTH / PEOPLE)}</td></tr>
<tr><td>Who pays</td><td>Each person</td><td>The company</td><td></td></tr>
</table>
<h3>By provider, per month, team seats billed annually</h3>
<table>
<tr><th>Provider</th><th class="n">6 individual</th><th class="n">6 team seats</th><th class="n">Per month</th><th class="n">Per year</th></tr>
{prov}
<tr class="total"><td>Both</td><td class="n">{money(SCEN[1][1])}</td><td class="n">{money(SCEN[1][2])}</td><td class="n">{money(A2_MONTH)}</td><td class="n">{money(A2_MONTH * 12)}</td></tr>
</table>
<p>Annual billing on all twelve team seats saves {money((SCEN[0][2] - SCEN[1][2]) * 12)} a year. It commits the company
for twelve months, so start with two monthly seats on each side (both plans need at least two) and switch to annual
after the pilot passes.</p>"""

    hw_tbl = ""
    for key in ("recommended", "middle", "minimum"):
        hw = HARDWARE[key]
        rows = "".join(f'<tr><td>{n}</td><td class="n">{money(p)}</td><td>{tag(st)}</td></tr>' for n, p, st in hw["items"])
        hw_tbl += f"""<h3>{hw['label']}</h3><table class="keep"><tr><th>Item</th><th class="n">Price</th><th>Status</th></tr>{rows}
<tr class="total"><td>One-time total</td><td class="n">{money(hw_total(key))}</td><td></td></tr></table>"""

    def line(label, v):
        return f'<tr><td>{label}</td><td class="n">{money(v)}</td><td class="n">{v / YEAR1_REC:.0%}</td></tr>'
    year1 = f"""
<table>
<tr><th>Year 1, recommended build, team seats billed annually</th><th class="n">Amount</th><th class="n">Share</th></tr>
{line("6 Claude Ultra (paid by each person)", cu * 12)}
{line("6 ChatGPT Pro (paid by each person) " + tag("check"), gpu * 12)}
{line("6 Claude Team premium seats (paid by the company)", ct_a * 12)}
{line("6 ChatGPT Business premium seats (paid by the company) " + tag("check"), gb_a * 12)}
{line("Studio hardware, one time", HW_REC)}
{line("Offsite backup " + tag("estimate"), OFFSITE_BACKUP_YEAR)}
<tr class="total"><td>Total year 1</td><td class="n">{money(YEAR1_REC)}</td><td class="n">100%</td></tr>
<tr><td>Personal share (Ultra and Pro)</td><td class="n">{money(SCEN[1][1] * 12)}</td><td></td></tr>
<tr><td>Company share (team seats, hardware, backup)</td><td class="n">{money(SCEN[1][2] * 12 + HW_REC + OFFSITE_BACKUP_YEAR)}</td><td></td></tr>
<tr><td>API reserve above credits, {money(API_RESERVE_MONTH)}/mo {tag('estimate')}</td><td class="n">{money(API_RESERVE_MONTH * 12)}</td><td></td></tr>
<tr><td>Tailscale Standard fallback, {PEOPLE} users at {money(TAILSCALE_USER_MONTH)}</td><td class="n">{money(TAILSCALE_YEAR)}</td><td></td></tr>
<tr class="total"><td>All-in year 1 cash plan</td><td class="n">{money(ALL_IN_REC)}</td><td></td></tr>
<tr><td>Year 2 onward, subscriptions and backup only</td><td class="n">{money(A2_MONTH * 12 + OFFSITE_BACKUP_YEAR)}</td><td></td></tr>
</table>"""

    body = f"""
<div class="kpis">
 <div class="kpi"><div class="v">{money(SCEN[1][1])}</div><div class="l">individual accounts per month (6 Ultra + 6 ChatGPT Pro)</div></div>
 <div class="kpi"><div class="v">{money(SCEN[1][2])}</div><div class="l">team seats per month (6 Claude + 6 Business, annual)</div></div>
 <div class="kpi"><div class="v">{money(A2_MONTH)}</div><div class="l">combined per month, {ACCOUNTS} accounts</div></div>
 <div class="kpi"><div class="v">{money(ALL_IN_REC)}</div><div class="l">all-in year 1 with the recommended hub, API reserve and Tailscale</div></div>
</div>
<h2>Individual and team totals</h2>
{team_tbl}
<h2 class="pb">Monthly cost by scenario</h2>
<div class="fig">{bars_svg(scen_rows)}</div>
<div class="cap">Figure 1. Scenario A is what was asked for. B and C show what each half costs alone.</div>
<h2>Price per account</h2>
{per_account}
<h2 class="pb">Year 1 cost by hub choice</h2>
<div class="fig">{bars_svg(hw_rows, unit="")}</div>
<div class="cap">Figure 2. Subscriptions are {A2_MONTH * 12 / YEAR1_REC:.0%} of year 1 with the recommended hub. The hub choice
moves the total by at most {money(hw_total('recommended') - hw_total('minimum'))}.</div>
{year1}
<h2 class="pb">Hardware detail</h2>
{hw_tbl}
<h2>What is not in these numbers</h2>
<ul>
<li>Tax, and actual API spend. The {money(API_RESERVE_MONTH)} monthly reserve is a cap to set, not a forecast.</li>
<li>OpenAI API usage for unattended GPT jobs. ChatGPT seats include no API credit in the guides checked.</li>
<li>Extended warranties and electricity. A tower that sits idle most of the day and works hard during rounds may
use 100 to 250 watts, a few dollars a week.</li>
<li>GitHub, Vercel and Supabase plans, which do not change with this setup.</li>
</ul>
<div class="note">Prices change. Before buying, rerun <code>src/build.py</code> after updating the numbers in
<code>PRICES</code> and <code>HARDWARE</code>. Every figure in these reports comes from those two tables.</div>
"""
    return page("AI studio financials", "24 accounts: Claude and ChatGPT, team and individual, plus hardware, year 1 and year 2", body)


# ---------- report 3: GPT handoff ----------
GPT_PROMPT = f"""You are reviewing an infrastructure plan written by Claude. Your job is to find what is wrong, missing or risky. Do not rewrite the plan.

Files in /Users/et/ai-studio-plan/:
- 01-infrastructure-design.pdf and .html
- 02-financials.pdf and .html, financials.csv
- src/build.py, the single source of every number

The plan: six people, each with a personal Claude Max 20x account and a Claude Team premium seat (twelve accounts). One studio hub (Et's MacBook Pro now, a Mac Studio M5 Max later) runs T3 Code for each person in a separate macOS user, plus a shared eval runner, git worktrees and a results ledger. The goal is hill-climbing loops: generate K code variants in parallel, score them with the same tests, keep the winner only if it beats the best by a noise margin, have GPT review the winner, merge, repeat.

Check these, using current primary sources (vendor pricing pages, terms of service, official docs). Cite the URL for every claim you make.
1. Prices: Max 20x $200/mo with $200/mo API credit; Team premium $125 monthly or $100 annual per seat; Team minimum seats. Apple base prices for Mac Studio M5 Max ($2,499), Mac mini M5 Pro ($1,699), Mac mini M6 ($899).
2. Terms: may personal Max accounts do company work? May subscription logins drive scheduled or unattended loops, or must those use API keys? May one person's included API credit pay for company work?
3. T3 Code: can one Mac run six macOS users with T3 Code reachable through T3 Connect at the same time? Does T3 support two Claude provider entries per user, one per account? What does T3 Connect cost?
4. Hill-climb design: is the keep rule sound? Is the noise margin method enough? What stops a variant from gaming the metric?
5. Arithmetic: recompute every total in the financials from build.py.
6. Anything that would make this setup fail in its first week.

Do not edit the plan files. Write your findings to /Users/et/ai-studio-plan/gpt-review.md with three sections: Errors (wrong facts or math, with the fix), Risks (ranked, with what to do), Confirmed (what you checked and found correct). Mark each finding as verified, with a source, or as a judgment call."""


def report_gpt():
    qs = [
        ("Prices", "Max 20x, Team premium and Apple base prices still match the vendor pages."),
        ("Terms", "Personal Max for company work, subscription logins for unattended loops, and use of included API credit."),
        ("T3 Code", "Six macOS users at once, two Claude provider entries per user, T3 Connect cost and limits."),
        ("Loop design", "The keep rule, the noise margin, and protection against gaming the metric."),
        ("Arithmetic", "Every total in the financials, recomputed from build.py."),
        ("First week", "Anything likely to break in the first week of use."),
    ]
    rows = "".join(f"<tr><td>{i + 1}</td><td>{a}</td><td>{b}</td></tr>" for i, (a, b) in enumerate(qs))
    body = f"""
<h2>Why a second model reviews this</h2>
<p>Claude wrote the design and the numbers. A model from another company is less likely to repeat the same mistakes.
GPT checks the facts against current sources and recomputes the math. It writes its findings to a file and leaves the
plan untouched. Et decides what to change.</p>
<h2>What GPT checks</h2>
<table><tr><th>#</th><th>Area</th><th>Question</th></tr>{rows}</table>
<h2>Open questions Claude could not settle</h2>
<ol>
<li>Whether T3 Code can serve six macOS users on one Mac at the same time through T3 Connect.</li>
<li>Whether Anthropic's terms allow subscription logins to run scheduled loops with nobody watching.</li>
<li>Whether the API credit included with Max 20x may pay for company work.</li>
<li>How much more usage a Team standard seat gets than Pro. This sets the exact premium-seat capacity.</li>
<li>The configured price of a Mac Studio M5 Max with 64 GB and 2 TB.</li>
</ol>
<h2>Pass criteria for the plan</h2>
<ul>
<li>No wrong price or total.</li>
<li>No account use that breaks a vendor's terms.</li>
<li>Every open question answered with a source, or listed as needing a vendor reply.</li>
</ul>
<h2>What changed after round 1</h2>
<p>GPT-6.1-Sol reviewed the plan on {AS_OF}. Its full findings are in <code>04-gpt-review.pdf</code>. It confirmed every
total. These changes went into reports 1 and 2.</p>
<table>
<tr><th>Finding</th><th>Change</th></tr>
<tr><td>The $200 personal tier is now called Ultra</td><td>Renamed everywhere. Price unchanged</td></tr>
<tr><td>Team premium seats include $100 of API credit each, pooled, capped at $500 per org</td><td>Added the {money(TEAM_CREDIT)} company pool and the claim rules</td></tr>
<tr><td>Tailscale's free plan is non-commercial</td><td>Budgeted Standard at {money(TAILSCALE_YEAR)} a year</td></tr>
<tr><td>"Unattended means API only" is a policy, not a vendor rule</td><td>Reworded as company policy. Left as an open question for Anthropic</td></tr>
<tr><td>Usage ratios are marketing figures</td><td>Labeled as nominal. The pilot measures finished tasks per seat</td></tr>
<tr><td>Six T3 users on one Mac is unproven</td><td>New rollout step tests it on the MacBook before buying</td></tr>
<tr><td>Variants could game the scorer</td><td>Sandboxed scoring, locked test files, and a check that every test ran</td></tr>
<tr><td>Three baseline runs are too few, and the held-out set gets reused</td><td>Paired re-runs across seeds. Tuning, check and audit sets kept separate</td></tr>
<tr><td>No safe merge order</td><td>Single-writer ledger. Winners rebase, re-score and merge one at a time</td></tr>
<tr><td>Headline budget left out the API reserve and Tailscale</td><td>All-in year 1 is now {money(ALL_IN_REC)}</td></tr>
<tr><td>The Team minimum is two seats, not five</td><td>The pilot starts with two monthly seats</td></tr>
</table>
<h3>Added after round 1</h3>
<p>Et widened the plan from 12 Claude accounts to {ACCOUNTS} accounts: each person also gets ChatGPT Pro and a ChatGPT
Business premium seat. GPT has not reviewed this change. The ChatGPT prices come from pricing guides and need
confirming on chatgpt.com/pricing.</p>
<p>Et also moved the hub from a Mac Studio to a Linux tower running Ubuntu Server. T3 Code's Linux service keeps
each person's session running after logout, which removes the risk GPT ranked R2. GPT has not reviewed this change either.</p>
<h3>Still open after round 1</h3>
<ul>
<li>The ChatGPT Pro and Business premium prices. Confirm them on OpenAI's site.</li>
<li>Whether OpenAI's terms allow personal ChatGPT Pro accounts on company code and subscription logins in scheduled loops.</li>
<li>May a personal Ultra account do this company's work under the US consumer terms? Ask Anthropic in writing.</li>
<li>May subscription logins drive scheduled loops through T3? Ask Anthropic in writing.</li>
<li>Current prices for the Linux tower's CPU and memory. Check them the week you buy.</li>
</ul>
<h2 class="pb">The prompt sent to GPT</h2>
<pre>{GPT_PROMPT}</pre>
"""
    return page("GPT review handoff", "What the second model checks, and the exact prompt it receives", body)


def write_csv():
    path = os.path.join(OUT, "financials.csv")
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["section", "item", "quantity", "unit_price", "billing", "monthly_total", "annual_total", "paid_by", "status"])
        w.writerow(["subscriptions", m["name"], PEOPLE, m["monthly"], "monthly", PEOPLE * m["monthly"], PEOPLE * m["monthly"] * 12, "each person", m["status"]])
        w.writerow(["subscriptions", t["name"], PEOPLE, t["monthly"], "monthly", PEOPLE * t["monthly"], PEOPLE * t["monthly"] * 12, "company", t["status"]])
        w.writerow(["subscriptions", t["name"], PEOPLE, t["annual_per_month"], "annual", PEOPLE * t["annual_per_month"], PEOPLE * t["annual_per_month"] * 12, "company", t["status"]])
        w.writerow(["subscriptions", gp["name"], PEOPLE, gp["monthly"], "monthly", PEOPLE * gp["monthly"], PEOPLE * gp["monthly"] * 12, "each person", gp["status"]])
        w.writerow(["subscriptions", gb["name"], PEOPLE, gb["monthly"], "monthly", PEOPLE * gb["monthly"], PEOPLE * gb["monthly"] * 12, "company", gb["status"]])
        w.writerow(["subscriptions", gb["name"], PEOPLE, gb["annual_per_month"], "annual", PEOPLE * gb["annual_per_month"], PEOPLE * gb["annual_per_month"] * 12, "company", gb["status"]])
        for key in HARDWARE:
            for n, p, st in HARDWARE[key]["items"]:
                w.writerow([f"hardware:{key}", n, 1, p, "one-time", "", p, "company", st])
        w.writerow(["backup", "Offsite cloud backup", 1, OFFSITE_BACKUP_YEAR, "annual", "", OFFSITE_BACKUP_YEAR, "company", "estimate"])
        w.writerow(["summary", "Individual accounts (Ultra + ChatGPT Pro)", "", "", "", IND_MONTH, IND_MONTH * 12, "each person", ""])
        w.writerow(["summary", "Team seats, annual (Claude Team + ChatGPT Business)", "", "", "", TEAM_ANNUAL, TEAM_ANNUAL * 12, "company", ""])
        w.writerow(["summary", "Combined subscriptions, team seats annual", "", "", "", A2_MONTH, A2_MONTH * 12, "", ""])
        w.writerow(["summary", "Year 1 total, recommended hub", "", "", "", "", YEAR1_REC, "", ""])
        w.writerow(["summary", "All-in year 1 (adds API reserve and Tailscale)", "", "", "", "", ALL_IN_REC, "", ""])


def main():
    docs = [("01-infrastructure-design", report_infra()), ("02-financials", report_fin()), ("03-gpt-review-handoff", report_gpt())]
    for name, html in docs:
        hp = os.path.join(OUT, name + ".html")
        with open(hp, "w") as f:
            f.write(html)
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        f"--print-to-pdf={os.path.join(OUT, name + '.pdf')}", "file://" + hp],
                       check=True, capture_output=True)
    review = os.path.join(OUT, "gpt-review.md")
    if os.path.exists(review):
        rh = os.path.join(OUT, "04-gpt-review.html")
        body = subprocess.run(["pandoc", review, "-t", "html"], check=True, capture_output=True, text=True).stdout
        with open(rh, "w") as f:
            f.write(page("GPT review, round 1", "Findings from GPT-6.1-Sol, written to gpt-review.md", body))
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        f"--print-to-pdf={os.path.join(OUT, '04-gpt-review.pdf')}", "file://" + rh],
                       check=True, capture_output=True)
    with open(os.path.join(OUT, "gpt-prompt.txt"), "w") as f:
        f.write(GPT_PROMPT + "\n")
    write_csv()
    print(f"A {A_MONTH} A2 {A2_MONTH} HW {HW_REC} Y1 {YEAR1_REC} ALL-IN {ALL_IN_REC} team credit {TEAM_CREDIT}")


if __name__ == "__main__":
    main()
