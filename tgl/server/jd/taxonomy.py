"""
Skill taxonomy for the rule engine, mapped onto the 12 RADIX categories.

Two kinds of entries:
  * TECH   — named skills/technologies, matched by alias.
  * INTENT — prose patterns that state a competency without naming a
             technology ("explain findings to leadership" → COMM). These are
             what plain keyword matching misses (brief p. 7).

Category choices follow the team's sample data so Skill Matching compares
like with like (e.g. Power BI dashboards → COMM, REST APIs → NETW).
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Pattern, Tuple


@dataclass
class TechSkill:
    name: str
    category: str
    aliases: List[str]
    implies: List[Tuple[str, str]] = field(default_factory=list)
    case_sensitive: bool = False
    pattern: Optional[Pattern] = None


@dataclass
class IntentCue:
    name: str
    category: str
    regex: str
    pattern: Optional[Pattern] = None


def T(name, category, aliases, implies=(), case_sensitive=False):
    return TechSkill(name, category, list(aliases), list(implies), case_sensitive)


TECH: List[TechSkill] = [
    # ---- COD: languages & frameworks ----------------------------------------
    T("Python", "COD", [r"python"]),
    T("Java", "COD", [r"java(?!\s*script)", r"core java", r"j2ee", r"java se"]),
    T("C++", "COD", [r"c\+\+(?:1[147]|20)?"]),
    T("C", "COD", [r"C(?=/C\+\+)", r"C programming", r"C language"], case_sensitive=True),
    T("C#", "COD", [r"c#", r"c sharp"]),
    T("Go", "COD", [r"Golang", r"Go(?=\s*(?:\(|/|,|or\b|and\b))", r"Go(?= programming| language| microservices)"], case_sensitive=True),
    T("JavaScript", "COD", [r"javascript", r"ecmascript", r"es6"]),
    T("TypeScript", "COD", [r"typescript"]),
    T("Rust", "COD", [r"rust(?= |,|/)"], case_sensitive=False),
    T("Kotlin", "COD", [r"kotlin"]),
    T("Scala", "COD", [r"scala"]),
    T("R", "COD", [r"(?:(?<=/)|(?<=, )|(?<=or )|(?<=and )|(?<=with ))R\b", r"\bR(?=\s*[/,])", r"R programming", r"R language"], case_sensitive=True),
    T("HTML/CSS", "COD", [r"html5?", r"css3?"]),
    T("React", "COD", [r"react(?:\.?js)?(?! native)"], implies=[("JavaScript", "COD"), ("HTML/CSS", "COD")]),
    T("Next.js", "COD", [r"next\.?js"], implies=[("React", "COD"), ("JavaScript", "COD"), ("HTML/CSS", "COD")]),
    T("Vue.js", "COD", [r"vue(?:\.?js)?", r"nuxt(?:\.?js)?"], implies=[("JavaScript", "COD"), ("HTML/CSS", "COD")]),
    T("Svelte", "COD", [r"svelte(?:kit)?"], implies=[("JavaScript", "COD"), ("HTML/CSS", "COD")]),
    T("React Native", "COD", [r"react native"], implies=[("React", "COD"), ("JavaScript", "COD")]),
    T("Tailwind CSS", "COD", [r"tailwind(?:\s*css)?"], implies=[("HTML/CSS", "COD")]),
    T("Angular", "COD", [r"angular(?:js)?"], implies=[("TypeScript", "COD"), ("HTML/CSS", "COD")]),
    T("Node.js", "COD", [r"node\.?js", r"express\.?js"], implies=[("JavaScript", "COD")]),
    T("Spring Boot", "COD", [r"spring boot", r"spring framework", r"spring mvc"], implies=[("Java", "COD")]),
    T(".NET", "COD", [r"\.net(?: core)?", r"asp\.net"], implies=[("C#", "COD")]),
    T("Django / Flask / FastAPI", "COD", [r"django", r"flask", r"fastapi"], implies=[("Python", "COD")]),
    T("Pandas / NumPy", "COD", [r"pandas", r"numpy", r"scipy"], implies=[("Python", "COD")]),

    # ---- DSA -----------------------------------------------------------------
    T("Data Structures & Algorithms", "DSA", [
        r"data structures?(?: (?:and|&) algorithms?)?", r"algorithms?", r"\bdsa\b",
        r"algorithmic problem[- ]solving", r"competitive programming",
    ]),
    T("Complexity Analysis", "DSA", [r"time (?:and|&) space complexity", r"big[- ]o", r"complexity analysis"]),
    T("Graphs & Dynamic Programming", "DSA", [r"graph algorithms?", r"dynamic programming", r"trees? (?:and|&) graphs?", r"\bgraphs\b", r"\bdp\b", r"segment trees?"]),

    # ---- OOD -----------------------------------------------------------------
    T("Object-Oriented Programming", "OOD", [r"object[- ]oriented(?: programming| principles| concepts)?", r"\boops?\b"]),
    T("SOLID & Design Patterns", "OOD", [r"solid principles", r"\bsolid\b(?= principles| design)", r"design patterns?", r"gang of four"]),
    T("Low-Level / Class Design", "OOD", [r"low[- ]level design", r"class design", r"\buml\b", r"domain[- ]driven design", r"dependency injection"]),

    # ---- APTI ----------------------------------------------------------------
    T("Statistics & Probability", "APTI", [r"statistic(?:s|al)(?: analysis| modell?ing| methods| inference)?", r"probability", r"hypothesis testing", r"regression analysis"]),
    T("A/B Testing & Experimentation", "APTI", [r"a/b test(?:s|ing)?", r"experiment(?:ation| design)", r"causal inference", r"controlled experiments?"]),
    T("Quantitative Aptitude", "APTI", [r"quantitative(?: aptitude| reasoning| skills| analysis| discipline)?", r"mathematic(?:s|al)", r"linear algebra"]),
    T("Analytical & Logical Reasoning", "APTI", [r"analytical(?: thinking| skills| mindset| reasoning)?", r"logical reasoning", r"critical thinking", r"problem[- ]solving"]),

    # ---- COMM ----------------------------------------------------------------
    T("Communication Skills", "COMM", [r"communication skills?", r"(?:written|verbal) (?:and (?:written|verbal) )?communication", r"excellent communication", r"strong communication", r"communicat(?:e|ing) (?:clearly|effectively)", r"technical communication", r"client communication"]),
    T("Stakeholder Management", "COMM", [r"stakeholders?", r"client[- ]facing", r"customer[- ]facing"]),
    T("Presentation & Data Storytelling", "COMM", [r"presentation skills?", r"data storytelling", r"storytelling", r"present(?:ing)? (?:findings|insights|results)"]),
    T("Technical Documentation", "COMM", [r"technical (?:writing|documentation)", r"documentation", r"design docs?", r"runbooks?", r"\bsops?\b"]),
    T("Teamwork & Collaboration", "COMM", [r"team ?work", r"team player", r"collaborat(?:e|ion|ive|ing)", r"cross[- ]functional"]),
    T("Power BI / Tableau Dashboards", "COMM", [r"power ?bi", r"tableau", r"looker", r"dashboards?", r"data visuali[sz]ation"]),

    # ---- AI ------------------------------------------------------------------
    T("Machine Learning", "AI", [r"machine learning", r"\bml\b(?! engineer)", r"predictive model(?:s|ling|ing)?", r"supervised (?:and unsupervised )?learning", r"classification (?:and|&) regression"], implies=[("Statistics & Probability", "APTI"), ("Python", "COD")]),
    T("Deep Learning", "AI", [r"deep learning", r"neural networks?", r"transformers?(?= model| architecture)", r"\bcnns?\b", r"\brnns?\b|\blstms?\b"], implies=[("Machine Learning", "AI")]),
    T("PyTorch / TensorFlow", "AI", [r"pytorch", r"tensorflow", r"keras", r"\bjax\b"], implies=[("Deep Learning", "AI")]),
    T("scikit-learn", "AI", [r"scikit[- ]learn", r"sklearn", r"xgboost", r"lightgbm"], implies=[("Machine Learning", "AI")]),
    T("NLP / LLMs", "AI", [r"natural language processing", r"\bnlp\b", r"large language models?", r"\bllms?\b", r"generative ai", r"gen ?ai", r"langchain", r"\brag\b"]),
    T("Computer Vision", "AI", [r"computer vision", r"image recognition", r"opencv"]),
    T("MLOps", "AI", [r"mlops", r"model deployment", r"model serving", r"feature engineering", r"feature stores?"]),

    # ---- CLOUD ---------------------------------------------------------------
    T("AWS", "CLOUD", [r"\baws\b", r"amazon web services", r"\bec2\b", r"\bs3\b", r"lambda functions?"]),
    T("Azure", "CLOUD", [r"azure"]),
    T("Google Cloud (GCP)", "CLOUD", [r"\bgcp\b", r"google cloud(?: platform)?"]),
    T("Cloud Platforms", "CLOUD", [r"cloud (?:platforms?|services|computing|architectures?|infrastructure|native)", r"public cloud"]),
    T("Docker & Containers", "CLOUD", [r"docker", r"containers?(?:i[sz]ation|i[sz]ed)?"], implies=[("Linux", "OS")]),
    T("Kubernetes", "CLOUD", [r"kubernetes", r"\bk8s\b", r"\baks\b|\beks\b|\bgke\b", r"helm"], implies=[("Docker & Containers", "CLOUD"), ("Linux", "OS")]),
    T("Infrastructure as Code", "CLOUD", [r"terraform", r"infrastructure[- ]as[- ]code", r"\biac\b", r"ansible", r"cloudformation", r"bicep"]),
    T("Monitoring & Observability", "CLOUD", [r"prometheus", r"grafana", r"observability", r"datadog", r"monitoring (?:and|&) alerting"]),

    # ---- SQL -----------------------------------------------------------------
    T("SQL", "SQL", [r"\bsql\b", r"sql queries", r"advanced sql", r"t-sql"]),
    T("Relational Databases", "SQL", [r"(?:distributed|relational) dbs", r"relational databases?", r"rdbms", r"mysql", r"postgres(?:ql)?", r"oracle (?:db|database|sql)", r"sql server", r"database management"], implies=[("SQL", "SQL")]),
    T("PL/SQL & Stored Procedures", "SQL", [r"pl/sql", r"stored procedures?", r"triggers?(?= and| or|,)"], implies=[("SQL", "SQL")]),
    T("Query Optimization & Indexing", "SQL", [r"query (?:optimi[sz]ation|tuning|performance)", r"index(?:ing|es)", r"execution plans?"], implies=[("SQL", "SQL")]),
    T("Transactions & ACID", "SQL", [r"\bacid\b", r"transaction(?:al)? (?:management|safety|integrity|processing)", r"locking"]),
    T("Data Modeling", "SQL", [r"data model(?:l?ing)?", r"schema design", r"normali[sz]ation"]),
    T("NoSQL Databases", "SQL", [r"nosql", r"mongodb", r"cassandra", r"dynamodb", r"bigtable", r"cosmos ?db"]),
    T("BigQuery / Data Warehousing", "SQL", [r"bigquery", r"snowflake", r"redshift", r"data warehous(?:e|ing)", r"window functions?", r"\bctes?\b"], implies=[("SQL", "SQL")]),
    T("ETL & Data Pipelines", "SQL", [r"\betl\b", r"elt pipelines?", r"data pipelines?", r"airflow"]),
    T("Big Data (Spark / Hadoop)", "SQL", [r"apache spark", r"\bspark\b", r"pyspark", r"hadoop", r"databricks"]),

    # ---- SWE -----------------------------------------------------------------
    T("Git & Version Control", "SWE", [r"\bgit\b", r"github", r"gitlab", r"version control"]),
    T("CI/CD", "SWE", [r"ci/cd", r"continuous (?:integration|delivery|deployment)", r"jenkins", r"github actions", r"azure devops", r"build pipelines?"]),
    T("Software Testing", "SWE", [r"unit test(?:s|ing)?", r"integration test(?:s|ing)?", r"automated test(?:s|ing)?", r"test[- ]driven", r"\btdd\b", r"junit", r"pytest", r"testing frameworks?", r"regression test(?:s|ing)?", r"test cases?"]),
    T("Code Review & Code Quality", "SWE", [r"code reviews?", r"clean code", r"maintainable code", r"coding standards", r"best practices"]),
    T("Agile / Scrum", "SWE", [r"agile", r"scrum", r"kanban", r"sprints?", r"\bjira\b"]),
    T("Debugging", "SWE", [r"debugg?ing", r"debug"]),
    T("SDLC", "SWE", [r"\bsdlc\b", r"software development life ?cycle"]),
    T("Production Support & Incident Management", "SWE", [r"incident (?:management|triage|response|resolution)", r"production (?:support|incidents?|issues)", r"on[- ]call", r"\bitil\b", r"\bslas?\b", r"service management"]),

    # ---- SYSD ----------------------------------------------------------------
    T("System Design", "SYSD", [r"system design", r"systems design", r"software architecture", r"architect(?:ing)? (?:scalable|distributed|large)"]),
    T("Distributed Systems", "SYSD", [r"distributed (?:systems?|computing|storage|services)", r"consensus (?:algorithms?|protocols?)", r"\braft\b|\bpaxos\b", r"replication", r"fault[- ]toleran(?:t|ce)"]),
    T("Scalability & Performance", "SYSD", [r"scalab(?:le|ility)", r"high[- ]availability", r"low[- ]latency", r"high[- ]throughput", r"large[- ]scale", r"planet(?:ary)?[- ]scale", r"performance (?:tuning|optimi[sz]ation)"]),
    T("Microservices", "SYSD", [r"micro[- ]?services?", r"service[- ]oriented architecture", r"\bsoa\b"]),
    T("Caching & Messaging", "SYSD", [r"caching", r"redis", r"memcached", r"kafka", r"rabbitmq", r"message (?:queues?|brokers?)", r"pub/sub", r"event[- ]driven"]),

    # ---- NETW ----------------------------------------------------------------
    T("REST APIs & Web Services", "NETW", [r"rest(?:ful)? (?:apis?|services|web services)", r"web services", r"\bsoap\b", r"\bapis?\b"]),
    T("HTTP & Web Protocols", "NETW", [r"\bhttps?\b", r"websockets?", r"\bgrpc\b", r"protocol buffers"]),
    T("TCP/IP & Networking", "NETW", [r"tcp/ip", r"\btcp\b", r"\budp\b", r"networking", r"network protocols?", r"socket programming", r"sockets", r"\bdns\b", r"load balanc(?:er|ers|ing)"]),
    T("Network Security", "NETW", [r"network security", r"\btls\b|\bssl\b", r"firewalls?", r"oauth"]),

    # ---- OS ------------------------------------------------------------------
    T("Linux", "OS", [r"linux", r"unix", r"linux (?:environments?|servers?|internals)"]),
    T("Shell Scripting", "OS", [r"shell(?: scripting| scripts?| basics)?", r"\bbash\b", r"command[- ]line", r"\bcli\b"], implies=[("Linux", "OS")]),
    T("Concurrency & Multithreading", "OS", [r"concurren(?:cy|t)", r"multi[- ]?thread(?:ed|ing)", r"threads?", r"posix", r"synchroni[sz]ation", r"parallel(?:ism| programming)"]),
    T("Operating Systems Fundamentals", "OS", [r"operating systems?", r"memory management", r"process(?:es)? (?:management|scheduling)", r"kernel", r"file systems?", r"memory paging"]),
    T("Log Analysis", "OS", [r"application logs?", r"log (?:analysis|files)", r"server logs?", r"grep"]),

    # ---- OTHER ---------------------------------------------------------------
    T("Microsoft Excel", "OTHER", [r"\bexcel\b", r"spreadsheets?"]),
    T("Banking & Financial Domain", "OTHER", [r"core banking", r"banking (?:domain|products?|applications?|customers?|clients?)", r"financial services", r"fintech", r"payments domain"]),
    T("Batch Processing", "OTHER", [r"batch (?:jobs?|processing)"]),
]


INTENT: List[IntentCue] = [
    IntentCue("Stakeholder Communication", "COMM",
              r"\b(?:present|explain|communicat\w*|articulat\w*|translat\w*|shar\w*|walk)\b[^.\n]{0,70}\b(?:findings|insights|results|recommendations|leaders(?:hip)?|executives?|non[- ]technical|clients?|customers?|stakeholders?)\b"),
    IntentCue("Cross-functional Collaboration", "COMM",
              r"\bwork(?:ing)? (?:closely |hand in hand )?with\b[^.\n]{0,40}\b(?:product|design|engineering|business|cross[- ]functional|other teams|partner teams)\b"),
    IntentCue("Analytical Problem Solving", "APTI",
              r"\b(?:ambiguous|open[- ]ended|complex) (?:problems?|questions|data)|first principles|break (?:down )?(?:complex )?problems|structured thinking"),
    IntentCue("Troubleshooting & Root Cause Analysis", "APTI",
              r"\btroubleshoot\w*|root[- ]cause|diagnos\w+|investigat\w+ (?:issues|discrepancies|failures|incidents|anomalies)"),
    IntentCue("Data-driven Decision Making", "APTI",
              r"\b(?:metrics|kpis?|actionable insights|data[- ]driven|quantif\w+ (?:impact|the impact))\b"),
    IntentCue("Scalable System Design", "SYSD",
              r"\b(?:millions|billions|hundreds of millions) of (?:users|requests|customers|transactions|queries)|\bat scale\b|\b99\.9+%"),
    IntentCue("Algorithmic Efficiency", "DSA",
              r"\befficient (?:algorithms|solutions|code)|optimi[sz]e\w* (?:for )?(?:time|memory|performance)|solve hard (?:coding|algorithmic) problems"),
    IntentCue("Modular, Extensible Design", "OOD",
              r"\b(?:modular|extensible|reusable) (?:components|code|libraries|services|design)|clean abstractions|well[- ]designed (?:interfaces|abstractions)"),
    IntentCue("Production-quality Engineering", "SWE",
              r"\b(?:production[- ](?:quality|grade|ready)|well[- ]tested|high[- ]quality) (?:code|software|systems)|ship(?:ping)? (?:features|code) to production|own(?:ing)? features end[- ]to[- ]end"),
    IntentCue("Model Building & Evaluation", "AI",
              r"\b(?:build|train|develop|evaluate|deploy)\w*\b[^.\n]{0,30}\b(?:models|classifiers|forecasts?|recommenders?)\b"),
    IntentCue("Data Querying & Integrity", "SQL",
              r"\b(?:query|querying) (?:large )?(?:datasets?|data)|data (?:integrity|quality|consistency|discrepanc\w+)|(?:petabyte|terabyte)[- ]scale"),
    IntentCue("Systems-level Programming", "OS",
              r"\b(?:memory allocation|resource utili[sz]ation|cpu|i/o (?:bound|performance)|process (?:status|monitoring)|server health)\b"),
]


def _boundary(alias: str) -> str:
    # Word boundaries that also respect symbols in names like C++, C#, .NET.
    return rf"(?<![A-Za-z0-9+#]){alias}(?![A-Za-z0-9+#])"


for _tech in TECH:
    flags = 0 if _tech.case_sensitive else re.I
    _tech.pattern = re.compile("|".join(f"(?:{_boundary(a)})" for a in _tech.aliases), flags)

for _cue in INTENT:
    _cue.pattern = re.compile(_cue.regex, re.I)


TECH_BY_NAME: Dict[str, TechSkill] = {t.name.lower(): t for t in TECH}


def canonicalize(skill_name: str) -> Optional[TechSkill]:
    """Map a free-text skill name (e.g. from the LLM) onto a taxonomy entry."""
    lowered = skill_name.strip().lower()
    if lowered in TECH_BY_NAME:
        return TECH_BY_NAME[lowered]
    best: Optional[TechSkill] = None
    best_len = 0
    for tech in TECH:
        match = tech.pattern.search(skill_name)
        if match and (match.end() - match.start()) > best_len:
            # Only accept if the alias covers a meaningful part of the name,
            # so "Python for Data Science" → Python but "REST API design" isn't
            # forced into something unrelated.
            if (match.end() - match.start()) >= 0.35 * len(skill_name) or len(skill_name) <= 14:
                best, best_len = tech, match.end() - match.start()
    return best
