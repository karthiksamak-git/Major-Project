/* ═══════════════════════════════════════════
   AI DOJO CHALLENGE GENERATOR
   Generates dynamic, domain-specific quiz & combat
   questions tailored to the specific mission node.
   ═══════════════════════════════════════════ */

import { chatWithGroq, ChatMessage } from "./ai-client";

export interface DojoChallenge {
  id: number;
  senseiSays: string;
  question: string;
  options: string[];
  correct: number; // 0-indexed
  explanation: string;
}

export async function generateDojoChallenges(
  missionTitle: string,
  domain: string,
  lore: string
): Promise<DojoChallenge[]> {
  const systemPrompt: ChatMessage = {
    role: "system",
    content: `You are an AI IT Mentor generating a technical practice challenge for an engineering student.

Domain: ${domain}
Mission Title: ${missionTitle}
Description/Lore: ${lore}

Generate 4 distinct multiple-choice questions testing practical knowledge related to this specific mission and domain.
Questions should start simpler and get progressively deeper.
Use clear, easy-to-understand language.

Return ONLY a valid JSON array:
[
  {
    "id": 1,
    "senseiSays": "A short, encouraging sentence from the mentor setting up the question",
    "question": "Clear, practical technical question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "2-3 sentences explaining why the correct option is right and how it works in real-world IT."
  }
]

Rules:
- Exactly 4 questions
- "correct" must be an integer from 0 to 3 matching the index of the correct option
- Options array must contain exactly 4 choices
- Do NOT wrap in markdown backticks. Return raw JSON only.`,
  };

  try {
    const response = await chatWithGroq([systemPrompt, { role: "user", content: "Generate 4 questions now." }], 0.6);
    const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as DojoChallenge[];
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.map((item, idx) => ({
        id: idx + 1,
        senseiSays: item.senseiSays || "Apply your core knowledge to solve this challenge.",
        question: item.question,
        options: item.options && item.options.length === 4 ? item.options : ["Option A", "Option B", "Option C", "Option D"],
        correct: typeof item.correct === "number" && item.correct >= 0 && item.correct < 4 ? item.correct : 0,
        explanation: item.explanation || "Review the core concepts for this topic to strengthen your understanding.",
      }));
    }
    return getFallbackDojoChallenges(missionTitle, domain);
  } catch (err) {
    console.error("AI Dojo challenge generation failed, using fallback:", err);
    return getFallbackDojoChallenges(missionTitle, domain);
  }
}

/* ═══════════════════════════════════════════
   DOMAIN-SPECIFIC FALLBACK CHALLENGES
   Used when AI API is unavailable
   ═══════════════════════════════════════════ */
