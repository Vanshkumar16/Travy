/**
 * RADIX Talent Match — Company Job Descriptions Dataset
 * Comprehensive collection of real-world hiring JDs across top tech companies,
 * illustrating how higher-level technologies automatically infer prerequisite foundations.
 */

export interface CompanyJdItem {
  id: string;
  company: string;
  role: string;
  location: string;
  workMode: "Hybrid" | "Remote" | "Onsite";
  experienceLevel: string;
  badgeColor: string;
  rawText: string;
}

export const COMPANY_JD_DATASET: CompanyJdItem[] = [
  {
    id: "meta-frontend",
    company: "Meta",
    role: "Senior React & Frontend Platform Engineer",
    location: "Bengaluru, India / Menlo Park, CA",
    workMode: "Hybrid",
    experienceLevel: "2-5 Years",
    badgeColor: "bg-blue-600 text-white",
    rawText: `Role: Senior React & Frontend Platform Engineer
Company: Meta
Location: Bengaluru, India
Work Mode: Hybrid

Overview:
Meta's UI Platform team is seeking an exceptional Frontend Engineer to build high-performance client applications and design systems utilized by billions of users across Facebook, Instagram, and WhatsApp.

Key Responsibilities:
• Build modular, scalable user interfaces using React, Next.js, and modern TypeScript.
• Optimize rendering lifecycles, virtual DOM reconciliation, and web vitals for low-latency client performance.
• Architect global client-side state management using Redux and reactive stores.
• Collaborate with designers and product managers to deliver accessible, responsive UI layouts.

Qualifications & Core Skills Required:
• Strong production experience developing applications in React and Next.js.
• Deep understanding of component lifecycles, hooks, and clean component-based architecture.
• Strong foundation in Data Structures and Algorithms for client-side tree traversal and graph manipulation.
• Experience with automated testing, CI/CD pipelines, and Git version control.
• Excellent technical communication and cross-functional team leadership.`,
  },

  {
    id: "google-systems",
    company: "Google LLC",
    role: "Distributed Infrastructure & Systems Software Engineer",
    location: "Bengaluru, India",
    workMode: "Hybrid",
    experienceLevel: "1-4 Years",
    badgeColor: "bg-emerald-600 text-white",
    rawText: `Role: Distributed Infrastructure & Systems Software Engineer
Company: Google LLC
Location: Bengaluru, India
Work Mode: Hybrid

Overview:
Google Core Infrastructure team is hiring engineers to build planetary-scale distributed storage and RPC frameworks powering Google Cloud, Search, and YouTube.

Key Responsibilities:
• Implement ultra-low latency, concurrent backend daemons in C++ and Go.
• Design fault-tolerant distributed consensus algorithms, distributed caching, and microservices.
• Profile Linux kernel memory allocation, thread contention, and network I/O buffers.
• Conduct thorough code reviews and maintain 99.999% system availability SLA.

Qualifications & Core Skills Required:
• Expertise in C++ systems programming and Go (Golang) microservices.
• Deep mastery of Data Structures & Algorithms (B-Trees, Graphs, Dynamic Programming).
• Strong hands-on understanding of Linux internals, concurrency, POSIX threads, and memory paging.
• Proficiency in network socket programming, TCP/IP, and gRPC protocols.
• Experience with large-scale relational or distributed databases.`,
  },

  {
    id: "openai-ai",
    company: "OpenAI",
    role: "Full-Stack AI Application Engineer",
    location: "San Francisco, CA / Remote",
    workMode: "Remote",
    experienceLevel: "1-3 Years",
    badgeColor: "bg-purple-600 text-white",
    rawText: `Role: Full-Stack AI Application Engineer
Company: OpenAI
Location: San Francisco, CA / Remote
Work Mode: Remote

Overview:
Help build the next generation of generative AI products and developer interfaces. You will connect frontier foundation models with responsive, delightful web applications.

Key Responsibilities:
• Build production inference pipelines and agentic backends using Python and FastAPI.
• Fine-tune and evaluate neural models using PyTorch and transformer embeddings.
• Develop real-time streaming user interfaces using Next.js, React, and WebSockets.
• Manage vector stores, relational databases (PostgreSQL), and caching layers.

Qualifications & Core Skills Required:
• Hands-on proficiency with PyTorch and Machine Learning fundamentals.
• Backend web development expertise with Python and FastAPI.
• Frontend proficiency with React and modern UI components.
• Strong foundation in SQL and relational database schema design.
• Analytical problem solving and ability to navigate fast-moving technological ambiguity.`,
  },

  {
    id: "microsoft-cloud",
    company: "Microsoft",
    role: "Azure Cloud Platform Engineer",
    location: "Hyderabad, India",
    workMode: "Hybrid",
    experienceLevel: "2-4 Years",
    badgeColor: "bg-sky-600 text-white",
    rawText: `Role: Azure Cloud Platform Engineer
Company: Microsoft
Location: Hyderabad, India
Work Mode: Hybrid

Overview:
Join the Microsoft Cloud & AI team in Hyderabad building mission-critical enterprise services, microservices orchestration, and resilient cloud automation on Azure.

Key Responsibilities:
• Architect containerized microservices deployed to Kubernetes clusters on Microsoft Azure.
• Implement enterprise backend services adhering strictly to Object-Oriented Design (SOLID) principles.
• Automate Infrastructure-as-Code using Docker, Kubernetes, and Azure Resource Manager.
• Design secure relational databases and transactional workflows in SQL Server / PostgreSQL.

Qualifications & Core Skills Required:
• Solid experience with Kubernetes orchestration and Docker containers.
• Deep knowledge of Cloud Computing principles on Azure or AWS.
• Solid background in Object-Oriented Design (OOD) and Clean Architecture.
• Strong competence in SQL, relational transactions, and database indexing.
• Experience with continuous integration pipelines and automated testing.`,
  },

  {
    id: "netflix-backend",
    company: "Netflix",
    role: "Senior High-Throughput Backend Engineer",
    location: "Los Gatos, CA / Remote",
    workMode: "Remote",
    experienceLevel: "3-6 Years",
    badgeColor: "bg-rose-600 text-white",
    rawText: `Role: Senior High-Throughput Backend Engineer
Company: Netflix
Location: Los Gatos, CA / Remote
Work Mode: Remote

Overview:
Netflix streaming platform delivers billions of hours of content monthly. We are looking for backend engineers to build event streaming, distributed caching, and media delivery backends.

Key Responsibilities:
• Build high-throughput event ingestion pipelines utilizing Apache Kafka and Go.
• Implement multi-region distributed caching layers using Redis.
• Architect resilient microservices capable of gracefully handling sudden traffic spikes.
• Maintain telemetry, automated failover mechanisms, and comprehensive test coverage.

Qualifications & Core Skills Required:
• High proficiency in Go (Golang) and concurrent backend architectures.
• In-depth expertise in Apache Kafka event-driven architectures and pub/sub streaming.
• Mastery of Redis distributed caching, eviction strategies, and in-memory structures.
• Strong system design skills for fault-tolerant microservices.
• Solid grasp of Linux networking, TCP, and HTTP protocols.`,
  },

  {
    id: "oracle-financial",
    company: "Oracle Financial Services",
    role: "Enterprise Banking Applications Developer",
    location: "Mumbai / Bengaluru, India",
    workMode: "Hybrid",
    experienceLevel: "1-3 Years",
    badgeColor: "bg-amber-600 text-white",
    rawText: `Role: Enterprise Banking Applications Developer
Company: Oracle Financial Services Software
Location: Mumbai / Bengaluru, India
Work Mode: Hybrid

Overview:
Oracle Financial Services Software (OFSS) powers core banking and global payment infrastructures for the world's leading financial institutions.

Key Responsibilities:
• Develop secure, transaction-heavy financial services using Spring Boot and Java.
• Design and maintain complex relational databases in PostgreSQL and Oracle DB.
• Ensure strict ACID transaction compliance, audit logging, and relational data normalization.
• Interface with enterprise clients to diagnose incidents and deliver reliable hotfixes.

Qualifications & Core Skills Required:
• Enterprise backend development experience with Spring Boot and Java.
• Strong mastery of SQL, stored procedures, execution plans, and relational indexing.
• Strong adherence to Object-Oriented Design (OOD) patterns and separation of concerns.
• Excellent technical communication and customer support mindset.
• Solid understanding of software engineering testing and release hygiene.`,
  },
];
