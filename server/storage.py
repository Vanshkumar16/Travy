"""
RADIX Talent Match Hackathon — Role 3 Storage Layer
Handles JSON persistence, canonical candidate_profile.json export,
and seed profiles for the 4 hackathon benchmark candidates.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from .models import CandidateProfile, ExtractedSkillListInput

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PROFILES_DIR = DATA_DIR / "profiles"
CANONICAL_OUTPUT_PATH = DATA_DIR / "candidate_profile.json"
COMPANY_SKILLSETS_PATH = DATA_DIR / "talent_check_company_skillsets.json"

# In-memory candidate storage with file backing
_PROFILES_CACHE: Dict[str, CandidateProfile] = {}
_ACTIVE_PROFILE_ID: str = "ananya"

def init_storage():
    """Ensure data directories and default profiles exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROFILES_DIR.mkdir(parents=True, exist_ok=True)

    # Initialize benchmark candidates if profiles directory is empty
    existing_files = list(PROFILES_DIR.glob("*.json"))
    if not existing_files:
        _seed_benchmark_candidates()
    else:
        for p_file in existing_files:
            try:
                data = json.loads(p_file.read_text(encoding="utf-8"))
                profile = CandidateProfile(**data)
                p_id = profile.id or p_file.stem
                _PROFILES_CACHE[p_id] = profile
            except Exception as e:
                print(f"Error loading {p_file}: {e}")

    # Set canonical file if not present
    if not CANONICAL_OUTPUT_PATH.exists() and "ananya" in _PROFILES_CACHE:
        save_canonical_profile(_PROFILES_CACHE["ananya"])

def get_active_profile() -> CandidateProfile:
    global _ACTIVE_PROFILE_ID
    if _ACTIVE_PROFILE_ID in _PROFILES_CACHE:
        return _PROFILES_CACHE[_ACTIVE_PROFILE_ID]
    if _PROFILES_CACHE:
        first_id = next(iter(_PROFILES_CACHE))
        _ACTIVE_PROFILE_ID = first_id
        return _PROFILES_CACHE[first_id]
    return _create_default_profile()

def set_active_profile(candidate_id: str) -> Optional[CandidateProfile]:
    global _ACTIVE_PROFILE_ID
    if candidate_id in _PROFILES_CACHE:
        _ACTIVE_PROFILE_ID = candidate_id
        save_canonical_profile(_PROFILES_CACHE[candidate_id])
        return _PROFILES_CACHE[candidate_id]
    return None

def list_profiles() -> List[Dict[str, Any]]:
    results = []
    for p_id, p in _PROFILES_CACHE.items():
        results.append({
            "id": p_id,
            "name": p.name,
            "email": p.email,
            "education": p.education,
            "skills_count": len(p.skills),
            "hackathons_count": len(p.hackathons),
            "internships_count": len(p.internships),
            "certifications_count": len(p.certifications),
            "preferred_roles": p.preferred_roles,
            "is_active": p_id == _ACTIVE_PROFILE_ID,
            "last_updated": p.last_updated
        })
    return results

def get_profile_by_id(candidate_id: str) -> Optional[CandidateProfile]:
    return _PROFILES_CACHE.get(candidate_id)

def save_profile(profile: CandidateProfile) -> CandidateProfile:
    p_id = profile.id or (profile.name.lower().replace(" ", "_") if profile.name else "candidate")
    profile.id = p_id
    profile.last_updated = datetime.now(timezone.utc).isoformat()
    
    _PROFILES_CACHE[p_id] = profile
    
    # Save to disk
    profile_path = PROFILES_DIR / f"{p_id}.json"
    profile_path.write_text(json.dumps(profile.model_dump(), indent=2), encoding="utf-8")
    
    # If active, update canonical output
    if p_id == _ACTIVE_PROFILE_ID or len(_PROFILES_CACHE) == 1:
        save_canonical_profile(profile)
        
    return profile

