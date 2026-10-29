# Role 1 — JD Analytics: Plan & Design

Owner: Role 1 (JD Analytics + Scrum Master)
Brief references: pp. 3, 7, 9–10, 12–13 of the RADIX Talent Match participant brief.

## 1. What the brief requires

| Requirement (brief) | How we meet it |
|---|---|
| Input: any JD as **PDF or DOCX** (p. 7) | `server/jd/document_loader.py` — PDF (pypdf), DOCX (python-docx, incl. tables), TXT/MD, or pasted text |
| Output: **structured skill list in the shared format** (p. 10) | `GET /api/jd/extractions/{id}/contract` returns exactly `{source_type:"jd", source_file, company, role, skills:[<skill>]}` |
| Every skill tagged with **one of 12 category codes or OTHER** (p. 9) | Pydantic `Literal` on `category_code`; contract validator rejects anything else |
| `<skill>` = `skill_name, category_code, evidence, confidence` (p. 9) | Same four fields, nothing renamed |
| **LLM extraction**, keyword matching alone misses prose (p. 7) | Claude (`claude-opus-5-5`, structured outputs) + a phrase-intent rule engine that catches prose like "explain findings to leadership" → COMM |
| Signal concentrated in **"Key Responsibilities" / "What We're Looking For"** (p. 7) | Section detector weights those sections highest; "Nice to have" / "About us" / "Benefits" weighted down |
| Hands off to **Skill Matching (Role 5)** (p. 10) | "Use for Job Match" sets the active JD in the UI; `/api/jd/active/contract` for backend consumers |
| Runs alone on **≥ 2 sample JDs** (p. 13 DoD) | All 6 sample JDs bundled; `python -m server.jd.evaluate` scores them against gold labels |

## 2. Pipeline

```
 PDF / DOCX / TXT / text
        │
        ▼
 document_loader  ── clean text, bullets normalised, page/table text kept
        │
        ▼
 sections         ── split into: overview · responsibilities · requirements ·
        │            preferred · company · benefits   (+ metadata: company, role,
        │            location, work mode, experience, education)
        ▼
 ┌──────────────┐   ┌───────────────────────────┐
 │ rule engine  │   │ Claude extractor (if key) │
 │ taxonomy +   │   │ structured output,        │
 │ intent cues  │   │ section-tagged prompt     │
 └──────┬───────┘   └────────────┬──────────────┘
        └──────────┬─────────────┘
                   ▼
 grounding / ensemble ── every evidence quote verified against the JD text;
                   │     ungrounded → confidence downgraded; LLM+rules agree → boosted
                   ▼
 demand profile   ── 12-category required level (1–10), same scale as the
                   │   Talent Check company bar
                   ▼
 insights         ── must-have vs nice-to-have, wishlist warning, prep focus
                   ▼
 persisted analysis  data/jd/extractions/<id>.json  +  strict contract export
```

## 3. What makes ours different

1. **Evidence-grounded extraction.** Every skill's `evidence` is a real quote from the JD, and the system checks it is really there. LLM hallucinations get caught and their confidence is downgraded.
2. **Hybrid engine (Claude + rules), not either/or.** With an API key, both engines run and their results are merged: when they agree, confidence goes up. Without a key the tool still works fully offline, so the live demo never depends on Wi-Fi.
3. **Section-aware importance.** Each skill is tagged `must_have` or `nice_to_have`, based on which section it came from and wording like "must", "strong" or "a plus".
4. **12-category demand profile.** The JD is turned into required levels from 1 to 10 per category. That is the same shape as `skill_thresholds`, so Talent Check and Skill Matching can use it directly. It is shown next to the company's general hiring bar ("this role asks for more SQL than Microsoft's average").
5. **Implied prerequisites.** For example, Kubernetes implies containers and Linux. These are shown separately and marked `low` confidence, so they never inflate must-haves.
6. **Explainability UI.** Click a skill and the sentence in the source JD that justified it is highlighted.
7. **Measured quality.** Precision and recall against hand-labelled gold sets for all 6 sample JDs (`server/jd/evaluate.py`) give a number we can quote in the presentation.

## 4. Shared data contract (locked v1)

Strict handoff (exactly the brief):
```json
{ "source_type": "jd", "source_file": "google_swe.pdf", "company": "Google LLC",
  "role": "Software Engineer", "skills": [
  { "skill_name": "C++", "category_code": "COD",
    "evidence": "Strong proficiency in at least one of C++, Java, Go or Python",
    "confidence": "high" } ] }
```
The extended analysis (`/api/jd/extractions/{id}`) adds `importance`, `source_section`, `implied_by`, `grounded`, `category_demand`, `metadata`, `insights`. These extras sit **alongside** the strict fields and never replace them, so consumers that only know the contract are unaffected.

## 5. API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/jd/engine` | Which engines are available (Claude key present?) |
| GET | `/api/jd/samples` | The 6 bundled sample JDs |
| POST | `/api/jd/samples/{id}/analyze` | Analyse a sample |
| POST | `/api/jd/analyze` | Multipart upload (PDF/DOCX/TXT) |
| POST | `/api/jd/analyze-text` | Pasted text |
| GET | `/api/jd/extractions` | History |
| GET | `/api/jd/extractions/{id}` | Full analysis |
| GET | `/api/jd/extractions/{id}/contract` | Strict shared-format skill list (Role 5 input) |
| POST | `/api/jd/extractions/{id}/activate` | Mark as the active JD |
| GET | `/api/jd/active/contract` | Active JD's strict skill list |

All analyse endpoints take `engine=auto|llm|rules` (default `auto`).

## 6. Milestones (for the tracker)

| # | Milestone | Definition of done |
|---|---|---|
| JD-1 | Extract from file | PDF + DOCX of ≥ 2 sample JDs produce a valid contract JSON |
| JD-2 | Integrated + measured | Active JD flows into Skill Matching; eval script reports P/R on all 6 |

## 7. Setup

```bash
cd tgl
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env            # optional: set ANTHROPIC_API_KEY to enable Claude
.venv/bin/python -m uvicorn server.main:app --port 8000 --reload
.venv/bin/python -m server.jd.evaluate          # quality report
```

**Sample JDs:** the official hackathon JD files weren't in the starter folder. `data/jd/samples/*.txt` are prose reconstructions of all 6 roles in the brief, and `data/jd/fixtures/` has PDF + DOCX renders of them for testing uploads (`scripts/make_jd_fixtures.py`). Drop the official files into `data/jd/samples/` with the same base names (`google_swe.pdf`, …) and they're used instead (PDF > DOCX > TXT).

## 8. Current quality (rule engine, no API key)

`python -m server.jd.evaluate` → micro precision **0.98**, recall **0.94**, F1 **0.96** over the 6 samples.

Caveat: the sample JDs, gold labels and taxonomy were written by the same person, so this number is a regression check, not proof of generalisation. Before the presentation, re-run it on the **official** JD files (and ideally 2–3 unseen JDs), adding gold labels for each. Claude extraction is implemented but untested against the live API until a key is configured; a simulated-response test verified the grounding and merge logic.
