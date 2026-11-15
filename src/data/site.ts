// Single source of truth for all portfolio content.

export const profile = {
  firstName: "Venusai",
  lastName: "Yalamanchili",
  nickname: "Venu",
  role: "Software Engineer",
  company: "Heizen",
  location: "Hyderabad, India · IST (UTC+5:30)",
  email: "venusaiyalamanchili@gmail.com",
  resume: "https://drive.google.com/file/d/1fvA8rxYiz1GSr7_Vd8w1gS2D5MC-ugqv/view?usp=sharing",
  // Hero portrait (rendered with the interactive 3D effect). Replace the placeholder with your own photo,
  // e.g. "/me/hero.jpg": a centred head-and-shoulders shot on a plain background works best.
  heroImage: "/me/hero.jpg",
  // Optional grayscale depth map for the hero photo (white = near). Leave null to use the built-in head/shoulders depth.
  heroDepth: null as string | null,
  // Extra photos for the scattered "polaroids" in the About section. Leave empty to show stat cards only.
  gallery: [{ src: "/projects/unison.jpg", caption: "Unison, 2026" }] as { src: string; caption: string }[],
  socials: [
    { label: "GitHub", short: "GH", href: "https://github.com/Venu005" },
    {
      label: "LinkedIn",
      short: "LN",
      href: "https://www.linkedin.com/in/venusai-yalamanchili/",
    },
    { label: "X / Twitter", short: "X", href: "https://x.com/__venusai" },
    { label: "LeetCode", short: "LC", href: "https://leetcode.com/u/QTu0ynsPME/" },
  ],
};

export const stats = [
  { value: "4–6", unit: "wks", label: "To ship an enterprise supply chain platform, against an 8-week plan" },
  { value: "90", unit: "%", label: "Cut in 200+ hrs/week of manual data collation" },
  { value: "<120", unit: "ms", label: "API responses with 30–120s LLM jobs queued in the background" },
  { value: "800", unit: "+", label: "DSA problems solved · LeetCode Knight" },
];

export type Role = {
  company: string;
  title: string;
  period: string;
  mode: string;
  summary: string;
  points: string[];
  stack: string[];
};

export const experience: Role[] = [
  {
    company: "Heizen",
    title: "Software Engineer",
    period: "Apr 2026 — Present",
    mode: "Hybrid",
    summary:
      "Building a supply chain visibility & OTIF analytics platform for a large agri-export business.",
    points: [
      "Replaced Excel trackers, email chains and siloed SAP data for an export division moving 35,000+ MT/yr, and shipped it in 4–6 weeks against an 8-week plan.",
      "Digitized 21 manual touchpoints into 23 tracked stage gates. Order creation went from hours to under 5 minutes, and status lag from 48–72 hrs to under 1 minute.",
      "Built OTIF & delay dashboards with real-time bottleneck alerts. They replaced 20 hrs/week of manual reporting and helped cut manual data collation by 90%.",
      "Shipped an AI chatbot that answers voice & text questions over the operations database, cutting managers' information gathering from days to minutes.",
      "Built regulatory compliance tracking with full audit trails and tablet-first operator UIs, designed from 20 days on-site across 5 plant visits.",
    ],
    stack: ["Next.js", "Nest.js", "PostgreSQL", "LangGraph", "AWS"],
  },
  {
    company: "Heizen",
    title: "Associate Software Engineer",
    period: "Sep 2025 — Mar 2026",
    mode: "Hybrid",
    summary: "AI products: a real-time voice interviewer and a GitHub code review bot.",
    points: [
      "Engineered an AI voice interview platform on LiveKit WebRTC + ElevenLabs TTS, offloading 30–120s LLM inference to BullMQ queues to keep APIs under 120 ms.",
      "Built an AI GitHub code review bot (Probot + GPT) that writes line-level comments and 5-dimension quality scores, with 87% comment accuracy.",
    ],
    stack: ["LiveKit", "ElevenLabs", "BullMQ", "Redis", "Probot"],
  },
  {
    company: "Kuteeram Tech Solutions",
    title: "Software Development Intern",
    period: "May 2025 — Aug 2025",
    mode: "Hybrid",
    summary: "Backend for a multi-district commerce & inventory platform.",
    points: [
      "Scaled backend inventory management across 28+ districts with synchronized seller data.",
      "Cut location-based seller discovery time by 60% with MongoDB aggregation pipelines and geospatial indexing (50 km radius).",
      "Wrote 35+ validated REST APIs with real-time order tracking, containerized with Docker and backed by Kafka.",
    ],
    stack: ["Node.js", "MongoDB", "Kafka", "Docker"],
  },
];