def save_canonical_profile(profile: CandidateProfile):
    """Write strictly formatted candidate profile for Role 4 & Role 5 consumption."""
    CANONICAL_OUTPUT_PATH.write_text(
        json.dumps(profile.model_dump(), indent=2), encoding="utf-8"
    )

def ingest_from_analytics(payload: ExtractedSkillListInput) -> CandidateProfile:
    """Pre-fills candidate profile from Role 2 Resume Parsing or Role 1 JD Analytics."""
    name = payload.name or "Parsed Candidate"
    p_id = name.lower().replace(" ", "_")

    existing = _PROFILES_CACHE.get(p_id) or _create_default_profile()

    existing.id = p_id
    existing.name = name
    if payload.email:
        existing.email = payload.email
    if payload.education:
        existing.education = payload.education
    if payload.source_file:
        existing.cv_file = payload.source_file

    # Merge or replace skills
    if payload.skills:
        # Avoid duplicate skill names
        seen = {s.skill_name.lower() for s in existing.skills}
        for s in payload.skills:
            if s.skill_name.lower() not in seen:
                existing.skills.append(s)
                seen.add(s.skill_name.lower())

    # Map internships from experience if present
    if payload.experience and not existing.internships:
        from .models import Internship
        for exp in payload.experience:
            existing.internships.append(Internship(
                id=f"int_{len(existing.internships)+1}",
                company=exp.get("company", "Company"),
                role=exp.get("role", "Intern"),
                duration=exp.get("duration", "3 months"),
                description=exp.get("description", ""),
                skills_used=[]
            ))

    if payload.hackathons:
        existing.hackathons = payload.hackathons

    if payload.certifications:
        existing.certifications = payload.certifications

    return save_profile(existing)

def get_company_skillsets() -> Dict[str, Any]:
    if COMPANY_SKILLSETS_PATH.exists():
        try:
            return json.loads(COMPANY_SKILLSETS_PATH.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"Error reading {COMPANY_SKILLSETS_PATH}: {e}")
    return {}

def _create_default_profile() -> CandidateProfile:
    return CandidateProfile(
        id="candidate",
        name="Candidate Name",
        email="candidate@example.com",
        education="B.Tech Computer Science, 2024",
        skills=[],
        hackathons=[],
        internships=[],
        certifications=[],
        preferred_roles=["Software Engineer (SWE)"],
        last_updated=datetime.now(timezone.utc).isoformat()
    )

