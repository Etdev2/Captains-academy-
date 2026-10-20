# Arcade game regulation check, 2026-10-20

Checked by Sounding Larboard (uscg-regs, subagent of Bosun Larboard) on 2026-10-20 for the four arcade-game items under "To verify before building" in `docs/product/DECISIONS.md`.

## How the sources were reached

None of the primary sites could be opened this session. Every attempt failed:

| Host | curl | WebFetch |
| --- | --- | --- |
| www.ecfr.gov | proxy refused the connection (403) | DNS lookup failed |
| www.law.cornell.edu | proxy refused (403) | DNS lookup failed |
| www.govinfo.gov | proxy refused (403) | DNS lookup failed |
| www.dco.uscg.mil (NMC) | proxy refused (403) | DNS lookup failed |
| www.uscg.mil | proxy refused (403) | DNS lookup failed |
| www.navcen.uscg.gov | proxy refused (403) | DNS lookup failed |
| www.federalregister.gov, downloads.regulations.gov, www.imo.org | not tried | DNS lookup failed |
| github.com (control test) | not tried | loaded |

The only working channel was the WebSearch tool. It returns a summary written by a search model, with short quotes from the pages it indexed. Every answer below comes from those summaries. Where a summary quoted an official page (eCFR, dco.uscg.mil, govinfo), this file names that page, but nobody in this session opened it. Under the uscg-regs rules every item below is therefore `unverified` until someone reads the primary text directly.

Confidence levels mean this:

- High: several independent summaries quote the same official wording, and nothing conflicts.
- Medium: the figure traces to one official document, or the official document is old.
- Low: the figure rests on third-party sites, or the sources conflict.

## 1. Passing score for the Rules of the Road module

Status: `unverified`. Confidence: medium.

The Rules of the Road module for deck officer exams is Q100, "Rules of the Road: International and Inland". It has 50 multiple-choice questions and a passing score of 90, so a candidate needs 45 right. The same Q100 module appears in every deck exam code checked, so the mark does not change between OUPV, Master or Mate under 100 GRT, Master or Mate under 200 GRT, and the unlimited Mate and Master exams:

| Exam code | Endorsement | Rules of the Road module |
| --- | --- | --- |
| ONC01 | Master or Chief Mate, unlimited | Q100 |
| ONC02 | Second Mate, Third Mate | Q100 |
| ONC05 | Master or Mate under 200 GRT | Q100 |
| ONC06 | Master or Mate under 100 GRT, near coastal | Q100 |
| ONC07 | OUPV, near coastal | Q100 |
| GLI06 | Master or Mate under 100 GRT, Great Lakes and inland | Q100 |
| GLI07 | OUPV, Great Lakes and inland | Q100, or Q300 on request |

There are two exceptions:

- Q300, "Rules of the Road: Inland", is an Inland-only module, also 50 questions at 90. A Great Lakes and inland applicant takes Q100 unless they ask for Q300. Taking Q300 puts a COLREGS limitation on the credential.
- Q301, "Rules of the Road: Inland", belongs to the Limited OUPV exam (GLI08). One summary of the NMC guide gives it a passing score of 80, not 90. This is the only source for that figure.

No section of 46 CFR turned up that sets the 90 figure. The searches found only the Part 11 table of contents, which lists 46 CFR 11.910 as "Subjects for deck officer endorsements". The passing scores come from the NMC's exam guide, not from the regulation text.

Sources:

- NMC, "Deck and Engineering Guide for the Administration of Merchant Marine Examinations", MCP-MA-NMC2-08(01), as of 24 March 2014. https://www.dco.uscg.mil/Portals/9/NMC/pdfs/examinations/deck_engineering_guide_as_of_3_24_14.pdf. Not reached. Search summaries quote its tables: Q100 at 50 questions and 90, Q300 at 50 and 90, Q301 at 50 and 80. A third-party copy is at https://www.marineradvancement.com/pdfUSCG/3Exam_Guide_on_and_after_3_24_14.pdf (also not reached).
- NMC exam code pages, such as https://www.dco.uscg.mil/nmc/examinations/ and https://www.dco.uscg.mil/nmc/exams/ONC07-Q100-Q172/. Not reached. Summaries quote the module lists in the table above.
- NMC "approval to test" notice as republished at https://www.seafarers.org/nmc-approval-to-test/. Not reached. A summary quotes it listing Q100 at 90 under the current regulations.
- A November 2021 N-MERPAC public comment at https://downloads.regulations.gov/USCG-2021-0742-0002/attachment_1.pdf says some Rules of the Road and navigation exams pass at 87 to 90 percent. This is a public comment, not NMC policy. The 87 figure matches the NMC guide's Q115 chart plot module for unlimited mates, not a Rules of the Road module.