export type Project = {
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  year: string;
  kind: string;
  links: { label: string; href: string }[];
  image?: string;
  accent: "lime" | "cream" | "dark";
  highlights?: string[];
};

export const projects: Project[] = [
  {
    name: "Unison",
    tagline: "Your Mac and Android, finally in sync.",
    description:
      "Native Mac menu-bar and Android apps that pair over local Wi-Fi with a single QR scan. No account, no cloud, no server. Resumable file transfer, mirrored notifications, a shared clipboard, calls, screen mirroring and remote control.",
    stack: ["Swift", "SwiftUI", "SwiftNIO", "Kotlin", "Jetpack Compose", "mTLS 1.3", "WebSocket"],
    year: "2026",
    kind: "Native apps · Solo build",
    image: "/projects/unison.jpg",
    links: [
      { label: "Website", href: "https://venu005.github.io/unison/" },
      { label: "GitHub", href: "https://github.com/Venu005/unison" },
    ],
    accent: "lime",
    highlights: ["Mutual TLS 1.3 + cert pinning", "SHA-256 verified transfers", "341+ commits"],
  },
  {
    name: "Agri Export Ops Platform",
    tagline: "Supply chain visibility for a large export division.",
    description:
      "An end-to-end order lifecycle, OTIF analytics and an AI ops chatbot that replaced spreadsheets and email chains. Designed on the plant floor, shipped ahead of schedule.",
    stack: ["Next.js", "Nest.js", "PostgreSQL", "LangGraph", "AWS"],
    year: "2026",
    kind: "Company project · Heizen",
    links: [],
    accent: "dark",
    highlights: ["23 tracked stage gates", "48–72 hrs → <1 min status lag", "Shipped in 4–6 weeks"],
  },
  {
    name: "AI Voice Interviewer",
    tagline: "Real-time spoken interviews, run by an LLM.",
    description:
      "A WebRTC voice interview platform with natural TTS. Heavy LLM inference runs on async queues, so the product stays snappy for candidates.",
    stack: ["LiveKit", "ElevenLabs", "BullMQ", "Node.js", "Redis"],
    year: "2025",
    kind: "Company project · Heizen",
    links: [],
    accent: "cream",
    highlights: ["<120 ms API responses", "30–120s jobs offloaded"],
  },
  {
    name: "Expense Tracker MCP",
    tagline: "Split expenses by just asking your AI.",
    description:
      "A TypeScript MCP server for Splitwise-style expense splitting, driven from Claude Code and Gemini CLI. Zod-validated outputs handle hallucinations and failed tool calls gracefully.",
    stack: ["TypeScript", "MCP", "Zod", "Docker", "GitHub Actions"],
    year: "2025",
    kind: "Open source",
    links: [{ label: "GitHub", href: "https://github.com/Venu005/expense-tracker-mcp-server" }],
    accent: "dark",
    highlights: ["100+ test scenarios", "5s cold starts"],
  },
  {
    name: "AI Code Review Bot",
    tagline: "A reviewer that never gets tired of your PRs.",
    description:
      "A GitHub App that reads pull requests, writes line-level comments and scores code across five quality dimensions.",
    stack: ["Probot", "OpenAI", "Node.js", "GitHub API"],
    year: "2025",
    kind: "Company project · Heizen",
    links: [],
    accent: "cream",
    highlights: ["87% comment accuracy"],
  },
  {
    name: "AI Resume Enhancer",
    tagline: "1st place at GDG Hackathon 2025.",
    description:
      "Helps students craft stronger resumes with AI suggestions and career guidance. It beat 20+ teams on technical execution and real-world impact.",
    stack: ["React", "LLMs", "Vector DB", "Prisma"],
    year: "2025",
    kind: "Hackathon winner",
    links: [
      { label: "Live", href: "https://student-resume-v2.vercel.app/" },
      { label: "GitHub", href: "https://github.com/Venu005/student-resume-v2" },
    ],
    image: "/projects/project-3.png",
    accent: "lime",
  },
  {
    name: "CollabHub",
    tagline: "A space to connect with teams and friends.",
    description:
      "A real-time collaboration platform: workspaces, channels and live messaging for teams and friends working on projects together.",
    stack: ["Next.js", "Convex", "WebSockets", "TypeScript"],
    year: "2024",
    kind: "Side project",
    links: [
      { label: "Live", href: "https://collab-hub-flame.vercel.app/" },
      { label: "GitHub", href: "https://github.com/Venu005/CollabHub" },
    ],
    image: "/projects/project-1.png",
    accent: "dark",
  },
  {
    name: "ExamFlow",
    tagline: "Exam management, made easy.",
    description:
      "An AI-powered app that handles exam scheduling, seating arrangements and student performance tracking for institutions.",
    stack: ["Next.js", "Groq", "Prisma", "PostgreSQL"],
    year: "2024",
    kind: "Side project",
    links: [
      { label: "Live", href: "https://exam-management-three.vercel.app/" },
      { label: "GitHub", href: "https://github.com/Venu005/exam-management" },
    ],
    image: "/projects/project-2.png",
    accent: "cream",
  },
];