def _seed_benchmark_candidates():
    """Seed the 4 official candidates from Page 11 of the brief."""
    from .models import Skill, Hackathon, Internship, Certification

    # 1. Ananya Rao
    ananya = CandidateProfile(
        id="ananya",
        name="Ananya Rao",
        email="ananya.rao@example.com",
        phone="+91 98765 43210",
        education="B.Tech in Computer Science and Engineering, 2024, CGPA 8.9 / 10.0",
        institution="National Institute of Technology",
        cgpa="8.9",
        graduation_year="2024",
        linkedin="https://linkedin.com/in/ananya-rao-systems",
        github="https://github.com/ananyarao",
        portfolio="https://ananyarao.dev",
        summary="Systems-leaning software engineer passionate about distributed systems, networking protocols, and concurrent architectures.",
        skills=[
            Skill(skill_name="C++", category_code="COD", evidence="Implemented custom memory allocators and high-throughput thread pools in C++17", confidence="high"),
            Skill(skill_name="Go (Golang)", category_code="COD", evidence="Built microservices for distributed telemetry ingestion handling 40k req/sec", confidence="high"),
            Skill(skill_name="Data Structures & Tree Algorithms", category_code="DSA", evidence="Solved 450+ LeetCode problems; expert in B-trees and graph algorithms", confidence="high"),
            Skill(skill_name="Object-Oriented Design (SOLID)", category_code="OOD", evidence="Designed extensible event bus pattern adhering strictly to SOLID", confidence="high"),
            Skill(skill_name="Distributed Systems & Raft Consensus", category_code="SYSD", evidence="Engineered a fault-tolerant replicated log based on Raft protocol from scratch", confidence="high"),
            Skill(skill_name="Linux Internals & Concurrency", category_code="OS", evidence="In-depth understanding of epoll, POSIX threads, and memory paging", confidence="high"),
            Skill(skill_name="TCP/IP & Socket Programming", category_code="NETW", evidence="Developed custom binary TCP framing protocol with checksum verification", confidence="high"),
            Skill(skill_name="PostgreSQL & DB Optimization", category_code="SQL", evidence="Optimized complex query execution plans and index access methods", confidence="medium"),
            Skill(skill_name="Docker & Container Runtime", category_code="CLOUD", evidence="Built multi-stage Docker builds and debugged container cgroups", confidence="medium"),
            Skill(skill_name="Git & Automated CI/CD", category_code="SWE", evidence="Designed GitHub Actions pipelines with linting, unit testing, and automated release tags", confidence="high"),
            Skill(skill_name="Technical Communication", category_code="COMM", evidence="Authored system architecture decision records (ADRs) and design docs", confidence="medium"),
            Skill(skill_name="Quantitative Problem Solving", category_code="APTI", evidence="Consistent 99th percentile scorer in competitive mathematical challenges", confidence="high"),
        ],
        hackathons=[
            Hackathon(id="h1", title="HackSystem 2024", role_or_project="Distributed Raft Key-Value Store", achievement="1st Place Winner (Best Systems Architecture)", skills_used=["Go", "Distributed Systems", "Raft", "gRPC"], year="2024", link="https://github.com/ananyarao/raft-kv"),
            Hackathon(id="h2", title="OpenHack Global", role_or_project="High-Performance TCP Load Balancer", achievement="Finalist (Top 10 out of 180 teams)", skills_used=["C++", "epoll", "TCP/IP", "Linux"], year="2023", link="https://github.com/ananyarao/turbo-lb"),
        ],
        internships=[
            Internship(id="i1", company="HighLoad Systems Corp", role="Systems Engineering Intern", duration="Jan 2024 - Jun 2024 (6 months)", description="Profiled lock contention in core storage engine using perf, reducing tail latency by 28%. Wrote automated stress test harnesses in Go.", skills_used=["C++", "Go", "Linux perf", "System Design"]),
        ],
        certifications=[
            Certification(id="c1", name="Linux Foundation Certified System Administrator (LFCS)", issuer="Linux Foundation", issue_date="Nov 2023", credential_id_or_url="LFCS-892147-SYS"),
        ],
        preferred_roles=["Software Engineer (SWE)", "Associate Software Engineer"],
        preferred_companies=["Google LLC", "Microsoft Corporation"],
        preferred_mode="Hybrid",
        cv_file="ananya_rao_resume.pdf",
        cv_uploaded_at=datetime.now(timezone.utc).isoformat(),
        last_updated=datetime.now(timezone.utc).isoformat()
    )

    # 2. Karthik Subramaniam
    karthik = CandidateProfile(
        id="karthik",
        name="Karthik Subramaniam",
        email="karthik.subramaniam@example.com",
        phone="+91 97654 32109",
        education="B.Tech in Information Technology & Data Science, 2024, CGPA 8.6 / 10.0",
        institution="Vellore Institute of Technology",
        cgpa="8.6",
        graduation_year="2024",
        linkedin="https://linkedin.com/in/karthik-subramaniam-data",
        github="https://github.com/karthiksubramaniam",
        portfolio="https://karthikdata.me",
        summary="Data-leaning analyst and ML practitioner skilled in predictive modeling, statistical inference, complex SQL pipelines, and BI reporting.",
        skills=[
            Skill(skill_name="Python for Data Science", category_code="COD", evidence="Extensive experience with NumPy, Pandas, Scipy, and production ETL scripts", confidence="high"),
            Skill(skill_name="Advanced SQL & Database Modeling", category_code="SQL", evidence="Authored window functions, CTEs, and materialized aggregation views in PostgreSQL and Snowflake", confidence="high"),
            Skill(skill_name="Machine Learning & Predictive Modeling", category_code="AI", evidence="Trained XGBoost, LightGBM, and Random Forest models with hyperparameter tuning", confidence="high"),
            Skill(skill_name="Deep Learning & PyTorch", category_code="AI", evidence="Built LSTM and Transformer sentiment classification models with PyTorch", confidence="medium"),
            Skill(skill_name="Statistical Analysis & Hypothesis Testing", category_code="APTI", evidence="Conducted A/B test power analyses and ANOVA evaluations for product launches", confidence="high"),
            Skill(skill_name="Data Visualization & Dashboards", category_code="COMM", evidence="Built executive dashboards using Tableau and Streamlit, communicating findings clearly to stakeholders", confidence="high"),
            Skill(skill_name="Data Structures & Search Algorithms", category_code="DSA", evidence="Applied heaps, hash maps, and binary search trees for high-speed offline indexing", confidence="medium"),
            Skill(skill_name="Cloud Data Engineering (GCP BigQuery)", category_code="CLOUD", evidence="Scheduled partitioned BigQuery jobs and managed Google Cloud Storage buckets", confidence="medium"),
            Skill(skill_name="Git & Collaborative Code Review", category_code="SWE", evidence="Collaborated via pull requests on shared ML feature store repository", confidence="medium"),
            Skill(skill_name="Object-Oriented Python Pipelines", category_code="OOD", evidence="Refactored raw notebook analysis into reusable modular transformer classes", confidence="medium"),
        ],
        hackathons=[
            Hackathon(id="h3", title="National Datathon 2025", role_or_project="Customer Churn Prediction Engine", achievement="2nd Place Winner (Best Predictive Accuracy)", skills_used=["Python", "XGBoost", "SHAP", "FastAPI"], year="2025", link="https://github.com/karthiksubramaniam/churn-prediction"),
        ],
        internships=[
            Internship(id="i2", company="QuantMetrics Analytics", role="Data Analyst Intern", duration="Jul 2023 - Dec 2023 (6 months)", description="Automated daily KPI reporting pipelines across 14 financial metrics. Reduced query costs by 34% by partitioning database tables.", skills_used=["SQL", "Python", "Tableau", "BigQuery"]),
        ],
        certifications=[
            Certification(id="c3", name="AWS Certified Data Analytics — Specialty", issuer="Amazon Web Services", issue_date="Jan 2024", credential_id_or_url="AWS-DAS-44910"),
        ],
        preferred_roles=["Data Scientist", "Data Analyst"],
        preferred_companies=["Google LLC", "Microsoft Corporation"],
        preferred_mode="Hybrid",
        cv_file="karthik_subramaniam_resume.pdf",
        cv_uploaded_at=datetime.now(timezone.utc).isoformat(),
        last_updated=datetime.now(timezone.utc).isoformat()
    )

    # 3. Priya Menon
    priya = CandidateProfile(
        id="priya",
        name="Priya Menon",
        email="priya.menon@example.com",
        phone="+91 96543 21098",
        education="B.Tech in Computer Science, 2025, CGPA 7.8 / 10.0",
        institution="JSS Academy of Technical Education",
        cgpa="7.8",
        graduation_year="2025",
        linkedin="https://linkedin.com/in/priya-menon-tech",
        github="https://github.com/priyamenon",
        portfolio="https://priyamenon.dev",
        summary="Dedicated, support-oriented engineer with solid foundations in Java, SQL relational queries, enterprise troubleshooting, and client communication.",
        skills=[
            Skill(skill_name="Core Java & OOP", category_code="COD", evidence="Developed multi-threaded Java batch processors and Spring Boot REST CRUD APIs", confidence="high"),
            Skill(skill_name="SQL & Relational Schema Support", category_code="SQL", evidence="Wrote complex join queries, stored procedures, and resolved lock escalations in Oracle DB", confidence="high"),
            Skill(skill_name="Technical Communication & Client Handling", category_code="COMM", evidence="Provided tier-2 support documentation and clear root cause analysis (RCA) to enterprise clients", confidence="high"),
            Skill(skill_name="Logical Reasoning & Incident Triage", category_code="APTI", evidence="Systematic troubleshooting of priority P1/P2 production incidents under strict SLA windows", confidence="high"),
            Skill(skill_name="Linux Shell Scripting & CLI", category_code="OS", evidence="Wrote Bash automation scripts for log rotation, disk space alerts, and process monitoring", confidence="medium"),
            Skill(skill_name="Basic Data Structures", category_code="DSA", evidence="Proficient in arrays, linked lists, hash tables, and queues for application logic", confidence="medium"),
            Skill(skill_name="Software Testing & QA", category_code="SWE", evidence="Wrote JUnit test suites and validated functional regression test cases before releases", confidence="high"),
            Skill(skill_name="HTTP/REST & Web Services", category_code="NETW", evidence="Integrated SOAP/REST financial web services and validated payload formats using Postman", confidence="medium"),
        ],
        hackathons=[
            Hackathon(id="h4", title="Campus Innovate Hackathon 2024", role_or_project="Automated Incident Escalation Bot", achievement="Special Mention (Most Practical Enterprise Utility)", skills_used=["Java", "SQL", "REST API", "Slack Webhooks"], year="2024", link="https://github.com/priyamenon/incident-escalator"),
        ],
        internships=[
            Internship(id="i3", company="Apex Financial Solutions", role="Application Support Intern", duration="Jun 2024 - Sep 2024 (4 months)", description="Monitored core banking batch jobs, resolved data discrepancy tickets via SQL, and drafted standard operating procedures (SOPs).", skills_used=["Oracle SQL", "Java", "Linux Shell", "ITIL"]),
        ],
        certifications=[
            Certification(id="c5", name="Oracle Certified Associate, Java SE 8 Programmer", issuer="Oracle Corporation", issue_date="Oct 2023", credential_id_or_url="OCA-JAVA-77124"),
            Certification(id="c6", name="ITIL Foundation Certificate in IT Service Management", issuer="PeopleCert / Axelos", issue_date="Mar 2024", credential_id_or_url="ITIL-2024-9918"),
        ],
        preferred_roles=["Application Support Analyst", "Associate Software Engineer"],
        preferred_companies=["Oracle Financial Services Software", "Microsoft Corporation"],
        preferred_mode="Onsite",
        cv_file="priya_menon_resume.docx",
        cv_uploaded_at=datetime.now(timezone.utc).isoformat(),
        last_updated=datetime.now(timezone.utc).isoformat()
    )

    # 4. Rohan Verma
    rohan = CandidateProfile(
        id="rohan",
        name="Rohan Verma",
        email="rohan.verma@example.com",
        phone="+91 95432 10987",
        education="B.Tech in Computer Science & Engineering, 2024, CGPA 9.2 / 10.0",
        institution="Indian Institute of Technology",
        cgpa="9.2",
        graduation_year="2024",
        linkedin="https://linkedin.com/in/rohan-verma-swe",
        github="https://github.com/rohanverma",
        portfolio="https://rohanverma.dev",
        summary="Competitive strong all-rounder with top-tier problem solving across backend architectures, full-stack development, modern AI agents, and cloud deployment.",
        skills=[
            Skill(skill_name="Python (FastAPI, Asyncio)", category_code="COD", evidence="Engineered scalable REST & GraphQL microservices handling 25k requests per second", confidence="high"),
            Skill(skill_name="TypeScript & React", category_code="COD", evidence="Developed responsive enterprise dashboards using React and TailwindCSS", confidence="high"),
            Skill(skill_name="Advanced DSA (Graphs, DP, Segment Trees)", category_code="DSA", evidence="Codeforces Candidate Master (1950+ rating); solved 750+ algorithmic challenges", confidence="high"),
            Skill(skill_name="System Design & Microservices", category_code="SYSD", evidence="Architected distributed caching layers with Redis cluster, Kafka message bus, and rate limiters", confidence="high"),
            Skill(skill_name="Cloud & DevOps (AWS & Kubernetes)", category_code="CLOUD", evidence="Deployed production microservices to EKS cluster with Helm, Terraform, and Prometheus alerts", confidence="high"),
            Skill(skill_name="PostgreSQL & Distributed DBs", category_code="SQL", evidence="Implemented horizontal sharding and optimized write-heavy workloads with index tuning", confidence="high"),
            Skill(skill_name="Software Engineering & Testing", category_code="SWE", evidence="Maintained 94% test coverage with PyTest, implemented strict trunk-based CI/CD", confidence="high"),
            Skill(skill_name="Object-Oriented Design (OOD)", category_code="OOD", evidence="Applied clean architecture and domain-driven design (DDD) patterns across codebases", confidence="high"),
            Skill(skill_name="Applied AI & LLM Orchestration", category_code="AI", evidence="Built RAG systems with LangChain, pgvector embeddings, and OpenAI function calling", confidence="high"),
            Skill(skill_name="Networking & Protocols (gRPC, WebSockets)", category_code="NETW", evidence="Built real-time collaboration engines using bi-directional WebSockets and Protocol Buffers", confidence="high"),
            Skill(skill_name="Operating Systems & Concurrency", category_code="OS", evidence="Developed lock-free concurrent queues and profiled CPU cache locality", confidence="high"),
            Skill(skill_name="Leadership & Technical Communication", category_code="COMM", evidence="Led university hackathon team of 6 engineers; delivered talks on distributed systems", confidence="high"),
            Skill(skill_name="Analytical & Quantitative Aptitude", category_code="APTI", evidence="Top 0.1% score in national engineering aptitude entrance examination", confidence="high"),
        ],
        hackathons=[
            Hackathon(id="h5", title="National Smart India Hackathon 2025", role_or_project="Autonomous AI Incident Triage Engine", achievement="1st Place Grand Winner (₹1,00,000 Cash Prize)", skills_used=["Python", "FastAPI", "React", "Kafka", "AWS"], year="2025", link="https://github.com/rohanverma/triage-ai"),
            Hackathon(id="h6", title="TGL Global Blitz 2024", role_or_project="Realtime Collaborative Canvas", achievement="Winner — Best Full-Stack Product", skills_used=["TypeScript", "WebSockets", "Go", "Docker"], year="2024", link="https://github.com/rohanverma/canvas-sync"),
        ],
        internships=[
            Internship(id="i4", company="TechScale Global", role="Software Engineering Intern", duration="May 2024 - Aug 2024 (4 months)", description="Built automated data ingestion pipelines handling 100M+ events daily. Cut query p99 latency from 1.2s to 180ms through Redis caching.", skills_used=["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"]),
        ],
        certifications=[
            Certification(id="c7", name="AWS Certified Solutions Architect — Associate", issuer="Amazon Web Services", issue_date="Dec 2023", credential_id_or_url="AWS-SAA-810923"),
            Certification(id="c8", name="Meta Certified Front-End Developer", issuer="Meta / Coursera", issue_date="May 2023", credential_id_or_url="META-FED-55102"),
        ],
        preferred_roles=["Software Engineer (SWE)", "Data Scientist", "Data Analyst"],
        preferred_companies=["Google LLC", "Microsoft Corporation", "Oracle Financial Services Software"],
        preferred_mode="Hybrid",
        cv_file="rohan_verma_allrounder_resume.pdf",
        cv_uploaded_at=datetime.now(timezone.utc).isoformat(),
        last_updated=datetime.now(timezone.utc).isoformat()
    )

    for p in [ananya, karthik, priya, rohan]:
        save_profile(p)