Open question for the NMC: is the 2014 guide still the current source for module passing scores and question counts, or has a later guide replaced it?

## 2. Exam modules for each license

Status: `unverified`. Confidence: medium for the module lists, low for some pass marks.

The NMC organizes exams by exam code. Each code covers one endorsement and lists its modules. Near coastal codes start with ONC and Great Lakes and inland codes start with GLI. The module content differs by waters, so near coastal and inland are different exams, not one exam with an extra chapter.

### OUPV, near coastal (ONC07)

| Module | Title | Questions | Pass |
| --- | --- | --- | --- |
| Q100 | Rules of the Road: International and Inland | 50 | 90 |
| Q170 | Deck General/Safety | 50 | 70 |
| Q171 | Navigation General: Near Coastal | 50 | 70 |
| Q172 | Chart Plot (the 2014 guide calls it "Navigation Problems: Chart Plot") | 10 | 90 |

### OUPV, Great Lakes and inland (GLI07)

| Module | Title | Questions | Pass |
| --- | --- | --- | --- |
| Q100 or Q300 | Rules of the Road: International and Inland, or Inland only | 50 | 90 |
| Q356 | Deck General/Safety | not found | not found |
| Q357 | Navigation General: Great Lakes and Inland | not found | not found |
| Q358 | Chart Plot | not found | not found |

### Master or Mate under 100 GRT, near coastal (ONC06)

| Module | Title | Questions | Pass |
| --- | --- | --- | --- |
| Q100 | Rules of the Road: International and Inland | 50 | 90 |
| Q160 | Deck General | 50 (third-party) | 70 |
| Q161 | Deck Safety | 50 (third-party) | 70 |
| Q162 | Navigation General: Near Coastal | 50 (third-party) | 70 (third-party) |
| Q163 | Navigation Problems: Chart Plot | 10 | 90 |
| Q164 | Renewal open-book exercise | not part of an original exam | |
| Q165 | Navigation and Deck General/Safety | raise in grade from OUPV near coastal only | |

### Master or Mate under 100 GRT, Great Lakes and inland (GLI06)

| Module | Title | Questions | Pass |
| --- | --- | --- | --- |
| Q100 | Rules of the Road: International and Inland | 50 | 90 |
| Q347 | Deck General | 50 | 70 |
| Q348 | Deck Safety | 50 | 70 |
| Q349 | Navigation General: Great Lakes and Inland | 50 | 70 |
| Q350 | Navigation Problems: Chart Plot | 10 | 90 |
| Q352 | Navigation and Deck General/Safety | 50 | 70, raise in grade from OUPV only |

### 25, 50 and 100 GRT

The Master 25, 50 and 100 GRT ratings are one endorsement, "Master of vessels of less than 100 GRT", issued in tonnage steps. The step comes from the tonnage of the vessels in the applicant's sea time, not from a different exam. A summary of the eCFR text of 46 CFR 11.457 quotes: "All endorsements issued for Master or Mate of vessels of less than 100 GRT are issued in tonnage increments based on the applicant's qualifying experience in accordance with the provisions of § 11.422." So a 25-ton and a 100-ton candidate take the same ONC06 or GLI06 exam. The tonnage percentages belong to the sea-time log and need their own check against 46 CFR 11.422.

### Master or Mate under 200 GRT (ONC05), for reference

