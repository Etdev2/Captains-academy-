# Infrastructure plan review

Checked October 31, 2026. US dollars and US purchasing assumptions. This is a review, not a revised plan. Only this review file was written. Vendor pages are a point-in-time check, not a price guarantee.

Local evidence: [build.py](file:///Users/et/ai-studio-plan/src/build.py), [infrastructure](file:///Users/et/ai-studio-plan/01-infrastructure-design.html), [financials](file:///Users/et/ai-studio-plan/02-financials.html), and [CSV](file:///Users/et/ai-studio-plan/financials.csv). Findings marked "verified" report source facts or independently checked arithmetic. Findings marked "judgment call" are review conclusions and recommendations, not vendor guarantees or legal advice.

## Errors

### E1. The current $200 personal plan is Ultra, not Max 20x

Verified. The current pricing page lists Max at $100/month and Ultra at $200/month. Ultra includes $200/month in API credits and advertises 10x Pro weekly usage. The cash assumption remains correct for the current $200 tier, but the plan name needs updating. Do not assume the old name establishes an existing subscriber's current entitlement. Check each actual account before purchase or migration.

Source: https://claude.com/pricing

### E2. Team API credits are missing

Verified. `PRICES["team_premium"]["api_credit"]` is zero. Current documentation specifies $100/month per premium seat, pooled with other Team seat credits and capped at $500/month per Team organization. Six premium seats therefore provide a $500 pool, not zero, $600, or $900. This does not reduce the subscription invoice.

Fix: account for the company pool separately from cash spend and individual credits. New subscribers must wait seven days to claim credits. Credits require linking an eligible Console organization, expire each billing cycle without rollover, and do not cover interactive Claude Code or subscription extra usage. Do not assume they are available on day one or automatically used by a subscription-backed T3 turn.

Source: https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers

### E3. A free Personal Tailscale plan is not a company fallback budget

Verified. The infrastructure table says "Free personal tier, verify for six users." The current Personal plan permits six users but is for non-commercial use. Standard is $8/user/month. Six users cost $48/month or $576/year before tax. Fix the commercial eligibility assumption, obtain a different applicable offer, or choose another fallback.

Source: https://tailscale.com/pricing

### E4. "Unattended means API-only" is too broad as a statement of vendor rules

Verified distinction; judgment call on this deployment. Claude Code officially supports scheduled tasks. Anthropic distinguishes ordinary native subscription use from developers building products or services through the Agent SDK, for which its authentication guidance says to use API keys or supported cloud providers. It also restricts credential intermediation. Whether a person is physically watching is not the complete test. Pressing Start does not, by itself, settle whether the following automation is permitted.

Fix: keep company API authentication as a conservative deployment policy if desired, but do not present it as a universal ban on subscription scheduling. Document the exact T3 provider path and get Anthropic clarification for this six-person unattended use case. T3's own assurance is not a substitute for Anthropic's applicable agreement.

Sources: https://code.claude.com/docs/en/scheduled-tasks and https://code.claude.com/docs/en/legal-and-compliance and https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/faq.md

### E5. The usage-unit comparison overstates what the ratios establish

Verified arithmetic, judgment call on interpretation. The plan calculates 6 × 10 + 6 × 5 = 90 nominal Pro-equivalents. Its own Team assumption is a lower bound because premium is compared with standard, not directly with Pro. Dividing $100 by at least five gives at most $20 per nominal unit, not an established equality with the personal tier. Subscription ratios also do not establish six-way concurrency, predictable tokens, or guaranteed weekly completed work.

Fix: retain ratios only as labeled marketing comparisons. Base capacity and purchasing decisions on measured completed tasks, wall time, limits, and cost under the actual provider configuration.

Source for the plan's assumptions and derived arithmetic: [build.py](file:///Users/et/ai-studio-plan/src/build.py).

## Risks

Ranked by the consequence of discovering the problem after buying accounts or hardware. P0 means resolve before unattended company runs. P1 means resolve during the pilot and before expansion.

### R1. P0. Personal company work and personal-credit ownership remain legally unresolved

Judgment call, with verified source limitations. I cannot certify that a US personal subscription may perform this company's work from the applicable contract fetched here. The consumer-terms page served an EEA/Switzerland agreement. Its consumer definition is not evidence of a US-wide commercial-use prohibition. This review therefore does not claim either a blanket ban or blanket permission for personal Max/Ultra company work. Obtain the US agreement accepted by these subscribers or a written Anthropic answer.

Verified. Credits cannot be transferred or sold. The claim flow requires the subscriber and an appropriate Console role. Each Console organization can receive credits from only one plan. This does not establish that a personal subscriber must use a personally owned Console organization, nor does it establish that credits can be pooled across six personal plans into the Team-linked organization. The answer depends on the original linked account holder and applicable terms, not merely who pays the subscription invoice.

Action: use the company Team-linked Console pool for company automation first. Ask Anthropic specifically whether an employee can link their personal subscription to a company-controlled Console organization and use the grant for employer projects. Do not transfer balances or design around credential sharing. Record ownership, reimbursement, data handling, and offboarding before personal accounts touch company repositories.

Sources: https://www.anthropic.com/legal/consumer-terms and https://www.anthropic.com/legal/commercial-terms and https://www.anthropic.com/legal/credit-terms and https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-ultra-and-team-plans

### R2. P0. Six simultaneous macOS users through T3 Connect is not proven

Verified. T3's macOS background service starts at user login and stops at logout. Its service environment supports a configurable port. Remote devices use the corresponding T3 Connect account. None of the cited documentation explicitly certifies six simultaneous macOS user sessions, six services, and six Connect identities on one physical Mac.

Judgment call. The architecture is plausible, not purchase-ready. Before buying the Studio, test all six users on the existing Mac, even if only a small task runs in each. Assign distinct service ports and per-user data/config directories. Verify each remote client reaches only its own environment. Test Fast User Switching, logout, cold boot, screen lock, lost network, and reconnection. Record what starts automatically and who must log in again. Do not silently replace per-user services with one shared service.

Sources: https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/background-service.md and https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/remote-access.md

### R3. P0. A separate scorer process is not a trusted evaluation boundary

Judgment call. "Agents never score their own work" does not stop candidate code from deleting tests, changing fixtures, exiting early, accessing benchmark answers, faking output, or interfering with the scorer. Anthropic has documented test-harness reward hacking, including early successful exit. GPT diff review is useful but not a containment mechanism.

Action: keep immutable evaluator and fixture hashes outside candidate-writable worktrees. Evaluate in disposable isolation with no production secrets, restricted network, read-only inputs, resource limits, and a trusted result collector. Verify expected tests actually executed, not just exit code zero. Prevent candidate processes from writing the ledger or contacting the promotion service. Keep hidden correctness and regression gates independent of the optimized metric. Have a human inspect the winning behavior as well as its diff.

Source: https://www.anthropic.com/research/emergent-misalignment-reward-hacking

### R4. P1. Three baseline runs do not justify the keep threshold

Judgment call, supported by statistical references. An observed range from three runs is not a confidence bound on candidate improvement. Candidate variance can differ from baseline variance. Choosing the largest result among K candidates and repeating rounds introduces selection bias. Comparing with a historical best also confounds changes in load and environment. Reusing one fixed seed does not test robustness across seeds.

Action: predeclare a practically meaningful improvement, the sampling unit, and a repeated/sequential testing policy. Re-evaluate the incumbent and candidate in paired, randomized order under comparable load. Use enough independent seeds or samples for the metric's distribution. Require a lower confidence bound on paired improvement to exceed the meaningful threshold, with a policy for multiple candidates and repeated looks. For deterministic correctness, use exact gates instead of inventing a noise margin. No fixed repeat count is defensible without the measured variance and desired error rate.

Statistical reference: https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm. The proposed testing policy is a judgment call, not a procedure specified by that reference.

### R5. P1. The "held-out" set becomes tuning data

Judgment call. If each round's score guides the next candidate, the set is being used adaptively, even if agents never see its raw rows. A rising score can then reflect benchmark overfitting rather than better software. An independent GPT review does not restore statistical independence.

Action: split optimization and final audit data before starting. Limit feedback and rotate or replenish validation data. Reserve an untouched final audit that cannot guide the search. Define separate functionality, security, and user-visible regression gates. Do not claim general improvement from a repeatedly queried score alone.

Source: https://arxiv.org/abs/1506.02629

### R6. P1. No complete queue, promotion, or ledger protocol is specified

Verified. Git worktrees share repository metadata; they are not independent repositories. Judgment call: allowing several macOS users to mutate a shared repository creates an ownership/permissions problem, while separate clones require an explicit exchange and promotion process. A tracked TSV alone does not define safe concurrent writes.

Action: define a scheduler identity and API, cancellation, timeouts, retries, idempotency, and per-person authorization. Pin every candidate to the same base commit and evaluator version. Serialize promotion, rebase and re-score against the current head, and run tests on the actual merge result. Use an append-only single-writer ledger. Include run ID, parent/base commit, candidate commit, fixture/evaluator hashes, seed, environment, full result, failures, and actual usage. Never let a user's work run under another user's subscription merely because that seat is free.

Sources: https://git-scm.com/docs/git-worktree and [infrastructure](file:///Users/et/ai-studio-plan/01-infrastructure-design.html)

### R7. P1. Subscription capacity is not the host's safe concurrency limit

Judgment call. K should not equal the number of free seats without CPU, memory, disk, and evaluator limits. Six parallel builds can affect latency scores and responsiveness. The claims that the Studio fits six variants and the minis fit specific smaller counts are unsupported workload estimates, not demonstrated hardware limits.

Action: benchmark one representative task, then increase load. Queue expensive evals separately from generation, control benchmark load, cap processes and disk use, and reserve capacity for remote access. Pin T3, provider CLI, runtime, dependencies, model, and permissions for each measured round. T3's FAQ reports faster five-hour subscription drain through its Agent SDK path, so measure the actual integration instead of extrapolating from direct CLI use.

Sources: [build.py](file:///Users/et/ai-studio-plan/src/build.py) and https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/faq.md

### R8. P1. One hub needs a tested recovery path

Judgment call. The plan itself reports 7.8 GB free and no backup destination at its last audit. I did not inspect the machine and cannot confirm its current condition. Its sleep setting is not proof of availability through lid closure, power loss, reboot, or missing user logins. FileVault startup access requires an authorized unlock path.

Action: verify free space and backup now, perform a restore test, and test power/network loss and restart before remote dependence. Define an onsite recovery owner, recovery time, and which jobs can be resumed safely. Keep credentials out of logs and proof bundles. Restrict users and paired clients to the access they need. Validate that uninstalling, logging out, or revoking one person does not expose or disable everyone else's environment.

Sources: [infrastructure](file:///Users/et/ai-studio-plan/01-infrastructure-design.html) and https://support.apple.com/guide/mac-help/how-does-filevault-work-on-a-mac-flvlt001/mac and https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/background-service.md and https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/remote-access.md

### R9. P1. The headline budget is not the pilot's all-in cash requirement

Verified arithmetic. The $25,288 total excludes the plan's $200/month additional API reserve. Adding it gives $27,688. Adding six-user Tailscale Standard gives $28,264. These remain pretax planning figures, not measured operating cost. Treat the API reserve as cash contingency above usable credits, not a prediction of token demand.

The rollout defers annual Team billing until after the pilot, but the headline assumes annual pricing throughout. With one full month of six monthly premium seats followed by annual billing, twelve-month allocated expense becomes $25,438. Cash paid during that period becomes $26,038 if it includes the subsequent full $7,200 annual prepayment, some of which funds the following year. Confirm actual conversion/proration before relying on either example.

Judgment call. Add per-run and daily spend ceilings, a hard stop, retry/backoff limits, and a GPT review queue. The existing OpenAI subscription is excluded by assumption; that is not evidence of unlimited reviewer capacity. The company does not gain all personal capacity merely by paying for twelve subscriptions.

Sources: [financials](file:///Users/et/ai-studio-plan/02-financials.html), [build.py](file:///Users/et/ai-studio-plan/src/build.py), and https://tailscale.com/pricing

### R10. P1. Hardware upgrades and backup prices remain estimates

Verified scope; judgment call on purchasing. The plan labels memory/storage upgrades, UPS, drive, networking, and $99/year offsite backup as estimates. Base-model prices do not verify the configured 64 GB/2 TB Studio price. Obtain a saved configuration quote, check whether a chip-tier change is required, and confirm the backup product covers the intended users, data, retention, and restore procedure. Do not purchase based on the $600 upgrade allowance alone.

Sources: [build.py](file:///Users/et/ai-studio-plan/src/build.py) and https://www.apple.com/shop/buy-mac/mac-studio and https://www.apple.com/shop/buy-mac/mac-mini

## Confirmed

### C1. Current prices and minimum seats

Verified as of October 31, 2026. Team premium is $125/seat/month monthly, or $100/seat/month annually. Standard is $25 monthly or $20 annually. The current Team minimum is two members, not five. Six seats satisfy it; a two-person pilot need not buy six solely to meet a minimum. The current $200 personal tier includes $200/month API credits, subject to the claim and expiry rules in E2.

Sources: https://claude.com/pricing and https://support.claude.com/en/articles/9266767-what-is-the-team-plan and https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-ultra-and-team-plans

Verified Apple US base prices: Mac Studio M5 Max $2,499, Mac mini M5 Pro $1,699, and Mac mini M6 $899. These are base prices, not configured quotes.

Sources: https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/ and https://www.apple.com/newsroom/2026/08/apple-unveils-a-more-powerful-mac-mini-featuring-the-all-new-m6-and-m5-pro/

### C2. Two Claude entries per person are documented

Verified. T3 documents separate Work and Personal Claude instances, with a distinct `CLAUDE_CONFIG_DIR` and login for each. Separate labels alone are insufficient. Check the reported account after login. Existing threads can switch only between instances with the same config directory, so cross-account continuation is not a transparent switch.

Source: https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/providers-claude.md

### C3. T3 Connect has no current required fee, but no permanent free-price promise

Verified. T3 Code is free and MIT-licensed. T3 Connect is "free ... for now." Its free allowance is three linked machines per Connect account; phones and browsers do not count. Linked paid T3 Chat raises this to ten machines on Pro or 100 on Premier. Six people with separate identities are not automatically a six-machine charge on one account. Conversely, do not assume six independently registered services count as one host without testing registration.

Sources: https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/faq.md and https://raw.githubusercontent.com/pingdotgg/t3code/main/docs/user/remote-access.md

### C4. All financial totals recompute correctly from the supplied inputs

Verified by independent arithmetic. No addition or multiplication error was found. Source assumptions, omitted costs, and billing timing are separate findings. Monthly and annual Team rows are alternatives. The three hardware bundles are alternatives. Summing every CSV row would double-count them.

Sources for every row below: [build.py](file:///Users/et/ai-studio-plan/src/build.py) and [financials.csv](file:///Users/et/ai-studio-plan/financials.csv).

| Subscription calculation | Monthly amount or equivalent | Annual amount |
| --- | ---: | ---: |
| Six personal subscriptions, 6 × $200 | $1,200 | $14,400 |
| Six Team premium, monthly, 6 × $125 | $750 | $9,000 |
| Six Team premium, annual, 6 × $100 | $600 | $7,200 |
| A, personal plus monthly Team | $1,950 | $23,400 |
| A2, personal plus annual Team | $1,800 | $21,600 |
| B, annual Team only | $600 | $7,200 |
| C, personal only | $1,200 | $14,400 |
| A2 per person | $300 | $3,600 |
| Annual Team saving over monthly | $150 | $1,800 |

| Hardware bundle | Independent calculation | Total |
| --- | --- | ---: |
| Studio | $2,499 + $600 + $250 + $180 + $60 | $3,589 |
| M5 Pro mini | $1,699 + $400 + $250 + $180 + $60 | $2,589 |
| M6 mini | $899 + $400 + $250 + $180 + $60 | $1,789 |
| Largest bundle difference | $3,589 - $1,789 | $1,800 |

| Annual total | Independent calculation | Total |
| --- | --- | ---: |
| Year one, Studio | $21,600 + $3,589 + $99 | $25,288 |
| Year one, M5 Pro mini | $21,600 + $2,589 + $99 | $24,288 |
| Year one, M6 mini | $21,600 + $1,789 + $99 | $23,488 |
| Company share, Studio | $7,200 + $3,589 + $99 | $10,888 |
| Personal share | 6 × $200 × 12 | $14,400 |
| Year two onward, no new hardware | $21,600 + $99 | $21,699 |

Verified. The Studio year-one shares round independently to 57% personal, 28% Team, 14% hardware, and 0% backup. Their displayed sum of 99% is rounding, not missing money. The plan's $1,200/month of personal credits is six separate $200 grants, not an automatically available company balance. E2 adds a distinct $500 Team pool without changing subscription cash totals.

Verified document consistency. All 21 CSV data rows match their source calculations. The two report HTML files match `report_infra()` and `report_fin()` output. All 32 distinct dollar amounts in the financial HTML also appear in its PDF. This checks numerical consistency, not the truth of estimated purchase prices. I did not run the generator's file-writing entry point.

Sources: [financials HTML](file:///Users/et/ai-studio-plan/02-financials.html), [financials PDF](file:///Users/et/ai-studio-plan/02-financials.pdf), [CSV](file:///Users/et/ai-studio-plan/financials.csv), and [build.py](file:///Users/et/ai-studio-plan/src/build.py).

### C5. The keep rule has a useful intent, not a correctness guarantee

Judgment call. Rejecting regressions, retaining the incumbent when improvement is unproven, reviewing the winning diff, and requiring human merge are sound defaults. They become a defensible acceptance procedure only after evaluator integrity, comparable measurements, adaptive-overfitting controls, and serialized promotion are addressed. A greedy loop can also stop at a local optimum; stopping without a winner is a valid result, not evidence that the system failed.

Evidence reviewed: [infrastructure](file:///Users/et/ai-studio-plan/01-infrastructure-design.html). Statistical basis for the cautions: https://arxiv.org/abs/1506.02629
