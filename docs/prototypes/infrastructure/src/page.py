"""Build the infrastructure prototype page: one HTML page with the whole plan.

Every number comes from build.py. Run from anywhere:
    python3 -I docs/prototypes/infrastructure/src/page.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build as b  # noqa: E402

OUT = os.path.join(os.path.dirname(HERE), "playable", "infrastructure-prototype.html")

MODEL = {
    "ultra": b.PRICES["max20"]["monthly"],
    "teamMonthly": b.PRICES["team_premium"]["monthly"],
    "teamAnnual": b.PRICES["team_premium"]["annual_per_month"],
    "teamCredit": b.PRICES["team_premium"]["api_credit"],
    "gptPro": b.PRICES["gpt_pro"]["monthly"],
    "bizMonthly": b.PRICES["gpt_business"]["monthly"],
    "bizAnnual": b.PRICES["gpt_business"]["annual_per_month"],
    "teamCreditCap": b.TEAM_CREDIT_CAP,
    "tailscale": b.TAILSCALE_USER_MONTH,
    "apiReserve": b.API_RESERVE_MONTH,
    "backupYear": b.OFFSITE_BACKUP_YEAR,
    "hubs": {k: {"label": v["label"].split(": ")[1], "total": b.hw_total(k)} for k, v in b.HARDWARE.items()},
}

DECISIONS = [
    ("d1", "How to start", ["Pilot first: 2 Claude Team and 2 ChatGPT Business seats, billed monthly", "All 24 accounts now"], 0,
     "Both team plans need at least two seats. A pilot proves the loop before the company commits to annual billing."),
    ("d2", "Linux hub computer", ["Decide after the six-user test", "Linux tower, Ryzen 9 9950X, 64 GB", "Framework Desktop, 128 GB", "Framework Desktop, 32 GB"], 0,
     "The hub runs Ubuntu Server. T3's Linux service keeps each person's session running after logout. Rollout step 5 tests six users in a VM on the MacBook first."),
    ("d3", "Jobs the scheduler starts on its own", ["Company API keys and the Claude Team credit pool", "Subscription logins"], 0,
     "Neither Anthropic nor OpenAI has confirmed that subscription logins may drive scheduled loops. The API key route does not depend on that answer."),
    ("d4", "Personal Ultra and ChatGPT Pro accounts on company code", ["Wait for written answers from both companies", "Allow now"], 0,
     "The review could not find the US consumer terms that settle this. Each Ultra credit also belongs to its owner and cannot move to the company."),
    ("d5", "Remote access fallback", ["Tailscale Standard, $48 a month", "T3 Connect only"], 0,
     "The free Tailscale plan is non-commercial. T3 Connect is free for now, up to three machines per account."),
    ("d6", "Team billing", ["Monthly in the pilot, annual after it passes", "Annual from day one"], 0,
     "Annual saves $3,600 a year on twelve team seats and locks in twelve months."),
]

WAITING = [
    ("Anthropic", "May a personal Ultra account do this company's work under the US consumer terms?"),
    ("Anthropic", "May subscription logins drive scheduled hill-climb loops through T3?"),
    ("OpenAI", "The same two questions for ChatGPT Pro and Business seats."),
    ("OpenAI", "Confirm ChatGPT Pro 200 at $200 and Business premium at $125 monthly or $100 annual."),
    ("Parts prices", "CPU and memory prices for the Linux tower, checked the week you buy. Memory prices are inflated."),
    ("Rollout step 5", "Six Linux users in an Ubuntu VM, each with T3 on its own port, reached from phones on cellular."),
]

ROLLOUT = [
    ("MacBook power, disk and backup fixes. Ubuntu Server VM installed", "Mac stays awake 24 hours on AC. One backup completes. The VM survives a restart"),
    ("Claude Team org and ChatGPT Business workspace, two monthly seats each", "Both people sign in, and Claude Code and Codex report the company accounts"),
    ("One project's eval runner and ledger", "Baseline runs agree within the measured margin"),
    ("First hill-climb round with two seats", "Ledger has rows. The winner opens a pull request with a GPT review"),
    ("Six Linux users in the VM with lingering, T3 on separate ports", "Each person reaches only their own service from a phone on cellular. Services survive logout and reboot"),
    ("Price and buy the Linux tower, copy the VM's setup to it", "Step 5 passed. One task's real CPU and memory use fits six at once"),
    ("Twelve team seats on annual billing, full rounds", "A week of rounds with no account limit hit before the budget stop"),
]

REVIEW = [
    ("The $200 personal plan is now called Ultra", "Renamed. Price unchanged"),
    ("Team seats include $100 API credit each, pooled, $500 cap per org", "Added the $500 company pool"),
    ("Tailscale's free plan is non-commercial", "Budgeted Standard at $576 a year"),
    ("\"Unattended means API only\" is a policy, not a vendor rule", "Reworded as company policy"),
    ("Usage ratios are marketing figures", "Labeled nominal. The pilot measures finished tasks"),
    ("Six T3 users on one Mac is unproven", "Hub moved to Linux, where T3 runs after logout. Tested in a VM before buying"),
    ("Variants could game the scorer", "Sandboxed scoring, locked tests, check that every test ran"),
    ("Three baseline runs are too few", "Paired re-runs across seeds"),
    ("The held-out set gets reused", "Separate tuning, check and audit sets"),
    ("No safe merge order", "Single-writer ledger, winners merge one at a time"),
    ("Budget left out API reserve and Tailscale", "Both added to the all-in total"),
    ("Added after the review: ChatGPT Pro and Business for all six", "24 accounts. Not yet reviewed by GPT"),
    ("Added after the review: the hub moved to Linux", "Ubuntu Server tower. Not yet reviewed by GPT"),
]

FILES = [
    ("../reports/01-infrastructure-design.pdf", "Infrastructure design", "Map, loop, accounts, hardware, rollout"),
    ("../reports/02-financials.pdf", "Financials", "Individual and team totals, scenarios, year 1"),
    ("../reports/03-gpt-review-handoff.pdf", "GPT handoff", "What GPT checked and what changed"),
    ("../reports/04-gpt-review.pdf", "GPT review, round 1", "Full findings with sources"),
    ("../reports/financials.csv", "Financials CSV", "Every cost line"),
    ("../PROMPT.md", "Prototype prompts", "Build the loop simulator and the six-user hub test"),
]


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def decisions_html():
    out = []
    for key, title, opts, rec, why in DECISIONS:
        options = "".join(
            f'<label class="opt"><input type="radio" name="{key}" value="{esc(o)}"{" checked" if i == rec else ""}>'
            f'<span>{esc(o)}{" <em>recommended</em>" if i == rec else ""}</span></label>'
            for i, o in enumerate(opts))
        out.append(f'<div class="card dec" data-title="{esc(title)}"><h3>{esc(title)}</h3>{options}<p class="why">{esc(why)}</p></div>')
    return "".join(out)


def table(head, rows):
    h = "".join(f"<th>{esc(x)}</th>" for x in head)
    r = "".join("<tr>" + "".join(f"<td>{esc(c)}</td>" for c in row) + "</tr>" for row in rows)
    return f'<div class="tw"><table><tr>{h}</tr>{r}</table></div>'


CSS = """
:root{--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--bg:#f8fafc;--accent:#0f766e;--accent2:#ccfbf1}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.45;font-size:15px}
header{background:var(--ink);color:#fff;padding:18px 16px 12px}
header h1{margin:0;font-size:22px}
header p{margin:4px 0 0;color:#cbd5e1;font-size:13px}
nav{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line);display:flex;gap:4px;overflow-x:auto;padding:6px 8px}
nav a{white-space:nowrap;text-decoration:none;color:var(--ink);font-size:14px;padding:10px 12px;border-radius:8px;min-height:44px;display:flex;align-items:center}
nav a:hover{background:var(--accent2)}
main{max-width:980px;margin:0 auto;padding:8px 14px 60px}
section{padding-top:18px}
h2{font-size:19px;margin:6px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--ink)}
h3{font-size:15px;margin:0 0 8px}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;margin:10px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px}
.kpi .v{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}
.kpi .l{font-size:12px;color:var(--muted)}
.opt{display:flex;gap:10px;align-items:flex-start;padding:10px 6px;min-height:44px;border-radius:8px;cursor:pointer}
.opt:hover{background:var(--bg)}
.opt input{width:20px;height:20px;margin:2px 0 0;accent-color:var(--accent)}
em{font-style:normal;font-size:11px;font-weight:700;color:var(--accent);background:var(--accent2);padding:1px 6px;border-radius:8px;margin-left:4px}
.why{color:var(--muted);font-size:13px;margin:6px 0 0}
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:14px;background:#fff}
th,td{text-align:left;padding:8px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:#f1f5f9}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
tr.total td{font-weight:700;border-top:2px solid var(--ink)}
.controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:10px}
.controls label{display:block;font-size:13px;color:var(--muted)}
select,input[type=number]{width:100%;font-size:16px;padding:10px;border:1px solid var(--line);border-radius:8px;min-height:44px;background:#fff}
.check{display:flex;gap:8px;align-items:center;min-height:44px;font-size:14px;color:var(--ink)!important}
.check input{width:20px;height:20px;accent-color:var(--accent)}
button{font-size:15px;padding:12px 16px;min-height:44px;border-radius:10px;border:0;background:var(--accent);color:#fff;font-weight:600;cursor:pointer}
textarea{width:100%;min-height:280px;font-family:Menlo,monospace;font-size:13px;border:1px solid var(--line);border-radius:8px;padding:10px}
.fig{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px;overflow-x:auto}
.fig svg{min-width:640px}
.note{border-left:3px solid var(--accent);background:#fff;padding:10px 12px;border-radius:0 8px 8px 0;font-size:14px;margin:10px 0}
.files a{display:block;padding:12px;min-height:44px;border:1px solid var(--line);border-radius:10px;background:#fff;text-decoration:none;color:var(--ink);margin:6px 0}
.files a span{display:block;font-size:13px;color:var(--muted)}
ol li{margin:6px 0}
.small{font-size:12px;color:var(--muted)}
"""

JS = """
const M = __MODEL__;
const $ = (s) => document.querySelector(s);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
function calc() {
  const people = +$('#people').value;
  for (const id of ['#ultra', '#pro', '#seats', '#biz']) if (+$(id).value > people) $(id).value = String(people);
  const ultra = +$('#ultra').value, seats = +$('#seats').value;
  const pro = +$('#pro').value, biz = +$('#biz').value;
  const accounts = ultra + pro + seats + biz;
  const annual = $('#billing').value === 'annual';
  const hub = M.hubs[$('#hub').value];
  const ts = $('#ts').checked, res = $('#res').checked;
  const claudeInd = ultra * M.ultra, gptInd = pro * M.gptPro;
  const claudeTeam = seats * (annual ? M.teamAnnual : M.teamMonthly);
  const gptTeam = biz * (annual ? M.bizAnnual : M.bizMonthly);
  const ultraMo = claudeInd + gptInd;
  const teamMo = claudeTeam + gptTeam;
  const tsMo = ts ? people * M.tailscale : 0;
  const resMo = res ? M.apiReserve : 0;
  const year1 = (ultraMo + teamMo + tsMo + resMo) * 12 + hub.total + M.backupYear;
  const credit = Math.min(seats * M.teamCredit, M.teamCreditCap);
  const rows = [
    ['Claude Ultra (each person pays)', ultra + ' x ' + money(M.ultra), claudeInd, claudeInd * 12],
    ['ChatGPT Pro (each person pays)', pro + ' x ' + money(M.gptPro), gptInd, gptInd * 12],
    ['Claude Team premium (company pays)', seats + ' x ' + money(annual ? M.teamAnnual : M.teamMonthly), claudeTeam, claudeTeam * 12],
    ['ChatGPT Business premium (company pays)', biz + ' x ' + money(annual ? M.bizAnnual : M.bizMonthly), gptTeam, gptTeam * 12],
    ['Tailscale Standard', ts ? people + ' x ' + money(M.tailscale) : 'off', tsMo, tsMo * 12],
    ['API reserve above credits', res ? 'cap, not a forecast' : 'off', resMo, resMo * 12],
    ['Hub: ' + hub.label, 'one time, estimates included', 0, hub.total],
    ['Offsite backup', 'estimate', 0, M.backupYear],
  ];
  $('#costrows').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="n">${r[2] ? money(r[2]) : ''}</td><td class="n">${money(r[3])}</td></tr>`).join('')
    + `<tr class="total"><td>Year 1</td><td></td><td class="n">${money(ultraMo + teamMo + tsMo + resMo)}/mo</td><td class="n">${money(year1)}</td></tr>`;
  $('#k-ind').textContent = money(ultraMo);
  $('#k-team').textContent = money(teamMo);
  $('#k-comb').textContent = money(ultraMo + teamMo);
  $('#k-acc').textContent = accounts + ' of ' + people * 4;
  $('#k-pp').textContent = money((ultraMo + teamMo) / people);
  const seatT = annual ? M.teamAnnual : M.teamMonthly, seatB = annual ? M.bizAnnual : M.bizMonthly;
  let pr = '';
  for (let i = 1; i <= people; i++) {
    const has = [i <= seats && 'Claude Team', i <= ultra && 'Claude Ultra', i <= biz && 'ChatGPT Business', i <= pro && 'ChatGPT Pro'].filter(Boolean);
    const own = (i <= ultra ? M.ultra : 0) + (i <= pro ? M.gptPro : 0);
    const co = (i <= seats ? seatT : 0) + (i <= biz ? seatB : 0);
    pr += `<tr><td>Person ${i}</td><td>${has.length}: ${has.join(', ') || 'none'}</td><td class="n">${money(own)}</td><td class="n">${money(co)}</td><td class="n">${money(own + co)}</td></tr>`;
  }
  pr += `<tr class="total"><td>${people} people</td><td>${accounts} accounts</td><td class="n">${money(ultraMo)}</td><td class="n">${money(teamMo)}</td><td class="n">${money(ultraMo + teamMo)}</td></tr>`;
  pr += `<tr><td>Average per person</td><td>${(accounts / people).toFixed(1)} accounts</td><td class="n">${money(ultraMo / people)}</td><td class="n">${money(teamMo / people)}</td><td class="n">${money((ultraMo + teamMo) / people)}</td></tr>`;
  pr += `<tr><td>Hub and extras, year 1, per person</td><td>company pays</td><td></td><td></td><td class="n">${money((hub.total + M.backupYear + (tsMo + resMo) * 12) / people)}</td></tr>`;
  $('#perperson').innerHTML = pr;
  $('#k-y1').textContent = money(year1);
  $('#k-credit').textContent = money(credit) + '/mo company API credit pool';
  return {people, accounts, ultra, seats, pro, biz, annual, hub: hub.label, year1, monthly: ultraMo + teamMo + tsMo + resMo};
}
function summary() {
  const c = calc();
  const lines = ["Infrastructure prototype, decisions as of " + new Date().toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'}), ''];
  document.querySelectorAll('.dec').forEach(d => {
    const pick = d.querySelector('input:checked');
    lines.push(d.dataset.title + ': ' + (pick ? pick.value : 'not decided'));
  });
  lines.push('', 'Cost model: ' + c.people + ' people, ' + c.accounts + ' accounts. ' + c.ultra + ' Claude Ultra, ' + c.pro + ' ChatGPT Pro, ' + c.seats + ' Claude Team and ' + c.biz + ' ChatGPT Business seats billed ' + (c.annual ? 'annually' : 'monthly') + ', hub ' + c.hub + '.');
  lines.push('Monthly ' + money(c.monthly) + ', about ' + money(c.monthly / c.people) + ' per person. Year 1 ' + money(c.year1) + '.');
  const note = $('#note').value.trim();
  if (note) lines.push('', 'Notes: ' + note);
  lines.push('', 'Still waiting on: Anthropic and OpenAI (personal accounts for company work, subscription logins for scheduled loops), ChatGPT price check, Apple quote, rollout step 5.');
  $('#out').value = lines.join('\\n');
}
document.addEventListener('input', () => { calc(); summary(); });
$('#copy').addEventListener('click', async () => {
  summary();
  try { await navigator.clipboard.writeText($('#out').value); $('#copy').textContent = 'Copied'; }
  catch { $('#out').select(); document.execCommand('copy'); $('#copy').textContent = 'Copied'; }
  setTimeout(() => $('#copy').textContent = 'Copy summary', 1500);
});
calc(); summary();
"""


def main():
    hub_opts = "".join(f'<option value="{k}"{" selected" if k == "recommended" else ""}>{esc(v["label"])} ({b.money(v["total"])})</option>'
                       for k, v in MODEL["hubs"].items())
    people_opts = lambda sel, lo=0: "".join(f'<option{" selected" if n == sel else ""}>{n}</option>' for n in range(lo, 7))
    waiting = table(["Who", "Question"], WAITING)
    rollout = table(["Step", "Change", "Pass test"], [(str(i + 1), a, p) for i, (a, p) in enumerate(ROLLOUT)])
    review = table(["GPT found", "What changed"], REVIEW)
    files = "".join(f'<a href="{h}">{esc(t)}<span>{esc(d)}</span></a>' for h, t, d in FILES)
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Infrastructure prototype</title><style>{CSS}</style></head><body>
<header><h1>Infrastructure prototype</h1>
<p>Six people, 24 Claude and ChatGPT accounts, one hub for hill-climbing loops. Prices as of {b.AS_OF}. Nothing here is a decision until Et picks it below.</p></header>
<nav><a href="#decide">Decide</a><a href="#map">Map</a><a href="#loop">Loop</a><a href="#money">Money</a><a href="#review">GPT review</a><a href="#rollout">Rollout</a><a href="#files">Files</a></nav>
<main>
<section id="decide"><h2>Decisions for Et</h2>
<p class="small">The recommended option is preselected. Change any choice, add a note, then copy the summary to pass it on. The page saves nothing, so a refresh resets it.</p>
<div class="grid">{decisions_html()}</div>
<h3 style="margin-top:14px">Waiting on others</h3>{waiting}
<div class="card"><h3>Summary to pass on</h3>
<label class="small" for="note">Note (optional)</label>
<input id="note" type="text" style="width:100%;font-size:16px;padding:10px;border:1px solid var(--line);border-radius:8px;min-height:44px;margin:4px 0 10px">
<textarea id="out" readonly></textarea>
<p><button id="copy" type="button">Copy summary</button></p></div>
</section>

<section id="map"><h2>Infrastructure map</h2>
<div class="fig">{b.architecture_svg()}</div>
<div class="note">No account is shared, pooled or routed through a proxy. Each agent runs under its own person's login, in that person's own Linux user on the Ubuntu hub. Jobs the scheduler starts on its own use company API keys and the Claude Team credit pool.</div>
</section>

<section id="loop"><h2>Hill-climbing loop</h2>
<div class="fig">{b.hillclimb_svg()}</div>
<ol>
<li>The brief names the metric, the smallest gain worth keeping, and three data sets. The tuning set guides the loop, the check set confirms each winner, and the audit set is used once at the end.</li>
<li>The scheduler opens one git worktree per variant. Each free company seat, Claude or ChatGPT, writes one variant.</li>
<li>Scoring runs in a throwaway sandbox with no secrets and no network. Test files sit outside the worktree and are checked by hash. The runner confirms every expected test ran.</li>
<li>The winner and the current best re-run side by side across several seeds. The winner stays only if its gain beats the margin and no test breaks.</li>
<li>The other company's model reviews the winning change, GPT for a Claude winner and Claude for a GPT winner. It looks for tricks that raise the score without improving the software.</li>
<li>Only the scheduler writes the ledger. Winners rebase, re-score and merge one at a time, after a person reads the change.</li>
</ol>
</section>

<section id="money"><h2>Money</h2>
<div class="kpis">
<div class="kpi"><div class="v" id="k-ind"></div><div class="l">individual accounts per month (Ultra + ChatGPT Pro)</div></div>
<div class="kpi"><div class="v" id="k-team"></div><div class="l">team seats per month (Claude Team + ChatGPT Business)</div></div>
<div class="kpi"><div class="v" id="k-comb"></div><div class="l">combined subscriptions per month</div></div>
<div class="kpi"><div class="v" id="k-acc"></div><div class="l">accounts in use</div></div>
<div class="kpi"><div class="v" id="k-pp"></div><div class="l">subscriptions per person per month</div></div>
<div class="kpi"><div class="v" id="k-y1"></div><div class="l">year 1, everything on</div></div>
</div>
<p class="small" id="k-credit"></p>
<div class="card"><h3>Try a different setup</h3>
<div class="controls">
<label>People<select id="people">{people_opts(6, 1)}</select></label>
<label>Claude Ultra ($200 each)<select id="ultra">{people_opts(6)}</select></label>
<label>ChatGPT Pro ($200 each)<select id="pro">{people_opts(6)}</select></label>
<label>Claude Team premium seats<select id="seats">{people_opts(6)}</select></label>
<label>ChatGPT Business premium seats<select id="biz">{people_opts(6)}</select></label>
<label>Team seat billing<select id="billing"><option value="annual" selected>Annual ($100/seat)</option><option value="monthly">Monthly ($125/seat)</option></select></label>
<label>Hub<select id="hub">{hub_opts}</select></label>
<label class="check"><input type="checkbox" id="ts" checked> Tailscale Standard fallback</label>
<label class="check"><input type="checkbox" id="res" checked> $200/mo API reserve</label>
</div>
<h3>Accounts by person, per month</h3>
<div class="tw"><table><tr><th>Person</th><th>Accounts</th><th>Person pays</th><th>Company pays</th><th>Total</th></tr><tbody id="perperson"></tbody></table></div>
<h3 style="margin-top:14px">All costs</h3>
<div class="tw"><table><tr><th>Item</th><th>Basis</th><th>Monthly</th><th>Year 1</th></tr><tbody id="costrows"></tbody></table></div>
<p class="small">Claude prices are from claude.com/pricing on {b.AS_OF}. ChatGPT prices come from CloudZero's and Endless's October 2026 pricing guides, because OpenAI's page blocked automated reads. Confirm them before buying. Linux tower CPU and memory prices come from October 2026 price trackers during a memory shortage. Other hub parts, UPS, drive, network and backup are estimates until quoted. Both team plans need at least two seats.</p>
</div>
</section>

<section id="review"><h2>GPT review, round 1</h2>
<p>GPT-6.1-Sol rechecked every total and found no arithmetic errors. It found five wrong facts and ten risks, and each one changed the plan. The last two rows are changes Et made after the review.</p>
{review}
</section>

<section id="rollout"><h2>Rollout</h2>{rollout}
<p class="small">Each step has a rollback in the infrastructure PDF. Nothing is bought before step 5 passes.</p></section>

<section id="files"><h2>Files</h2><div class="files">{files}</div>
<p class="small">Rebuild everything after a price change: <code>python3 -I docs/prototypes/infrastructure/src/build.py</code>, then <code>page.py</code>.</p></section>
</main>
<script>{JS.replace("__MODEL__", json.dumps(MODEL))}</script>
</body></html>"""
    with open(OUT, "w") as f:
        f.write(html)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