The module range is Q100 to Q159. A U.S. Army credentialing page (https://www.cool.osd.mil/army/credential/index.html?cert=master200below5560&moc=88k, not reached) lists Q100 Rules of the Road, Q150 Deck General, Q151 Deck Safety and Q153 Navigation Problems: Chart Plot, and an NMC sample file name points to Q152 Navigation General: Oceans or Near Coastal. Confidence: low.

### Raise in grade and the game

An OUPV holder moving to Master under 100 GRT takes one combined module (Q165 near coastal, Q352 inland) instead of the full set. A license badge for "OUPV to 100-Ton upgrade" would map to a different set of chapters than a fresh 100-ton badge.

Sources:

- NMC exam pages, not reached: https://www.dco.uscg.mil/nmc/exams/ONC07-Q100-Q172/, https://www.dco.uscg.mil/nmc/exams/ONC06-Master-LT-100-GRT-Q100-Q161/, https://www.dco.uscg.mil/nmc/exams/ONC06-master-LT-100-GRT-Q162-Q165/, https://www.dco.uscg.mil/nmc/exams/GLI06-master-or-mate-LT-100-GRT-Q100-Q352/, https://www.dco.uscg.mil/nmc/exams/great-lakes-and-inland-endorsements/, https://www.dco.uscg.mil/nmc/exams/oceans_or_near_coastal_endorsements/.
- The 2014 NMC exam guide named under item 1, for question counts and pass marks.
- 46 CFR 11.457 at https://www.ecfr.gov/current/title-46/chapter-I/subchapter-B/part-11/subpart-D/section-11.457, not reached.
- Third-party, leads only: https://www.marineradvancement.com/deckMateMaster50-100-200GRT.html (Q162 pass mark), https://www.seasources.net/Master_25_50_100%20Ton.html (GLI06 module list), https://www.edumaritime.net/uscg-exams/deck-officer-exams-great-lakes-and-inland (Inland-only Rules option).

Open questions for the NMC:

- The current pass marks and question counts for Q356, Q357 and Q358 (OUPV inland).
- Whether Q162's pass mark is 70.
- Whether any of these module numbers changed after the 2014 guide. The exam code pages were indexed with ages of roughly two to five years.

## 3. Reusing the Coast Guard's sample exam questions

Status: `unverified`, and it needs `counsel`. Confidence: medium on the law and where the samples live, low on whether every question and illustration is free of third-party rights.

The statute is 17 U.S.C. 105(a): "Copyright protection under this title is not available for any work of the United States Government." Section 101 defines that as a work prepared by a federal officer or employee as part of their official duties. Text from the GPO edition at https://www.govinfo.gov/content/pkg/USCODE-2020-title17/html/USCODE-2020-title17-chap1-sec105.htm, quoted in a search summary, not reached.

What the NMC publishes:

- Since 2016 the NMC no longer publishes its full question bank. Section 315 of the Coast Guard Authorization Act of 2015, now 46 U.S.C. 7510, says the Coast Guard does not have to disclose exam questions. It also lets the Coast Guard release retired questions, or questions it considers appropriate, so the public can prepare. The NMC bulletin of 28 July 2016 said the bank and its illustrations would come down around 1 September 2016. Bulletin: https://www.dco.uscg.mil/Portals/9/NMC/pdfs/announcements/2016/merchant_mariner_credential_examainations.pdf, not reached.
- In its place, 46 U.S.C. 7116 requires a sample exam and a topic outline each year, "readily available to the public". The current set is on the NMC Examinations page under the Sample Examinations tab (https://www.dco.uscg.mil/nmc/examinations/, not reached).
- The Rules of the Road sample is https://www.dco.uscg.mil/Portals/9/NMC/pdfs/examinations/q100_ror_inland-international.pdf (not reached). Search summaries describe it as a "Sample Examination" with 6 illustrations, no reference material allowed, and each question tagged "BOTH INTERNATIONAL & INLAND", "INTERNATIONAL ONLY" or "INLAND ONLY". One summary dates the current file 8/5/2025 with 18 pages; an older copy is dated 8/12/2024 with 17 pages. Inland-only samples exist for Q300 and Q301.

Caveats:

- It is one sample exam per module, not a bank. The question count was not visible. Judging from 18 pages, expect a few dozen Rules of the Road questions at most, which is too few for a boss level that a player must clear twice without repeats.
- Some sample PDFs credit outside sources with the line "Adapted for testing purposes only". Credits seen in summaries include Bowditch's American Practical Navigator and NOAA, which are federal works, and Hayler's American Merchant Seaman's Manual, which is a commercial book. One summary claimed an American Bureau of Shipping copyright notice; a second search found ABS only as an answer choice. The Q100 sample's own credit line, if it has one, was not visible in any summary.
- Illustrations are the weak point. A Professional Mariner report quoted an NMC official saying copyright permissions had to be reviewed before new illustrations could go on the web. That is a news report, not NMC policy, but it means some exam illustrations may not be federal works.
- Section 105 covers federal employees' work. Questions written by contractors or outside contributors may not be covered. Nothing found says who wrote the current questions.
- The NMC says it "does not provide specific examination content, only general subjects included on examinations with sample questions." The samples show the format and topics. They are not the live exam, and the app must not suggest they are.
- Public domain covers copyright only. Whether the app may name the Coast Guard, use its seal, or say its questions are "official" is a separate question for `counsel`.

Recommendation: reuse the question text of the Rules of the Road sample only after `counsel` signs off. Redraw every illustration rather than copying it. Write the academy's own questions for the bulk of each boss bank, and have `uscg-regs` tag each one with its rule number, as G10 already requires.

Sources not yet named above: NMC exams FAQ at https://www.dco.uscg.mil/Portals/9/NMC/pdfs/faq/exams_faq.pdf (not reached); 46 U.S.C. 7510 at https://uscode.house.gov/view.xhtml?req=granuleid%3AUSC-prelim-title46-section7510&num=0&edition=prelim (not reached); Professional Mariner reports at https://professionalmariner.com/?p=16280 and https://professionalmariner.com/coast-guard-to-resume-posting-full-archive-of-mariner-exam-questions-2/ (not reached, leads only).

Open questions:

- For `counsel`: may a commercial app reproduce NMC sample question text, and under what attribution?
- For the NMC: who writes the sample questions and draws the illustrations, and are any of them under third-party copyright?

## 4. Short and prolonged blasts (Rule 32)

Status: `unverified`. Confidence: high.

- A short blast is "a blast of about one second's duration".
- A prolonged blast is "a blast of from four to six seconds' duration".

The Inland and International definitions match word for word. The rule sets differ in how the blasts are used, not in their length. Under Inland Rule 34 one short blast means "I intend to leave you on my port side", a signal of intent. A commentary in the search results calls the International Rule 34 signals signals of action, not intent. This session did not see the International Rule 34 wording, so the game's horn-signal levels need their own check against both texts. Inland also has signals the International rules lack, such as one prolonged blast when leaving a dock or berth.

Sources:

- Inland: 33 CFR 83.32, https://www.ecfr.gov/current/title-33/chapter-I/subchapter-E/part-83/subpart-D/section-83.32, and https://www.law.cornell.edu/cfr/text/33/83.32. Not reached. Search summaries quote "about one second" and "four to six seconds" from both. The Federal Register notice of 28 August 2012, "Changes to the Inland Navigation Rules", carries the same wording (https://www.federalregister.gov/documents/2012/08/28/2012-18364/changes-to-the-inland-navigation-rules, not reached).
- International: COLREGS 1972, Rule 32. The IMO text was not found. The USCG amalgamated rules at https://navcen.uscg.gov/navigation-rules-amalgamated (not reached) and NOAA's U.S. Coast Pilot 8, Appendix A, dated 11 Oct 2026 (https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp8/CPB8_AppendixA_WEB.pdf, not reached) give the same lengths, per search summaries. Secondary copies of the wording: https://www.cultofsea.com/colregs/part-d-sound-and-light-signals-rules-32-37/rule-32-definitions/.

G16's figures are right. For the game:

- Play a short blast at 1 second.
- Play a prolonged blast at 5 seconds, so it sits in the middle of the legal range.
- A test should fail if a short blast runs past about 1.5 seconds or a prolonged blast falls outside 4 to 6 seconds.

## What this means for DECISIONS.md

These are suggestions for Bosun Larboard and Et. This file does not change the register.

- G10. The passing mark for the Rules of the Road boss is 90 percent, the same for OUPV, every Master under 100 GRT tonnage step, and Master or Mate under 200 GRT. Q100 has 50 questions, so a boss in exam format is 50 questions with 45 needed to pass. The other chapters' bosses pass at 70, except Chart Plotting at 90 (10 questions). The register should also stop calling the sample questions a bank. One sample exam per module is too few for two clean runs, so most boss questions must be written by the academy.
- G5. "Deck General and Safety" is one module for OUPV (Q170 or Q356) but two modules for Master under 100 GRT (Q160 and Q161, or Q347 and Q348). If chapters follow modules one for one, the Master license needs separate Deck General and Deck Safety chapters. Navigation General also differs by waters (Near Coastal against Great Lakes and Inland). Either split by waters or make the waters a level setting, as G6 does for the rule sets.
- G17. "100-Ton Exam Ready" covers 25, 50 and 100 GRT, because they share one exam. The OUPV to Master upgrade uses a single combined module (Q165 or Q352), so it needs its own badge mapping if the game offers one.
- G16. No change. A short blast is about 1 second and a prolonged blast 4 to 6 seconds, the same Inland and International.
- To verify before building. Keep all four items open until someone reads the primary pages directly. They are listed as unreached under each item. Add the sample-question reuse question to `counsel`'s list.
