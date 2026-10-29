import { Skill, CategoryCode } from "../types/contract";

export interface JobDescription {
  id: string;
  company: string;
  role: string;
  location: string;
  work_mode: string;
  overview: string;
  key_responsibilities: string[];
  qualifications: string[];
  skills_required: Skill[];
  ideal_candidate_summary: string;
}

export const SAMPLE_JOB_DESCRIPTIONS: Record<string, JobDescription> = {
  "google-swe": {
    id: "google-swe",
    company: "Google LLC",
    role: "Software Engineer (SWE)",
    location: "Bengaluru, India",
    work_mode: "Hybrid",
    overview:
      "Join Google's core engineering organization in Bengaluru. Build distributed, high-throughput systems that power search, cloud infrastructure, and developer ecosystems used by billions of people worldwide.",
    key_responsibilities: [
      "Design, implement, and maintain distributed backend microservices in C++, Go, or Java.",
      "Optimize low-level systems for ultra-low latency, thread safety, and resource efficiency on Linux.",
      "Solve complex algorithmic problems involving graphs, dynamic programming, and scalable memory caching.",
      "Participate in design reviews, architectural RFCs, and maintain comprehensive automated test suites."
    ],
    qualifications: [
      "B.Tech/B.E. or equivalent degree in Computer Science or related STEM field.",
      "Solid proficiency in C++, Go, Java, or Python with deep algorithmic problem solving abilities.",
      "Experience with concurrent programming, POSIX threads, and networking protocols (TCP/IP, gRPC).",
      "Demonstrated ability to architect scalable systems handling high request volume."
    ],
    ideal_candidate_summary:
      "Systems-leaning engineer with mastery in DSA (trees, graphs), C++/Go, Linux internals, and scalable distributed architectures.",
    skills_required: [
      {
        skill_name: "C++ or Go",
        category_code: "COD",
        evidence: "Primary systems implementation language for high-throughput services",
        confidence: "high"
      },
      {
        skill_name: "Advanced Data Structures & Algorithms",
        category_code: "DSA",
        evidence: "Essential for core indexing, sorting, and algorithmic efficiency at planetary scale",
        confidence: "high"
      },
      {
        skill_name: "Distributed Systems & Scalability",
        category_code: "SYSD",
        evidence: "Required to architect fault-tolerant distributed services and storage layers",
        confidence: "high"
      },
      {
        skill_name: "Linux Internals & Concurrency",
        category_code: "OS",
        evidence: "Thread pools, memory paging, asynchronous I/O (epoll), and POSIX signals",
        confidence: "high"
      },
      {
        skill_name: "Networking & RPC Protocols",
        category_code: "NETW",
        evidence: "TCP/IP framing, gRPC, and protocol buffer serialization",
        confidence: "high"
      },
      {
        skill_name: "Software Engineering & Testing",
        category_code: "SWE",
        evidence: "Rigorous unit testing, continuous integration, and clean code hygiene",
        confidence: "high"
      },
      {
        skill_name: "Object-Oriented Design (SOLID)",
        category_code: "OOD",
        evidence: "Designing modular, extensible components with clean interfaces",
        confidence: "medium"
      }
    ]
  },

  "google-ds": {
    id: "google-ds",
    company: "Google LLC",
    role: "Data Scientist",
    location: "Bengaluru, India",
    work_mode: "Hybrid",
    overview:
      "Work with cross-functional product and engineering teams at Google to analyze petabyte-scale telemetry, design statistically rigorous experiments, and develop machine learning models.",
    key_responsibilities: [
      "Design and evaluate complex A/B experiments and causal inference models.",
      "Build predictive models and machine learning pipelines using Python, PyTorch, and BigQuery.",
      "Extract actionable product insights and present findings to engineering and product leaders."
    ],
    qualifications: [
      "Degree in Data Science, Statistics, Computer Science, or quantitative discipline.",
      "High proficiency in Python (NumPy, Pandas, Scikit-Learn) and advanced SQL.",
      "Hands-on experience in machine learning, statistical hypothesis testing, and data storytelling."
    ],
    ideal_candidate_summary:
      "Data-driven specialist with strong mathematical aptitude, statistical modeling, ML experience, and clear technical communication.",
    skills_required: [
      {
        skill_name: "Python for Data Science",
        category_code: "COD",
        evidence: "Core scripting language for statistical modeling, EDA, and ETL workflows",
        confidence: "high"
      },
      {
        skill_name: "Machine Learning & Deep Learning",
        category_code: "AI",
        evidence: "Supervised and unsupervised modeling, gradient boosting, and neural networks",
        confidence: "high"
      },
      {
        skill_name: "Statistical Inference & A/B Testing",
        category_code: "APTI",
        evidence: "Hypothesis testing, sample sizing, power analysis, and experiment evaluation",
        confidence: "high"
      },
      {
        skill_name: "BigQuery & Advanced SQL",
        category_code: "SQL",
        evidence: "Querying petabyte-scale analytics datasets with complex aggregations and windowing",
        confidence: "high"
      },
      {
        skill_name: "Technical Communication & Presentation",
        category_code: "COMM",
        evidence: "Translating ambiguous data signals into executive summaries and visual dashboards",
        confidence: "high"
      }
    ]
  },

  "microsoft-swe": {
    id: "microsoft-swe",
    company: "Microsoft Corporation",
    role: "Software Engineer",
    location: "Hyderabad, India",
    work_mode: "Hybrid",
    overview:
      "Join the Microsoft Cloud & AI team in Hyderabad. Build secure, enterprise-grade cloud services and productivity platforms powering millions of organizations globally.",
    key_responsibilities: [
      "Develop reliable cloud microservices deployed on Azure using C#, Java, or TypeScript.",
      "Design clean object-oriented domain models adhering to SOLID principles.",
      "Implement robust CI/CD pipelines and infrastructure-as-code automation."
    ],
    qualifications: [
      "B.Tech in Computer Science or related degree.",
      "Strong coding foundation in C#, Java, Python, or TypeScript.",
      "Experience with cloud architectures (Azure/AWS), databases, and RESTful APIs."
    ],
    ideal_candidate_summary:
      "Balanced engineer with strong software engineering practices, cloud architecture experience, solid OOP, and reliable problem-solving.",
    skills_required: [
      {
        skill_name: "Object-Oriented Programming (C#/Java/Python)",
        category_code: "COD",
        evidence: "Implementing robust modular backend services and API contracts",
        confidence: "high"
      },
      {
        skill_name: "Object-Oriented Design (SOLID)",
        category_code: "OOD",
        evidence: "Clean component architecture, dependency injection, and modular design",
        confidence: "high"
      },
      {
        skill_name: "Cloud & DevOps (Azure/AWS)",
        category_code: "CLOUD",
        evidence: "Building and deploying containerized microservices into cloud environments",
        confidence: "high"
      },
      {
        skill_name: "Relational Databases & SQL",
        category_code: "SQL",
        evidence: "Relational schema design, transactions, indexing, and ORM integration",
        confidence: "high"
      },
      {
        skill_name: "Software Engineering & CI/CD",
        category_code: "SWE",
        evidence: "Unit testing, integration testing, and automated deployment pipelines",
        confidence: "high"
      },
      {
        skill_name: "Data Structures & Algorithms",
        category_code: "DSA",
        evidence: "Efficient memory and time complexity for application workflows",
        confidence: "medium"
      }
    ]
  },

  "microsoft-da": {
    id: "microsoft-da",
    company: "Microsoft Corporation",
    role: "Data Analyst",
    location: "Hyderabad, India",
    work_mode: "Hybrid",
    overview:
      "Transform business data into intelligent insights for Microsoft's cloud customer operations. Design dashboards, manage data warehousing workflows, and track key performance metrics.",
    key_responsibilities: [
      "Write advanced SQL queries and stored procedures to transform raw business data.",
      "Build high-impact Power BI and Tableau dashboards for leadership review.",
      "Collaborate with engineering teams to validate data integrity across pipelines."
    ],
    qualifications: [
      "Bachelor's degree in Analytics, Computer Science, Economics, or related field.",
      "Strong proficiency in SQL, Power BI, Excel, and introductory Python/R.",
      "Excellent communication and presentation skills."
    ],
    ideal_candidate_summary:
      "Analyst with strong SQL proficiency, dashboard design capabilities, and business storytelling skills.",
    skills_required: [
      {
        skill_name: "Advanced SQL & Data Modeling",
        category_code: "SQL",
        evidence: "Writing complex CTEs, window functions, and maintaining data views",
        confidence: "high"
      },
      {
        skill_name: "Data Visualization & Dashboards (Power BI)",
        category_code: "COMM",
        evidence: "Designing interactive visual executive dashboards and stakeholder reporting",
        confidence: "high"
      },
      {
        skill_name: "Analytical & Quantitative Reasoning",
        category_code: "APTI",
        evidence: "Investigating data discrepancies and conducting exploratory cohort analysis",
        confidence: "high"
      },
      {
        skill_name: "Python Scripting for ETL",
        category_code: "COD",
        evidence: "Automating data cleaning and ingestion routines",
        confidence: "medium"
      }
    ]
  },

  "oracle-ase": {
    id: "oracle-ase",
    company: "Oracle Financial Services Software",
    role: "Associate Software Engineer",
    location: "Bengaluru / Mumbai, India",
    work_mode: "Onsite",
    overview:
      "Build mission-critical core banking and financial technology solutions used by the world's leading tier-1 financial institutions.",
    key_responsibilities: [
      "Develop enterprise Java components and database procedures for financial transaction processing.",
      "Optimize Oracle SQL queries for ACID transactional safety and high reliability.",
      "Write unit tests and support integration testing across banking product modules."
    ],
    qualifications: [
      "B.Tech in Computer Science, IT, or related engineering branch.",
      "Proficiency in Core Java, Object-Oriented principles, and SQL.",
      "Basic understanding of Linux environments and relational databases."
    ],
    ideal_candidate_summary:
      "Reliable software engineer with solid foundations in Java, relational databases, transaction management, and teamwork.",
    skills_required: [
      {
        skill_name: "Core Java & OOP",
        category_code: "COD",
        evidence: "Building reliable enterprise backend services and business logic",
        confidence: "high"
      },
      {
        skill_name: "Oracle SQL & Relational Databases",
        category_code: "SQL",
        evidence: "Writing relational queries, understanding ACID transactions and locks",
        confidence: "high"
      },
      {
        skill_name: "Object-Oriented Design (OOD)",
        category_code: "OOD",
        evidence: "Class modeling, interfaces, and design patterns in enterprise software",
        confidence: "medium"
      },
      {
        skill_name: "Software Testing & QA",
        category_code: "SWE",
        evidence: "Writing unit test cases with JUnit and validating business scenarios",
        confidence: "medium"
      },
      {
        skill_name: "Technical Communication",
        category_code: "COMM",
        evidence: "Clear documentation, code comments, and team collaboration",
        confidence: "medium"
      }
    ]
  },

  "oracle-asa": {
    id: "oracle-asa",
    company: "Oracle Financial Services Software",
    role: "Application Support Analyst",
    location: "Bengaluru / Chennai, India",
    work_mode: "Onsite",
    overview:
      "Deliver enterprise application support for global banking customers. Triage production incidents, investigate SQL data issues, and ensure strict SLA adherence.",
    key_responsibilities: [
      "Monitor banking batch processing jobs and troubleshoot production exceptions.",
      "Analyze application logs on Linux servers and execute diagnostic SQL queries.",
      "Communicate clearly with financial clients during incident triage and resolution."
    ],
    qualifications: [
      "Degree in Computer Science, IT, or related technical field.",
      "Working knowledge of SQL queries, Linux shell basics, and ITIL practices.",
      "Strong analytical troubleshooting mindset and client communication skills."
    ],
    ideal_candidate_summary:
      "Support-oriented engineer who excels in incident troubleshooting, SQL data fixes, Linux CLI, and patient customer communication.",
    skills_required: [
      {
        skill_name: "SQL Queries & Data Troubleshooting",
        category_code: "SQL",
        evidence: "Investigating data discrepancies and writing diagnostic queries in Oracle DB",
        confidence: "high"
      },
      {
        skill_name: "Customer Communication & Incident Management",
        category_code: "COMM",
        evidence: "Drafting clear root cause analysis (RCA) and interfacing with banking clients",
        confidence: "high"
      },
      {
        skill_name: "Linux Shell & Log Triage",
        category_code: "OS",
        evidence: "Navigating server directories, grepping application logs, and checking process status",
        confidence: "high"
      },
      {
        skill_name: "Logical Problem Solving",
        category_code: "APTI",
        evidence: "Systematic elimination of potential causes during priority incidents",
        confidence: "high"
      },
      {
        skill_name: "Basic Java / Application Understanding",
        category_code: "COD",
        evidence: "Reading stack traces and understanding application error logs",
        confidence: "medium"
      }
    ]
  }
};
