# RADIX Talent Match — Role 3: Profile Builder

Participant Brief: **RADIX Talent Match Hackathon (October 2026)**  
Role: **Role 3: Profile Builder (Plain Code & Shared Data Contract)**  
Stack: **Python (FastAPI + Pydantic v2) + React (TypeScript + TailwindCSS + Lucide Icons)**  
UI Aesthetic: Inspired by the **Placement Hub Portal** (Slate/Navy theme, Inter + Outfit typography, 12-category tags).

---

## 🎯 Role Mission & Architecture

According to the Hackathon Participant Brief (Pages 8-10, 13):
- **Role 3 Mission**: Build a full candidate profile that goes beyond the resume — hackathons, internships, certifications, preferred roles, and a CV attachment.
- **Input**: Extracted signals from **Role 2 (Resume Parsing)** and **Role 1 (JD Analytics)**.
- **Output**: Canonical `candidate_profile.json` formatted strictly to the Shared Data Contract, unlocking **Role 4 (Talent Check)** and **Role 5 (Skill Matching)**.

### The 12 RADIX Skill Categories

Every skill is categorized with exactly one `category_code`:
1. `COD` - Coding (Python, C++, Java, TypeScript, Go)
2. `DSA` - Data Structures & Algorithms
3. `OOD` - Object-Oriented Design (SOLID, Patterns)
4. `APTI` - Quantitative & Logical Aptitude
5. `COMM` - Communication & Technical Presentation
6. `AI` - Artificial Intelligence & Machine Learning
7. `CLOUD` - Cloud & DevOps (AWS, GCP, Docker, Kubernetes)
8. `SQL` - SQL & Relational Databases
9. `SWE` - Software Engineering & Testing
10. `SYSD` - System Design & Distributed Systems
11. `NETW` - Networking & Protocols (TCP/IP, REST, WebSockets)
12. `OS` - Operating Systems & Concurrency (Linux, Threads, epoll)
- Anything outside these twelve uses `OTHER`.

---

## 🚀 Running the Project

### 1. Python Backend (FastAPI on Port 8000)
```powershell
python -m venv .venv
.venv\Scripts\activate          
pip install -r requirements.txt
Copy-Item .env.example .env      # macOS/Linux: cp .env.example .env  (then add GROQ_API_KEY)
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
```
Endpoints:
- `GET /api/health` — Health check & contract status
- `GET /api/profile` — Active candidate profile
- `POST /api/profile` — Save/update profile & updates canonical JSON
- `POST /api/profile/ingest-analytics` — Ingest inbound payload from Role 2 / Role 1
- `GET /api/contract/export` — Role 4 & Role 5 canonical handoff
- `GET /api/contract/download` — Download `candidate_profile.json`
- `GET /api/talent-check-bars` — Company skillset thresholds snapshot
- **`POST /api/resume/extract-skills`** — Upload a resume (PDF/DOCX/TXT) and extract skills via Groq LLM
- **`POST /api/jd/analyze`** — Role 1: upload a JD (PDF/DOCX/TXT) → skills in the shared format, with evidence and a 12-category demand profile (also `/api/jd/analyze-text`, `/api/jd/samples`)
- **`GET /api/jd/active/contract`** — Role 1 → Role 5 handoff: the active JD's skill list in the shared format
- **`POST /api/match`** — Role 5: match candidate skills against a JD skill list (score, matched, gaps)

### Role 4 — Talent Check

The Talent Check screen loads its company benchmarks from `GET /api/talent-check-bars`; it does not substitute a separate frontend dataset when the API is unavailable. Before display, each company must provide numeric thresholds from 1–10 for all 12 categories. The screen reports invalid or unavailable benchmark data instead of scoring against defaults.

Candidate category levels are transparent estimates from profile evidence, not measured test results: the score starts at 1, adds confidence-weighted documented skills and relevant profile entries, then rounds and caps at 10. Users can inspect the evidence and point contributions for each category. A benchmark requires at least three distinct supporting profile records across at least two categories. Readiness is the capped candidate points divided by the sum of company thresholds, shown as a percentage. Results can be downloaded as JSON.

JD Analytics design and LLM options: [docs/JD_ANALYTICS_PLAN.md](docs/JD_ANALYTICS_PLAN.md) · [docs/LLM_SETUP.md](docs/LLM_SETUP.md)