export const services = [
  {
    title: "Full-stack web apps",
    body: "Dashboards, SaaS products and internal tools with Next.js, Node/Nest and Postgres, from first wireframe to production.",
  },
  {
    title: "AI & LLM features",
    body: "Chatbots over your data, RAG, agents with LangGraph, MCP servers and voice AI with LiveKit + ElevenLabs.",
  },
  {
    title: "Backend & real-time",
    body: "APIs, queues and event-driven systems with Redis, BullMQ and Kafka, plus WebSockets that stay fast under load.",
  },
  {
    title: "MVPs for startups",
    body: "A working, shippable product in weeks, not quarters. I work directly with founders and ops teams.",
  },
];

export const process = [
  { step: "01", title: "Discover", body: "A short call to understand the problem, users and constraints." },
  { step: "02", title: "Plan", body: "Clear scope, milestones and a fixed or weekly price, with no surprises." },
  { step: "03", title: "Build", body: "Weekly demos on a live preview URL. You see progress, not promises." },
  { step: "04", title: "Ship", body: "Deploy, document, hand over, and stay around for support." },
];

export const skills = {
  Languages: ["TypeScript", "JavaScript", "Python", "SQL", "C++", "C", "Swift", "Kotlin"],
  Frameworks: ["React", "Next.js", "Node.js", "Nest.js", "Express", "WebSockets", "REST"],
  Data: ["PostgreSQL", "MongoDB", "Redis", "Kafka", "RabbitMQ", "BullMQ"],
  Cloud: ["AWS", "Lambda", "S3", "SQS", "EC2", "CloudFront", "Docker", "Terraform", "GitHub Actions"],
  "AI / LLM": ["LangChain", "LangGraph", "RAG", "MCP", "Langfuse", "Vercel AI SDK", "LiveKit", "ElevenLabs"],
};

export const achievements = [
  { title: "1st Place", sub: "GDG Hackathon 2025", body: "AI Resume Enhancer, against 20+ teams." },
  { title: "Knight", sub: "LeetCode", body: "Rank 797 in Weekly Contest 438 · 800+ problems solved." },
  { title: "8.85", sub: "CGPA · B.Tech CSE", body: "IIITDM Kurnool, 2022 — 2026." },
];
