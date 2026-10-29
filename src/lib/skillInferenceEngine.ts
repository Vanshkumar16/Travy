/**
 * RADIX Talent Match — Skill Knowledge Graph & Prerequisite Deduction Engine
 * 
 * Implements intelligent skill inference:
 * When a higher-level technology or framework is detected in a Job Description or Resume
 * (e.g., React, Next.js, Django, Spring Boot, PyTorch, Kubernetes), this engine
 * automatically deduces foundational prerequisite skills (e.g., JavaScript, CSS, HTML,
 * Python, Java, Docker, Linux, SQL) and maps them cleanly into the 12 RADIX Competency Categories.
 */

import {
  AchievementEntry,
  CategoryCode,
  CertificationEntry,
  HackathonEntry,
  InternshipEntry,
  Skill,
  ConfidenceLevel,
} from "../types/contract";
import type { JdAnalysis } from "../types/jd";

export interface SkillDependencyRule {
  parentSkill: string;
  aliases: string[];
  category: CategoryCode;
  prerequisites: Array<{
    skill_name: string;
    category_code: CategoryCode;
    reason: string;
    confidence: ConfidenceLevel;
  }>;
}

/**
 * Knowledge Base of Skill Prerequisites & Foundation Dependencies
 */
export const SKILL_DEPENDENCY_RULES: SkillDependencyRule[] = [
  // 1. React & Modern Frontend
  {
    parentSkill: "React",
    aliases: ["react", "react.js", "reactjs", "react native"],
    category: "SWE",
    prerequisites: [
      {
        skill_name: "JavaScript (ES6+)",
        category_code: "COD",
        reason: "Core language prerequisite: React component state, closures, promises, and modern syntax require JavaScript mastery.",
        confidence: "high",
      },
      {
        skill_name: "CSS3 & Responsive Layouts",
        category_code: "SWE",
        reason: "Visual presentation prerequisite: React interfaces require styling with CSS Flexbox, Grid, and responsive media queries.",
        confidence: "high",
      },
      {
        skill_name: "HTML5 & DOM Manipulation",
        category_code: "SWE",
        reason: "Semantic document structure prerequisite: React JSX compiles directly to virtual DOM and browser DOM nodes.",
        confidence: "high",
      },
      {
        skill_name: "Component-Based Architecture",
        category_code: "OOD",
        reason: "Design prerequisite: Structuring modular UI into reusable, composable components with unidirectional data flow.",
        confidence: "high",
      },
      {
        skill_name: "Web APIs & Asynchronous Fetch",
        category_code: "NETW",
        reason: "Networking prerequisite: Connecting React components to backend APIs via Fetch/Axios and handling async lifecycles.",
        confidence: "medium",
      },
    ],
  },

  // 2. Next.js
  {
    parentSkill: "Next.js",
    aliases: ["next.js", "nextjs", "next 13", "next 14", "next 15"],
    category: "SWE",
    prerequisites: [
      {
        skill_name: "React",
        category_code: "SWE",
        reason: "Framework prerequisite: Next.js is built entirely on the React ecosystem.",
        confidence: "high",
      },
      {
        skill_name: "JavaScript (ES6+)",
        category_code: "COD",
        reason: "Foundation scripting language for React and Next.js applications.",
        confidence: "high",
      },
      {
        skill_name: "Server-Side Rendering (SSR) & Web Performance",
        category_code: "SYSD",
        reason: "Architecture prerequisite: Understanding hydration, SSR, SSG, and edge rendering pipelines.",
        confidence: "high",
      },
      {
        skill_name: "Node.js Runtime",
        category_code: "SWE",
        reason: "Server runtime prerequisite: Next.js backend routes and build pipelines execute on Node.js.",
        confidence: "high",
      },
    ],
  },

  // 3. Vue.js / Nuxt.js
  {
    parentSkill: "Vue.js",
    aliases: ["vue", "vue.js", "vuejs", "nuxt", "nuxt.js"],
    category: "SWE",
    prerequisites: [
      {
        skill_name: "JavaScript (ES6+)",
        category_code: "COD",
        reason: "Core language prerequisite for Vue reactivity, composition API, and templates.",
        confidence: "high",
      },
      {
        skill_name: "CSS3 & HTML5",
        category_code: "SWE",
        reason: "Single File Component (SFC) prerequisite for scoped styling and template structure.",
        confidence: "high",
      },
      {
        skill_name: "Reactive State Management",
        category_code: "SWE",
        reason: "Architectural prerequisite for Vue Pinia/Vuex and reactive data models.",
        confidence: "high",
      },
    ],
  },

  // 4. Angular
  {
    parentSkill: "Angular",
    aliases: ["angular", "angularjs", "angular 2+"],
    category: "SWE",
    prerequisites: [
      {
        skill_name: "TypeScript",
        category_code: "COD",
        reason: "Primary language prerequisite: Angular strictly uses TypeScript decorators and types.",
        confidence: "high",
      },
      {
        skill_name: "JavaScript (ES6+)",
        category_code: "COD",
        reason: "Underlying language runtime prerequisite for TypeScript execution.",
        confidence: "high",
      },
      {
        skill_name: "HTML5 & CSS3",
        category_code: "SWE",
        reason: "Template structure and component view styling prerequisite.",
        confidence: "high",
      },
      {
        skill_name: "Dependency Injection & OOP",
        category_code: "OOD",
        reason: "Enterprise architecture prerequisite: Angular services rely on hierarchical dependency injection.",
        confidence: "high",
      },
    ],
  },

  // 5. FastAPI
  {
    parentSkill: "FastAPI",
    aliases: ["fastapi", "fast-api"],
    category: "SWE",
    prerequisites: [
      {
        skill_name: "Python 3",
        category_code: "COD",
        reason: "Core language prerequisite: FastAPI is a native Python asynchronous web framework.",
        confidence: "high",
      },
      {
        skill_name: "RESTful API Design",
        category_code: "SWE",
        reason: "Protocol prerequisite: Designing clean resource endpoints, HTTP methods, and status codes.",
        confidence: "high",
      },
      {
        skill_name: "Asynchronous Programming (asyncio)",
        category_code: "OS",
        reason: "Concurrency prerequisite: FastAPI leverages Python async/await and event loops.",
        confidence: "high",
      },
      {
        skill_name: "HTTP Protocols & Status Codes",
        category_code: "NETW",
        reason: "Network prerequisite: Request/response lifecycle, headers, CORS, and JSON payloads.",
        confidence: "high",
      },
      {
        skill_name: "SQL & Relational Databases",
        category_code: "SQL",
        reason: "Data persistence prerequisite: Backend APIs interface with relational stores via ORMs like SQLAlchemy.",
        confidence: "medium",
      },
    ],
  },

  // 6. Django
  {
    parentSkill: "Django",
    aliases: ["django", "django rest framework", "drf"],
    category: "SWE",
    prerequisites: [
      {
        skill_name: "Python 3",
        category_code: "COD",
        reason: "Core language prerequisite for Django models, views, and management commands.",
        confidence: "high",
      },
      {
        skill_name: "SQL & Relational Schema Design",
        category_code: "SQL",
        reason: "Database prerequisite: Django ORM requires understanding migrations, relational foreign keys, and indexes.",
        confidence: "high",
      },
      {
        skill_name: "MVC / MVT Architecture",
        category_code: "OOD",
        reason: "Design pattern prerequisite: Separation of data models, template views, and business logic.",
        confidence: "high",
      },
      {
        skill_name: "RESTful API Design",
        category_code: "SWE",
        reason: "Endpoint design prerequisite for Django REST Framework APIs.",
        confidence: "high",
      },
    ],
  },

  // 7. Spring Boot
  {
    parentSkill: "Spring Boot",
    aliases: ["spring boot", "spring framework", "spring mvc", "springboot"],
    category: "SWE",
    prerequisites: [
      {
        skill_name: "Java",
        category_code: "COD",
        reason: "Core language prerequisite: Spring Boot applications are implemented in Java.",
        confidence: "high",
      },
      {
        skill_name: "Object-Oriented Design (SOLID)",
        category_code: "OOD",
        reason: "Architectural prerequisite: Inversion of Control (IoC), Dependency Injection, and clean interfaces.",
        confidence: "high",
      },
      {
        skill_name: "JVM Internals & Memory Management",
        category_code: "OS",
        reason: "Runtime prerequisite: Understanding heap allocation, garbage collection, and thread pools.",
        confidence: "medium",
      },
      {
        skill_name: "Relational Databases & SQL",
        category_code: "SQL",
        reason: "Data persistence prerequisite: Interfacing with Hibernate/JPA and relational tables.",
        confidence: "high",
      },
      {
        skill_name: "RESTful Web Services",
        category_code: "SWE",
        reason: "Service layer prerequisite: Building HTTP microservices and JSON response contracts.",
        confidence: "high",
      },
    ],
  },

  // 8. PyTorch
  {
    parentSkill: "PyTorch",
    aliases: ["pytorch", "torch"],
    category: "AI",
    prerequisites: [
      {
        skill_name: "Python 3",
        category_code: "COD",
        reason: "Scripting prerequisite: PyTorch tensors and modules are written and executed in Python.",
        confidence: "high",
      },
      {
        skill_name: "Linear Algebra & Matrix Operations",
        category_code: "APTI",
        reason: "Mathematical prerequisite: Tensors, dot products, matrix transformations, and gradient backpropagation.",
        confidence: "high",
      },
      {
        skill_name: "Machine Learning Fundamentals",
        category_code: "AI",
        reason: "Theoretical prerequisite: Loss functions, optimizers (Adam/SGD), overfitting, and cross-validation.",
        confidence: "high",
      },
      {
        skill_name: "NumPy & Scientific Computing",
        category_code: "COD",
        reason: "Array computing prerequisite: Vectorized operations and multi-dimensional array manipulation.",
        confidence: "high",
      },
      {
        skill_name: "Deep Neural Networks (CNNs/RNNs/Transformers)",
        category_code: "AI",
        reason: "Model architecture prerequisite: Designing neural layers, activations, and parameter weights.",
        confidence: "high",
      },
    ],
  },

  // 9. TensorFlow
  {
    parentSkill: "TensorFlow",
    aliases: ["tensorflow", "keras"],
    category: "AI",
    prerequisites: [
      {
        skill_name: "Python 3",
        category_code: "COD",
        reason: "Language prerequisite for training pipelines and data ingestion in TensorFlow.",
        confidence: "high",
      },
      {
        skill_name: "Machine Learning Fundamentals",
        category_code: "AI",
        reason: "Foundational theory: Supervised learning, classification, regression, and loss metrics.",
        confidence: "high",
      },
      {
        skill_name: "NumPy & Linear Algebra",
        category_code: "APTI",
        reason: "Mathematical foundation for data reshaping, weights, and tensor broadcasting.",
        confidence: "high",
      },
    ],
  },

  // 10. Kubernetes
  {
    parentSkill: "Kubernetes",
    aliases: ["kubernetes", "k8s"],
    category: "CLOUD",
    prerequisites: [
      {
        skill_name: "Docker & Containerization",
        category_code: "OS",
        reason: "Fundamental packaging prerequisite: Kubernetes orchestrates container images built with Docker.",
        confidence: "high",
      },
      {
        skill_name: "Linux Administration & Shell Scripting",
        category_code: "OS",
        reason: "Operating system prerequisite: Pod nodes, process isolation, cgroups, and namespaces run on Linux.",
        confidence: "high",
      },
      {
        skill_name: "Cloud Infrastructure (AWS/GCP/Azure)",
        category_code: "CLOUD",
        reason: "Hosting prerequisite: Managed clusters (EKS, GKE, AKS) integrate with cloud VPCs and load balancers.",
        confidence: "high",
      },
      {
        skill_name: "Cluster Networking & Ingress (DNS, TCP, HTTP)",
        category_code: "NETW",
        reason: "Networking prerequisite: Service mesh, pod-to-pod routing, overlay networks, and reverse proxies.",
        confidence: "high",
      },
    ],
  },

  // 11. Docker
  {
    parentSkill: "Docker",
    aliases: ["docker", "containerization", "docker-compose"],
    category: "OS",
    prerequisites: [
      {
        skill_name: "Linux Fundamentals & Command Line",
        category_code: "OS",
        reason: "OS prerequisite: Docker leverages Linux kernel features (namespaces, cgroups, chroot).",
        confidence: "high",
      },
      {
        skill_name: "Software Packaging & Environments",
        category_code: "SWE",
        reason: "Engineering hygiene prerequisite: Managing dependencies, environment variables, and build caching.",
        confidence: "high",
      },
      {
        skill_name: "Networking Basics (Port Forwarding & IP)",
        category_code: "NETW",
        reason: "Connectivity prerequisite: Exposing containerized services on local and bridge network ports.",
        confidence: "medium",
      },
    ],
  },

  // 12. PostgreSQL / MySQL (Relational DBs)
  {
    parentSkill: "PostgreSQL",
    aliases: ["postgresql", "postgres", "mysql", "mariadb"],
    category: "SQL",
    prerequisites: [
      {
        skill_name: "SQL Querying & Joins",
        category_code: "SQL",
        reason: "Query language prerequisite: Writing SELECT, multi-table JOINs, subqueries, and GROUP BY aggregations.",
        confidence: "high",
      },
      {
        skill_name: "Relational Schema Normalization (3NF)",
        category_code: "SQL",
        reason: "Data modeling prerequisite: Designing primary keys, foreign keys, constraints, and entity relationships.",
        confidence: "high",
      },
      {
        skill_name: "ACID Transactions & Concurrency",
        category_code: "SQL",
        reason: "Integrity prerequisite: Managing rollbacks, commit isolation levels, and locking mechanisms.",
        confidence: "high",
      },
      {
        skill_name: "Database Indexing & Query Optimization",
        category_code: "SQL",
        reason: "Performance prerequisite: B-Tree indexes, EXPLAIN ANALYZE execution plans, and query cost reduction.",
        confidence: "high",
      },
    ],
  },

  // 13. Redis / In-Memory Stores
  {
    parentSkill: "Redis",
    aliases: ["redis", "memcached"],
    category: "SYSD",
    prerequisites: [
      {
        skill_name: "Distributed Caching & In-Memory Strategies",
        category_code: "SYSD",
        reason: "Architecture prerequisite: Cache-aside pattern, TTL eviction, and cache invalidation strategies.",
        confidence: "high",
      },
      {
        skill_name: "Key-Value Data Structures",
        category_code: "DSA",
        reason: "Data structure prerequisite: Hash maps, sorted sets (zset), lists, and hyperloglog.",
        confidence: "high",
      },
    ],
  },

  // 14. Apache Kafka / Event Streaming
  {
    parentSkill: "Apache Kafka",
    aliases: ["kafka", "apache kafka", "event-driven", "rabbitmq"],
    category: "SYSD",
    prerequisites: [
      {
        skill_name: "Distributed Systems Architecture",
        category_code: "SYSD",
        reason: "System design prerequisite: Partitions, leader/follower replication, consumer groups, and high availability.",
        confidence: "high",
      },
      {
        skill_name: "Event-Driven & Pub/Sub Messaging",
        category_code: "SYSD",
        reason: "Messaging paradigm prerequisite: Decoupling publishers, message brokers, and consumers.",
        confidence: "high",
      },
      {
        skill_name: "Data Serialization (JSON / Avro / Protobuf)",
        category_code: "SWE",
        reason: "Schema format prerequisite: Compacting event payloads for streaming pipelines.",
        confidence: "medium",
      },
    ],
  },

  // 15. AWS / Cloud Computing
  {
    parentSkill: "AWS",
    aliases: ["aws", "amazon web services", "cloud computing"],
    category: "CLOUD",
    prerequisites: [
      {
        skill_name: "Cloud Architecture Fundamentals",
        category_code: "CLOUD",
        reason: "Core paradigm prerequisite: Elastic compute, object storage (S3), and managed services.",
        confidence: "high",
      },
      {
        skill_name: "Virtual Private Cloud (VPC) & Networking",
        category_code: "NETW",
        reason: "Network prerequisite: Subnets, route tables, security groups, and NAT gateways.",
        confidence: "high",
      },
      {
        skill_name: "Identity & Access Management (IAM)",
        category_code: "CLOUD",
        reason: "Security prerequisite: Least privilege policies, roles, and credential management.",
        confidence: "high",
      },
    ],
  },

  // 16. C++ Systems Programming
  {
    parentSkill: "C++",
    aliases: ["c++", "cpp", "c++17", "c++20"],
    category: "COD",
    prerequisites: [
      {
        skill_name: "Memory Management & Pointers",
        category_code: "OS",
        reason: "Core runtime prerequisite: Heap vs. stack, pointer arithmetic, manual deallocation, and RAII.",
        confidence: "high",
      },
      {
        skill_name: "Data Structures & Complexity Analysis",
        category_code: "DSA",
        reason: "Algorithmic prerequisite: Vector allocation, linked lists, trees, and Big-O efficiency.",
        confidence: "high",
      },
      {
        skill_name: "Object-Oriented Programming (Classes/Polymorphism)",
        category_code: "OOD",
        reason: "Design prerequisite: Inheritance, virtual functions, templates, and abstract interfaces.",
        confidence: "high",
      },
    ],
  },

  // 17. Go (Golang)
  {
    parentSkill: "Go (Golang)",
    aliases: ["golang", "go programming", "go lang"],
    category: "COD",
    prerequisites: [
      {
        skill_name: "Concurrency with Goroutines & Channels",
        category_code: "OS",
        reason: "Core runtime prerequisite: Lightweight thread primitives, mutexes, and CSP concurrency.",
        confidence: "high",
      },
      {
        skill_name: "Systems Programming & Sockets",
        category_code: "SWE",
        reason: "Implementation prerequisite: Building low-latency backend daemons and HTTP servers.",
        confidence: "high",
      },
      {
        skill_name: "Networking & HTTP Services",
        category_code: "NETW",
        reason: "Protocol prerequisite: Standard library net/http, REST APIs, and binary serialization.",
        confidence: "high",
      },
    ],
  },

  // 18. Microservices Architecture
  {
    parentSkill: "Microservices",
    aliases: ["microservices", "microservice architecture", "distributed services"],
    category: "SYSD",
    prerequisites: [
      {
        skill_name: "Distributed Systems & Scalability",
        category_code: "SYSD",
        reason: "Architecture prerequisite: Fault tolerance, circuit breakers, service discovery, and horizontal scaling.",
        confidence: "high",
      },
      {
        skill_name: "REST APIs & RPC (gRPC)",
        category_code: "NETW",
        reason: "Inter-service communication prerequisite: Synchronous and asynchronous protocol contracts.",
        confidence: "high",
      },
      {
        skill_name: "Database per Service & Data Consistency",
        category_code: "SQL",
        reason: "Data architecture prerequisite: Eventual consistency, Saga patterns, and transactional outbox.",
        confidence: "high",
      },
    ],
  },
];