function getFallbackDojoChallenges(missionTitle: string, domain: string): DojoChallenge[] {
  const d = domain.toLowerCase();

  if (d.includes("frontend") || d.includes("canvas")) {
    return [
      {
        id: 1,
        senseiSays: "The browser renders what you structure. Master the DOM first.",
        question: "Which HTML element is best suited for wrapping top-level navigation links?",
        options: ["<section>", "<nav>", "<aside>", "<div>"],
        correct: 1,
        explanation: "<nav> is a semantic HTML5 element specifically designed to contain navigation links, improving accessibility and SEO.",
      },
      {
        id: 2,
        senseiSays: "State drives the user interface. Handle state changes cleanly.",
        question: "In React, what happens when a state variable updated with useState changes?",
        options: [
          "The entire browser page reloads",
          "The component re-renders to reflect the new state",
          "The DOM is manually deleted and recreated from scratch",
          "Only CSS styles are updated without re-rendering",
        ],
        correct: 1,
        explanation: "Updating state triggers a re-render of the component and its children, allowing React's Virtual DOM to efficiently update only the changed elements.",
      },
      {
        id: 3,
        senseiSays: "Layout performance determines whether your app feels smooth or laggy.",
        question: "Which CSS property trigger changes handled on the GPU for 60FPS animations?",
        options: ["width and height", "margin and padding", "transform and opacity", "top and left"],
        correct: 2,
        explanation: "transform and opacity can be composited directly on the GPU without triggering heavy layout recalculations (reflows) or repaints.",
      },
      {
        id: 4,
        senseiSays: "Final trial: Show me you can build responsive, fast web experiences.",
        question: "What is the primary benefit of CSS Flexbox and Grid over traditional layout techniques?",
        options: [
          "They automatically translate text into multiple languages",
          "They enable dynamic, responsive layout positioning without float hacks",
          "They replace JavaScript event listeners",
          "They compress image file sizes",
        ],
        correct: 1,
        explanation: "Flexbox and CSS Grid provide native layout algorithms for 1D and 2D alignment, making complex responsive designs easy and performant.",
      },
    ];
  }

  if (d.includes("devops") || d.includes("cloud")) {
    return [
      {
        id: 1,
        senseiSays: "Automation is the heart of cloud engineering.",
        question: "What is the main purpose of Docker containers?",
        options: [
          "To design user interfaces for mobile phones",
          "To package applications with their dependencies so they run consistently anywhere",
          "To write SQL queries faster",
          "To replace web browsers",
        ],
        correct: 1,
        explanation: "Docker containers bundle an application with all required binaries and libraries, eliminating 'it works on my machine' issues across different environments.",
      },
      {
        id: 2,
        senseiSays: "Continuous Integration keeps code bases healthy.",
        question: "In a CI/CD pipeline, what does CI stand for?",
        options: ["Cloud Infrastructure", "Continuous Integration", "Component Interface", "Central Control"],
        correct: 1,
        explanation: "Continuous Integration (CI) automates building and testing code changes frequently, detecting integration bugs early.",
      },
      {
        id: 3,
        senseiSays: "Guard the pipeline against outages.",
        question: "Which tool is widely used for Infrastructure as Code (IaC)?",
        options: ["Terraform", "Photoshop", "Postman", "MongoDB"],
        correct: 0,
        explanation: "Terraform allows cloud engineers to define, provision, and manage cloud infrastructure using declarative configuration code.",
      },
      {
        id: 4,
        senseiSays: "Final trial: Command the clouds with confidence.",
        question: "What does Kubernetes automate in cloud infrastructure?",
        options: [
          "Container deployment, scaling, and management",
          "Database schema design",
          "Frontend UI CSS styling",
          "User password resets",
        ],
        correct: 0,
        explanation: "Kubernetes is an open-source container orchestration system that manages containerized applications across cluster nodes automatically.",
      },
    ];
  }

  if (d.includes("ai") || d.includes("machine learning") || d.includes("oracle")) {
    return [
      {
        id: 1,
        senseiSays: "Data fuels intelligence. Know the difference between learning paradigms.",
        question: "What distinguishes Supervised Learning from Unsupervised Learning?",
        options: [
          "Supervised learning requires labeled training data with target outputs",
          "Supervised learning does not use computers",
          "Unsupervised learning only works on images",
          "Supervised learning cannot make predictions",
        ],
        correct: 0,
        explanation: "Supervised learning trains models on labeled pairs (input -> output), whereas unsupervised learning finds hidden patterns in unlabeled data.",
      },
      {
        id: 2,
        senseiSays: "Neural networks process information in layers.",
        question: "In Large Language Models (LLMs), what mechanism enables understanding token relationships in context?",
        options: ["Attention / Transformer Mechanism", "CSS Media Queries", "SQL Joins", "Binary Search Trees"],
        correct: 0,
        explanation: "Self-attention mechanisms in Transformer architectures allow LLMs to weigh the relevance of different words across long contexts dynamically.",
      },
      {
        id: 3,
        senseiSays: "Precision and recall balance model performance.",
        question: "What metric measures the proportion of true positive predictions out of all positive predictions made?",
        options: ["Accuracy", "Precision", "Recall", "Loss"],
        correct: 1,
        explanation: "Precision = True Positives / (True Positives + False Positives). It answers: 'Out of all items predicted positive, how many were actually positive?'",
      },
      {
        id: 4,
        senseiSays: "Final trial: Demonstrate your grasp of intelligent systems.",
        question: "What is Prompt Engineering in AI development?",
        options: [
          "Crafting effective inputs and context to guide LLMs toward accurate outputs",
          "Building hardware server racks",
          "Writing low-level assembly code",
          "Designing website color schemes",
        ],
        correct: 0,
        explanation: "Prompt Engineering involves structuring system prompts, instructions, and contextual examples to optimize LLM responses for specific tasks.",
      },
    ];
  }

  if (d.includes("data") || d.includes("analytics") || d.includes("archive")) {
    return [
      {
        id: 1,
        senseiSays: "Data is raw ore; analytics turns it into insight.",
        question: "Which SQL clause is used to filter aggregated data generated by GROUP BY?",
        options: ["WHERE", "HAVING", "ORDER BY", "SELECT"],
        correct: 1,
        explanation: "HAVING filters groups created by GROUP BY, whereas WHERE filters individual rows before grouping occurs.",
      },
      {
        id: 2,
        senseiSays: "Transform rivers of data into structured streams.",
        question: "In Data Engineering, what does ETL stand for?",
        options: [
          "Extract, Transform, Load",
          "Enter, Test, Log",
          "Execute, Transfer, List",
          "Export, Table, Link",
        ],
        correct: 0,
        explanation: "ETL (Extract, Transform, Load) is the foundational process of fetching raw data, cleaning/transforming it, and loading it into a data warehouse.",
      },
      {
        id: 3,
        senseiSays: "Understand data distributions.",
        question: "Which library is standard in Python for data manipulation using DataFrames?",
        options: ["Pandas", "React", "Express", "Tailwind"],
        correct: 0,
        explanation: "Pandas provides high-performance, easy-to-use data structures (DataFrames and Series) for data analysis and manipulation in Python.",
      },
      {
        id: 4,
        senseiSays: "Final trial: Extract truth from complex data rivers.",
        question: "What is the primary purpose of a Data Warehouse compared to a transactional database?",
        options: [
          "Optimized for fast analytical queries and historical business intelligence reporting",
          "Only used for storing image uploads",
          "Replacing web application backend servers",
          "Managing real-time user login sessions",
        ],
        correct: 0,
        explanation: "Data warehouses (like Snowflake or BigQuery) are OLAP systems optimized for querying large historical datasets, unlike OLTP databases built for fast transaction processing.",
      },
    ];
  }

  // General Backend / Default fallback
  return [
    {
      id: 1,
      senseiSays: "Understanding how clients and servers talk is essential in IT.",
      question: `In ${missionTitle || "this topic"}, what does HTTP status code 201 indicate?`,
      options: [
        "The request was successful and data is returned",
        "A new resource has been successfully created",
        "The server is redirecting to another page",
        "The request requires authentication",
      ],
      correct: 1,
      explanation: "201 Created indicates that the request succeeded and a new resource was created on the server (commonly returned by POST requests).",
    },
    {
      id: 2,
      senseiSays: "Choose idempotent operations to prevent duplicate state errors.",
      question: "Which HTTP method is idempotent and replaces an entire resource?",
      options: ["POST", "PATCH", "PUT", "DELETE"],
      correct: 2,
      explanation: "PUT is idempotent — executing it multiple times produces the same result. It updates or replaces the full resource.",
    },
    {
      id: 3,
      senseiSays: "Efficiency separates amateur systems from production-grade code.",
      question: "What is the primary advantage of indexing in database systems?",
      options: [
        "Saves disk space",
        "Dramatically speeds up data retrieval and query execution",
        "Encrypts data rows",
        "Deletes duplicate records",
      ],
      correct: 1,
      explanation: "Database indexes build fast lookup data structures (like B-Trees) allowing the engine to find matching rows without scanning the full table.",
    },
    {
      id: 4,
      senseiSays: "Final challenge: Prove your practical technical understanding.",
      question: "What is the key benefit of building modular, RESTful APIs?",
      options: [
        "Decouples frontend and backend applications, allowing independent development and scaling",
        "Eliminates the need for databases",
        "Makes code run without servers",
        "Prevents all network errors automatically",
      ],
      correct: 0,
      explanation: "RESTful APIs separate interface from implementation, allowing client apps (web, mobile, desktop) to communicate with server backends via standard contracts.",
    },
  ];
}