### 2. React Frontend (Vite on Port 5173)
```powershell
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 🤖 Groq LLM — Resume Skill Extraction Setup

The Resume Scanner uses **Groq** to extract skills intelligently from uploaded resumes using a hosted LLM.

### Step 1 — Obtain a Groq API Key

1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign in or create a free account.
3. Click **Create API key** and copy the key.

### Step 2 — Configure the Key Locally

Create a `.env` file in the project root (if it does not already exist):

```powershell
Copy-Item .env.example .env
```

Then open `.env` and fill in your key:

```
GROQ_API_KEY=gsk_your_actual_key_here
```

> ⚠️ **Never commit your real `.env` file to source control.**  
> The `.gitignore` already excludes it.

### Step 3 — Restart the Backend

After editing `.env`, restart the FastAPI server:

```powershell
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
```

`python-dotenv` automatically loads the `.env` file on startup.

### Step 4 — Test Resume Skill Extraction Locally

Upload any PDF, DOCX, or TXT resume on the **Resume Scanner** page in the UI, or call the endpoint directly:

```powershell
curl -X POST http://127.0.0.1:8000/api/resume/extract-skills `
  -F "file=@path\to\resume.pdf"
```

A successful response looks like:

```json
{
  "filename": "resume.pdf",
  "skills_extracted": 18,
  "profile": {
    "name": "Candidate Name",
    "email": "candidate@example.com",
    "phone": null,
    "education": "B.Sc. Computer Science",
    "institution": "Example University",
    "cgpa": null,
    "graduation_year": "2025",
    "linkedin": null,
    "github": "https://github.com/candidate",
    "portfolio": null,
    "summary": "Software engineering graduate focused on backend systems."
  },
  "skills": [
    {
      "skill_name": "React",
      "category_code": "SWE",
      "mention_type": "explicit",
      "confidence": "high",
      "evidence": "Built a real-time dashboard using React and TypeScript"
    }
  ],
  "experience": [],
  "hackathons": [],
  "achievements": [],
  "certifications": []
}
```

Extracted work history, competitions, achievements, and certifications are
transferred into their corresponding Profile Builder sections. Missing resume
details remain empty rather than being filled with guessed values.

**Troubleshooting:**
- HTTP 503 → `GROQ_API_KEY` is missing or empty — add it to `.env` and restart.
- HTTP 503 mentioning credentials → Groq rejected `GROQ_API_KEY`; verify the key locally and restart the backend.
- HTTP 503 mentioning the model → set `GROQ_MODEL` to an available Groq model or remove the override to use the service default, then restart.
- HTTP 503 mentioning rate limits → wait briefly and retry.
- HTTP 502 → the extraction model returned invalid output or an upstream error; check the backend terminal for the detailed exception.
- HTTP 504 → Groq timed out; retry with a smaller resume or try again later.
- HTTP 422 → the file has no readable text; scanned/image-only PDFs need OCR before upload.
- HTTP 415 → Unsupported file type — use PDF, DOCX, or TXT only.

---o


## 📦 Benchmark Candidates (Page 11 of the Brief)

1. **Ananya Rao**: Systems-leaning generalist (Strong fit for SWE, C++, Linux, Raft)
2. **Karthik Subramaniam**: Data-leaning analyst (Strong fit for Data Scientist / Analyst, Python, SQL, ML)
3. **Priya Menon**: Entry-level support-oriented (Best fit for Oracle Financial Services Software)
4. **Rohan Verma**: Strong all-rounder (Competitive across SWE, Cloud, AI, and Systems)

---

## 🔗 Shared Data Contract Output (`data/candidate_profile.json`)

```json
{
  "name": "Ananya Rao",
  "email": "ananya.rao@example.com",
  "education": "B.Tech in Computer Science and Engineering, 2024, CGPA 8.9 / 10.0",
  "skills": [
    {
      "skill_name": "C++",
      "category_code": "COD",
      "evidence": "Implemented custom memory allocators in C++17",
      "confidence": "high"
    }
  ],
  "hackathons": [...],
  "internships": [...],
  "certifications": [...],
  "preferred_roles": ["Software Engineer (SWE)"],
  "cv_file": "ananya_rao_resume.pdf"
}
```