export interface InferredSkillItem extends Skill {
  isImplied: boolean;
  impliedBy?: string;
}

export interface ExtractedJdResult {
  title: string;
  role: string;
  company: string;
  location: string;
  workMode: string;
  minExperience: string;
  overview: string;
  keyResponsibilities: string[];
  qualifications: string[];
  explicitSkills: InferredSkillItem[];
  impliedSkills: InferredSkillItem[];
  allSkills: InferredSkillItem[];
  skillDependencyGraph: Array<{
    parent: string;
    implied: Array<{ name: string; category: CategoryCode; reason: string }>;
  }>;
  categoryCoverage: Record<CategoryCode, number>;
  rawJsonExport: Record<string, any>;
  /** Present when produced by the Role 1 backend (server/jd). */
  analysis?: JdAnalysis;
}

export interface ExtractedResumeResult {
  name: string;
  email: string;
  phone: string;
  education: string;
  institution?: string;
  cgpa: string;
  graduationYear: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary: string;
  internships?: Array<Omit<InternshipEntry, "id">>;
  hackathons?: Array<Omit<HackathonEntry, "id">>;
  certifications?: Array<Omit<CertificationEntry, "id">>;
  achievements?: Array<Omit<AchievementEntry, "id">>;
  explicitSkills: InferredSkillItem[];
  impliedSkills: InferredSkillItem[];
  allSkills: InferredSkillItem[];
  categoryCoverage: Record<CategoryCode, number>;
  rawJsonExport: Record<string, any>;
}

