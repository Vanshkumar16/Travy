"""
Quality report for JD Analytics against hand-labelled gold skill sets.

    .venv/bin/python -m server.jd.evaluate            # auto engine
    .venv/bin/python -m server.jd.evaluate --engine rules

Gold labels list the skills a careful human reader would extract from each
sample JD, using taxonomy names. Implied prerequisites are excluded from
scoring: they're inferences, not extractions.
"""

import argparse
from typing import Dict, Set

from .pipeline import analyze_jd
from .store import list_samples, read_sample_text
from .taxonomy import canonicalize

GOLD: Dict[str, Set[str]] = {
    "google_swe": {
        "C++", "Java", "Go", "Python", "Data Structures & Algorithms", "Graphs & Dynamic Programming",
        "Complexity Analysis", "Operating Systems Fundamentals", "Concurrency & Multithreading", "Linux",
        "TCP/IP & Networking", "HTTP & Web Protocols", "Code Review & Code Quality", "Debugging",
        "Distributed Systems", "Microservices", "System Design", "Scalability & Performance", "SQL",
        "Relational Databases", "Google Cloud (GCP)", "Docker & Containers", "Kubernetes",
        "Software Testing", "CI/CD", "Technical Documentation", "Analytical Problem Solving",
        "Scalable System Design", "Stakeholder Management", "Cloud Platforms",
    },
    "google_ds": {
        "A/B Testing & Experimentation", "Machine Learning", "Python", "BigQuery / Data Warehousing", "SQL",
        "Statistics & Probability", "Quantitative Aptitude", "Pandas / NumPy", "scikit-learn",
        "Communication Skills", "Presentation & Data Storytelling", "Power BI / Tableau Dashboards",
        "Stakeholder Management", "Data-driven Decision Making", "PyTorch / TensorFlow", "R",
        "ETL & Data Pipelines", "Deep Learning",
    },
    "microsoft_swe": {
        "Azure", "C#", "Java", "TypeScript", "C++", "Python", "Microservices", "Object-Oriented Programming",
        "SOLID & Design Patterns", "Technical Documentation", "Code Review & Code Quality", "CI/CD",
        "Software Testing", "REST APIs & Web Services", "Relational Databases", "SQL",
        "Teamwork & Collaboration", "Data Structures & Algorithms", "Analytical & Logical Reasoning",
        "Git & Version Control", "Agile / Scrum", "Docker & Containers", "Kubernetes",
        "Infrastructure as Code", "Distributed Systems", "Scalability & Performance",
        "Production-quality Engineering",
    },
    "microsoft_da": {
        "SQL", "PL/SQL & Stored Procedures", "Power BI / Tableau Dashboards", "Data Querying & Integrity",
        "Data-driven Decision Making", "Stakeholder Management", "Python", "R", "Data Modeling",
        "Microsoft Excel", "Analytical & Logical Reasoning", "Communication Skills",
        "Presentation & Data Storytelling", "Azure", "BigQuery / Data Warehousing",
        "Statistics & Probability", "A/B Testing & Experimentation", "Troubleshooting & Root Cause Analysis",
        "Cross-functional Collaboration",
    },
    "ofss_ase": {
        "Java", "PL/SQL & Stored Procedures", "SQL", "Relational Databases", "Transactions & ACID",
        "Object-Oriented Programming", "SOLID & Design Patterns", "Software Testing", "Debugging",
        "Technical Documentation", "Agile / Scrum", "Data Structures & Algorithms", "Linux",
        "Communication Skills", "Spring Boot", "REST APIs & Web Services", "Git & Version Control",
        "Banking & Financial Domain", "Teamwork & Collaboration", "Query Optimization & Indexing",
    },
    "ofss_asa": {
        "Batch Processing", "Production Support & Incident Management", "Troubleshooting & Root Cause Analysis",
        "Log Analysis", "Linux", "SQL", "Relational Databases", "Communication Skills",
        "Technical Documentation", "Shell Scripting", "Java", "Analytical & Logical Reasoning",
        "Banking & Financial Domain", "Stakeholder Management",
    },
}


def _canon(name: str) -> str:
    tech = canonicalize(name)
    return tech.name if tech else name


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", default="auto", choices=["auto", "llm", "rules"])
    args = parser.parse_args()

    total_tp = total_fp = total_fn = 0
    print(f"{'JD':<15} {'engine':<10} {'pred':>4} {'gold':>4} {'P':>6} {'R':>6} {'F1':>6}")
    for sample in list_samples():
        gold = GOLD.get(sample["id"])
        if not gold:
            continue
        analysis = analyze_jd(read_sample_text(sample["id"]), sample["file"], args.engine)
        predicted = {_canon(s.skill_name) for s in analysis.skills if not s.implied_by}
        tp = len(predicted & gold)
        fp = len(predicted - gold)
        fn = len(gold - predicted)
        total_tp, total_fp, total_fn = total_tp + tp, total_fp + fp, total_fn + fn
        p = tp / (tp + fp) if tp + fp else 0.0
        r = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * p * r / (p + r) if p + r else 0.0
        print(f"{sample['id']:<15} {analysis.engine_used:<10} {len(predicted):>4} {len(gold):>4} {p:>6.2f} {r:>6.2f} {f1:>6.2f}")
        if fp:
            print(f"{'':<15}   extra:   {sorted(predicted - gold)}")
        if fn:
            print(f"{'':<15}   missed:  {sorted(gold - predicted)}")

    p = total_tp / (total_tp + total_fp) if total_tp + total_fp else 0.0
    r = total_tp / (total_tp + total_fn) if total_tp + total_fn else 0.0
    f1 = 2 * p * r / (p + r) if p + r else 0.0
    print(f"\nMICRO-AVERAGE   precision {p:.2f}  recall {r:.2f}  F1 {f1:.2f}")


if __name__ == "__main__":
    main()