/**
 * Intelligent Extraction Engine for Job Descriptions
 */
export function extractSkillsAndPrerequisitesFromJd(
  jdText: string,
  meta?: { title?: string; company?: string; location?: string; workMode?: string }
): ExtractedJdResult {
  const normalizedText = jdText.toLowerCase();

  // 1. Identify Explicit Mentions based on dictionary rules & known technologies
  const explicitSkillsFound: InferredSkillItem[] = [];
  const activeRules: SkillDependencyRule[] = [];
  const foundSkillNames = new Set<string>();

  for (const rule of SKILL_DEPENDENCY_RULES) {
    const isMatched = rule.aliases.some((alias) => {
      // Word boundary check to prevent substring false-positives
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      return regex.test(normalizedText);
    });

    if (isMatched) {
      activeRules.push(rule);
      const skillName = rule.parentSkill;
      foundSkillNames.add(skillName.toLowerCase());

      explicitSkillsFound.push({
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        skill_name: skillName,
        category_code: rule.category,
        evidence: `Directly specified in Job Description text under core requirements.`,
        confidence: "high",
        isImplied: false,
      });
    }
  }

  // Also check for explicit standard skills if not in parent rules (e.g. DSA, SQL, Git, Linux, Docker, Python)
  const additionalDirectChecks: Array<{ pattern: RegExp; name: string; category: CategoryCode; evidence: string }> = [
    { pattern: /\b(dsa|data structures|algorithms|trees|graphs|dynamic programming)\b/i, name: "Data Structures & Algorithms", category: "DSA", evidence: "Explicitly requested for algorithmic problem solving in JD." },
    { pattern: /\b(sql|relational databases|queries|joins)\b/i, name: "SQL & Relational Databases", category: "SQL", evidence: "Explicitly required for data modeling and query operations." },
    { pattern: /\b(linux|unix|bash|shell scripting)\b/i, name: "Linux Operating System", category: "OS", evidence: "Specified in JD for deployment or development environment." },
    { pattern: /\b(git|github|version control)\b/i, name: "Git Version Control", category: "SWE", evidence: "Required for team collaboration and repository management." },
    { pattern: /\b(ci\/cd|continuous integration|pipelines|github actions)\b/i, name: "CI/CD & DevOps Automation", category: "SWE", evidence: "Required for automated testing and release engineering." },
    { pattern: /\b(unit testing|tdd|test automation|jest|pytest)\b/i, name: "Software Testing & QA", category: "SWE", evidence: "Required for code reliability, automated test suites, and bug prevention." },
    { pattern: /\b(communication|collaboration|team player|stakeholder)\b/i, name: "Technical Communication", category: "COMM", evidence: "Explicitly noted in JD for cross-functional collaboration." },
    { pattern: /\b(analytical|problem solving|critical thinking)\b/i, name: "Analytical Problem Solving", category: "APTI", evidence: "Required in JD for complex engineering and decision making." },
  ];

  for (const check of additionalDirectChecks) {
    if (check.pattern.test(normalizedText) && !foundSkillNames.has(check.name.toLowerCase())) {
      foundSkillNames.add(check.name.toLowerCase());
      explicitSkillsFound.push({
        id: `exp_direct_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        skill_name: check.name,
        category_code: check.category,
        evidence: check.evidence,
        confidence: "high",
        isImplied: false,
      });
    }
  }

  // 2. DEDUCE IMPLIED PREREQUISITE SKILLS (The core intelligence requirement)
  // If in JD "React" is written, then "JS", "CSS", "HTML" should be included by default
  const impliedSkillsFound: InferredSkillItem[] = [];
  const skillDependencyGraph: Array<{
    parent: string;
    implied: Array<{ name: string; category: CategoryCode; reason: string }>;
  }> = [];

  for (const rule of activeRules) {
    const impliedListForParent: Array<{ name: string; category: CategoryCode; reason: string }> = [];

    for (const prereq of rule.prerequisites) {
      impliedListForParent.push({
        name: prereq.skill_name,
        category: prereq.category_code,
        reason: prereq.reason,
      });

      // Avoid duplicate implied skills if already added as explicit or prior implied
      const lowerName = prereq.skill_name.toLowerCase();
      const alreadyHasExact = explicitSkillsFound.some(
        (s) => s.skill_name.toLowerCase() === lowerName || s.skill_name.toLowerCase().includes(lowerName)
      );
      const alreadyHasImplied = impliedSkillsFound.some(
        (s) => s.skill_name.toLowerCase() === lowerName
      );

      if (!alreadyHasExact && !alreadyHasImplied) {
        impliedSkillsFound.push({
          id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          skill_name: prereq.skill_name,
          category_code: prereq.category_code,
          evidence: `⚡ Implied Foundation Prerequisite of ${rule.parentSkill}: ${prereq.reason}`,
          confidence: prereq.confidence,
          isImplied: true,
          impliedBy: rule.parentSkill,
        });
      }
    }

    if (impliedListForParent.length > 0) {
      skillDependencyGraph.push({
        parent: rule.parentSkill,
        implied: impliedListForParent,
      });
    }
  }

  // Combine both into comprehensive skills list
  const allSkills = [...explicitSkillsFound, ...impliedSkillsFound];

  // Compute 12-category coverage
  const categoryCoverage: Record<CategoryCode, number> = {
    COD: 0, DSA: 0, OOD: 0, APTI: 0, COMM: 0, AI: 0,
    CLOUD: 0, SQL: 0, SWE: 0, SYSD: 0, NETW: 0, OS: 0, OTHER: 0,
  };
  allSkills.forEach((s) => {
    if (categoryCoverage[s.category_code] !== undefined) {
      categoryCoverage[s.category_code]++;
    }
  });

  // Extract metadata from text if not provided
  const title = meta?.title || extractRegexMatch(jdText, /(?:Role|Title|Position):\s*([^\n\r]+)/i) || "Software Engineer";
  const company = meta?.company || extractRegexMatch(jdText, /(?:Company|Organization):\s*([^\n\r]+)/i) || "Hiring Company";
  const location = meta?.location || extractRegexMatch(jdText, /(?:Location|Office):\s*([^\n\r]+)/i) || "Bengaluru / Remote";
  const workMode = meta?.workMode || (normalizedText.includes("remote") ? "Remote" : normalizedText.includes("hybrid") ? "Hybrid" : "Onsite");
  const minExperience = extractRegexMatch(jdText, /(\d+\+?\s*(?:-\s*\d+)?\s*(?:years|yrs)\s*(?:of\s*)?experience)/i) || "0-2 Years (Freshers / Early Career)";

  // Extract bullet points for responsibilities
  const keyResponsibilities = extractBulletPoints(jdText, "responsibilities");
  const qualifications = extractBulletPoints(jdText, "qualifications");

  // Construct canonical JSON export format for project pages
  const rawJsonExport = {
    contract_schema: "RADIX_JD_EXTRACTION_V1",
    role: title,
    company: company,
    location: location,
    work_mode: workMode,
    minimum_experience: minExperience,
    skills_required: allSkills.map((s) => ({
      skill_name: s.skill_name,
      category_code: s.category_code,
      evidence: s.evidence,
      confidence: s.confidence,
      is_implied: s.isImplied,
      implied_by: s.impliedBy || null,
    })),
    dependency_graph: skillDependencyGraph,
    category_coverage: categoryCoverage,
    total_skills_count: allSkills.length,
    explicit_count: explicitSkillsFound.length,
    implied_count: impliedSkillsFound.length,
    extracted_at: new Date().toISOString(),
  };

  return {
    title,
    role: title,
    company,
    location,
    workMode,
    minExperience,
    overview: jdText.slice(0, 320) + (jdText.length > 320 ? "..." : ""),
    keyResponsibilities: keyResponsibilities.length ? keyResponsibilities : [
      "Design and maintain scalable frontend/backend components.",
      "Adhere to high quality engineering and testing standards.",
      "Collaborate across multi-disciplinary teams in agile sprints."
    ],
    qualifications: qualifications.length ? qualifications : [
      "B.Tech / B.E. in Computer Science, Information Technology, or relevant discipline.",
      "Strong conceptual grasp of software engineering fundamentals.",
      "Demonstrated problem solving agility."
    ],
    explicitSkills: explicitSkillsFound,
    impliedSkills: impliedSkillsFound,
    allSkills,
    skillDependencyGraph,
    categoryCoverage,
    rawJsonExport,
  };
}

/**
 * Intelligent Extraction Engine for Resumes
 * Applies the exact same prerequisite inference logic to candidate resume data
 */
export function extractSkillsAndPrerequisitesFromResume(
  resumeText: string,
  existingSkills: Skill[] = []
): ExtractedResumeResult {
  const normalizedText = resumeText.toLowerCase();

  // Combine existing skills + text scanning
  const explicitSkillsFound: InferredSkillItem[] = [...existingSkills.map((s) => ({ ...s, isImplied: false }))];
  const foundNames = new Set<string>(existingSkills.map((s) => s.skill_name.toLowerCase()));
  const activeRules: SkillDependencyRule[] = [];

  for (const rule of SKILL_DEPENDENCY_RULES) {
    const isMatched =
      rule.aliases.some((alias) => {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        return regex.test(normalizedText);
      }) || foundNames.has(rule.parentSkill.toLowerCase());

    if (isMatched) {
      activeRules.push(rule);
      if (!foundNames.has(rule.parentSkill.toLowerCase())) {
        foundNames.add(rule.parentSkill.toLowerCase());
        explicitSkillsFound.push({
          id: `res_exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          skill_name: rule.parentSkill,
          category_code: rule.category,
          evidence: `Verified in candidate resume text and project descriptions.`,
          confidence: "high",
          isImplied: false,
        });
      }
    }
  }

  // Deduce implied skills for the candidate
  const impliedSkillsFound: InferredSkillItem[] = [];
  for (const rule of activeRules) {
    for (const prereq of rule.prerequisites) {
      const lowerPrereq = prereq.skill_name.toLowerCase();
      const alreadyHas =
        explicitSkillsFound.some(
          (s) => s.skill_name.toLowerCase() === lowerPrereq || s.skill_name.toLowerCase().includes(lowerPrereq)
        ) ||
        impliedSkillsFound.some(
          (s) => s.skill_name.toLowerCase() === lowerPrereq
        );

      if (!alreadyHas) {
        impliedSkillsFound.push({
          id: `res_imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          skill_name: prereq.skill_name,
          category_code: prereq.category_code,
          evidence: `⚡ Inferred prerequisite from candidate mastery of ${rule.parentSkill}: ${prereq.reason}`,
          confidence: prereq.confidence,
          isImplied: true,
          impliedBy: rule.parentSkill,
        });
      }
    }
  }

  const allSkills = [...explicitSkillsFound, ...impliedSkillsFound];

  const categoryCoverage: Record<CategoryCode, number> = {
    COD: 0, DSA: 0, OOD: 0, APTI: 0, COMM: 0, AI: 0,
    CLOUD: 0, SQL: 0, SWE: 0, SYSD: 0, NETW: 0, OS: 0, OTHER: 0,
  };
  allSkills.forEach((s) => {
    if (categoryCoverage[s.category_code] !== undefined) {
      categoryCoverage[s.category_code]++;
    }
  });

  const name = extractRegexMatch(resumeText, /(?:Name|Candidate):\s*([^\n\r]+)/i) || "";
  const email = extractRegexMatch(resumeText, /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) || "";
  const phone = extractRegexMatch(resumeText, /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i) || "";
  const education = extractRegexMatch(resumeText, /(?:Education|Degree):\s*([^\n\r]+)/i) || "";
  const cgpa = extractRegexMatch(resumeText, /(?:CGPA|GPA):\s*([0-9.]+)/i) || "";
  const graduationYear = extractRegexMatch(resumeText, /(?:Graduation|Year|Batch):\s*(\d{4})/i) || "";

  const rawJsonExport = {
    contract_schema: "RADIX_CANDIDATE_RESUME_EXTRACTION_V1",
    name,
    email,
    phone,
    education,
    cgpa,
    graduation_year: graduationYear,
    skills: allSkills.map((s) => ({
      skill_name: s.skill_name,
      category_code: s.category_code,
      evidence: s.evidence,
      confidence: s.confidence,
      is_implied: s.isImplied,
      implied_by: s.impliedBy || null,
    })),
    category_coverage: categoryCoverage,
    total_skills: allSkills.length,
    explicit_skills_count: explicitSkillsFound.length,
    implied_skills_count: impliedSkillsFound.length,
    extracted_at: new Date().toISOString(),
  };

  return {
    name,
    email,
    phone,
    education,
    cgpa,
    graduationYear,
    summary: resumeText.slice(0, 240) + "...",
    explicitSkills: explicitSkillsFound,
    impliedSkills: impliedSkillsFound,
    allSkills,
    categoryCoverage,
    rawJsonExport,
  };
}

// Helper utilities
function extractRegexMatch(text: string, regex: RegExp): string | null {
  const match = text.match(regex);
  return match && match[1] ? match[1].trim() : null;
}

function extractBulletPoints(text: string, sectionKeyword: string): string[] {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(sectionKeyword);
  if (idx === -1) return [];

  const slice = text.slice(idx, idx + 1000);
  const lines = slice.split(/\r?\n/);
  const bullets: string[] = [];

  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*") || /^\d+\./.test(trimmed)) {
      const clean = trimmed.replace(/^([•\-\*]|\d+\.)\s*/, "").trim();
      if (clean.length > 8) bullets.push(clean);
    } else if (trimmed.endsWith(":") && bullets.length > 0) {
      break; // next section
    }
  }

  return bullets.slice(0, 5);
}
