import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });

async function main() {
  const resolvedEnvPath = path.resolve(__dirname, '../../apps/api/.env');
  console.log(`Resolved Env Path: ${resolvedEnvPath}`);
  console.log(`DATABASE_URL in process.env: ${process.env.DATABASE_URL}`);

  const { prisma, ItemType, ItemStatus } = await import('./src/index.js');
  
  const email = 'lucifermornigstarrr123@gmail.com';
  console.log(`Finding user with email: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true }
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  let workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) {
    console.error(`User has no workspaces`);
    process.exit(1);
  }

  console.log(`Using workspace: ${workspaceId}`);

  // 1. Clean existing items and projects to avoid duplicate data and conflicts
  console.log('Cleaning existing items, tags, and projects...');
  await prisma.itemTag.deleteMany({
    where: { item: { workspaceId } }
  });
  await prisma.item.deleteMany({
    where: { workspaceId }
  });
  await prisma.project.deleteMany({
    where: { workspaceId }
  });

  // 2. Create projects
  console.log('Creating realistic test projects...');
  const projectsToCreate = [
    {
      title: "HypeMind Launch",
      slug: "hypemind-launch",
      description: "Everything required to build, test, and ship HypeMind v1.0. Marketing assets, serverless hooks, and vector DB setups.",
      isPinned: true,
      pinnedAt: new Date()
    },
    {
      title: "AI & RAG Engine",
      slug: "ai-rag-engine",
      description: "Developing semantic graph embeddings, Claude API middleware, prompt schemas, and context caching mechanisms.",
      isPinned: true,
      pinnedAt: new Date()
    },
    {
      title: "Design & UX Overhaul",
      slug: "design-ux-overhaul",
      description: "Crafting beautiful glassmorphism dark-mode UI elements, micro-animations, Tiptap themes, and keyboard hotkeys.",
      isPinned: false
    },
    {
      title: "Personal Brain Hub",
      slug: "personal-brain-hub",
      description: "Journals, life philosophies, startup validations, and books to read to cultivate high-performance habits.",
      isPinned: false
    }
  ];

  const projectMap = new Map<string, string>();
  for (const proj of projectsToCreate) {
    const createdProj = await prisma.project.create({
      data: {
        workspaceId,
        title: proj.title,
        slug: proj.slug,
        description: proj.description,
        isPinned: proj.isPinned,
        pinnedAt: proj.pinnedAt,
        createdById: user.id
      }
    });
    projectMap.set(proj.slug, createdProj.id);
  }

  // 3. Create harmonious tags with colors
  console.log('Creating colored categorizations (tags)...');
  const tagsToCreate = [
    { name: 'ui', color: '#ff7675' },         // Coral Red
    { name: 'bug', color: '#d63031' },         // Red
    { name: 'backend', color: '#0984e3' },     // Blue
    { name: 'ai', color: '#6c5ce7' },          // Purple
    { name: 'planning', color: '#e17055' },    // Orange
    { name: 'inspiration', color: '#fdcb6e' }, // Yellow
    { name: 'productivity', color: '#00b894' },// Emerald Green
    { name: 'startup', color: '#ffeaa7' },     // Sand Yellow
    { name: 'dev', color: '#74b9ff' },         // Sky Blue
    { name: 'reading', color: '#a29bfe' },     // Soft Purple
    { name: 'design', color: '#fd79a8' },      // Pink
    { name: 'research', color: '#00cec9' },    // Teal
    { name: 'ideas', color: '#ffeaa7' }        // Soft Yellow
  ];

  const tagMap = new Map<string, string>();
  for (const t of tagsToCreate) {
    let tag = await prisma.tag.findUnique({
      where: { workspaceId_name: { workspaceId, name: t.name } }
    });
    if (!tag) {
      tag = await prisma.tag.create({
        data: { workspaceId, name: t.name, color: t.color }
      });
    }
    tagMap.set(t.name, tag.id);
  }

  // 4. Seed Inbox Items (projectId = null, various types, but not PAGE)
  console.log('Seeding 25+ rich Inbox items...');
  const inboxData = [
    {
      title: "Designing Spatial UIs for Apple Vision Pro: A Crash Course",
      url: "https://youtube.com/watch?v=spatial-ui-vision-pro",
      type: ItemType.LINK,
      contentString: "Apple design lecture detailing deep layout rules, optical centers, eye tracking indicators, button states, spatial scale, and maintaining high comfort over long AR sessions.",
      metadata: {
        duration: "42:15",
        faviconUrl: "https://youtube.com/favicon.ico",
        author: "Apple Design Team",
        imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600"
      },
      tags: ["design", "ui", "inspiration"],
      isPinned: true
    },
    {
      title: "Why We Swapped TailwindCSS for Pure CSS Nesting & Custom Properties",
      url: "https://vercel.com/blog/tailwind-to-css-variables",
      type: ItemType.LINK,
      contentString: "Lee Robinson shares insights on Vercel's styling migrations. Highlighting lightning-fast compile times, native run-time custom themes, dynamic color systems, and CSS utility optimization.",
      metadata: {
        faviconUrl: "https://vercel.com/favicon.ico",
        author: "Lee Robinson",
        imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600"
      },
      tags: ["dev", "ui", "design"],
      isPinned: false
    },
    {
      title: "Levels.io on Solopreneurship & Speed of Validation",
      url: "https://x.com/levelsio/status/1782348239",
      type: ItemType.SOCIAL_CLIP,
      contentString: "Levelsio on Twitter: 'I launched over 70 SaaS ideas, but only 4 actually became profitable. Your speed of execution and landing page conversion is far more critical than polishing code for months.'",
      metadata: {
        faviconUrl: "https://x.com/favicon.ico",
        author: "levelsio",
        imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600"
      },
      tags: ["startup", "inspiration", "productivity"],
      isPinned: false
    },
    {
      title: "Prisma Transactions: RLS and Advanced Client Extensions",
      url: "https://prisma.io/docs/concepts/components/prisma-client/client-extensions",
      type: ItemType.LINK,
      contentString: "Prisma Client extensions permit multi-tenant scoping at query levels. Excellent for ensuring no query leaks data outside the authenticated workspace boundary:\n```typescript\nconst tenantPrisma = prisma.$extends({\n  query: {\n    $allModels: {\n      async findMany({ args, query }) {\n        args.where = { ...args.where, workspaceId };\n        return query(args);\n      }\n    }\n  }\n});\n```",
      metadata: {
        faviconUrl: "https://prisma.io/favicon.ico",
        author: "Prisma Devs",
        imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600"
      },
      tags: ["backend", "dev", "research"],
      isPinned: true
    },
    {
      title: "Benchmark Report: pgvector HNSW Index vs Dedicated Vector DBs",
      type: ItemType.FILE,
      contentString: "Comparison summary of pgvector vs Pinecone vs Qdrant.\n- pgvector (Postgres): Perfect up to 1-2M vectors. Keeps data ACID compliant in a single database. Under 40ms recall speed.\n- Qdrant/Pinecone: Superior scale for 10M+ items, but requires running independent syncing worker architecture, adding cost and operational friction.\n\nHypeMind Decision: Implement pgvector for initial launch to keep infrastructure lean and reliable.",
      aiSummary: "Analytical report comparing database vector extensions. pgvector is chosen for HypeMind to maintain ACID compliance and reduce operational complexity.",
      aiMetadata: { model: "Claude 3.5 Sonnet", complexity: "High", confidenceScore: 0.98 },
      tags: ["backend", "ai", "research"],
      isPinned: false
    },
    {
      title: "HypeMind Kickoff Sync - Agenda & Milestones",
      type: ItemType.JOURNAL,
      contentString: "Meeting Notes - May 30, 2026\n\nAttendees: Aniket, Lucifer, AI Copilot\n\nDiscussion:\n- Finalize Tiptap editor layout integrations.\n- Fixed authentication cookie path refresh loop.\n- Seed dev DB with comprehensive, realistic test datasets.\n\nNext Milestones:\n1. Hook up vector search query routes.\n2. Complete onboarding layout pages.\n3. Integrate search query models.",
      tags: ["planning", "startup"],
      isPinned: false
    },
    {
      title: "Custom React Hook: useDebounce.ts",
      type: ItemType.FILE,
      contentString: "Standard hook for search components and dynamic text updates:\n```typescript\nimport { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debounced, setDebounced] = useState<T>(value);\n  \n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebounced(value);\n    }, delay);\n    \n    return () => {\n      clearTimeout(handler);\n    };\n  }, [value, delay]);\n  \n  return debounced;\n}\n```",
      tags: ["dev", "snippet"],
      isPinned: false
    },
    {
      title: "Concept Design: Spatial Audio Focus Rooms",
      type: ItemType.QUICK_NOTE,
      contentString: "A futuristic virtual space where users join audio halls, hearing ambient white noise or soft keyboard taps panned in 3D based on mouse position. Promotes high concentration and sense of shared presence.",
      tags: ["ideas", "design", "ui"],
      isPinned: false
    },
    {
      title: "Discord's Epic Migration from Cassandra to ScyllaDB (1 Trillion Messages)",
      url: "https://discord.com/blog/how-discord-stores-trillions-of-messages",
      type: ItemType.LINK,
      contentString: "Discord's technical breakdown of moving a massive database off Cassandra to ScyllaDB. Highlights CPU utilization drops, garbage collection pause eliminations, and node clustering techniques.",
      metadata: {
        faviconUrl: "https://discord.com/favicon.ico",
        author: "Discord Engineering",
        imageUrl: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=600"
      },
      tags: ["backend", "database", "reading"],
      isPinned: false
    },
    {
      title: "The Feynman Learning Protocol",
      type: ItemType.QUICK_NOTE,
      contentString: "Four-step learning engine:\n1. Choose the topic to master.\n2. Teach it to a child (simplify terminology, explain in plain English).\n3. Find bottlenecks or areas of confusion, then return to source material.\n4. Condense explanation using analogies, diagrams, and clear definitions.",
      tags: ["productivity", "learning"],
      isPinned: false
    },
    {
      title: "Linear app Keyboard Shortcut Overlay Inspiration",
      url: "https://linear.app/shortcuts",
      type: ItemType.LINK,
      contentString: "Linear has the most beautiful, dark-themed, keyboard-first shortcut system. Users can navigate without taking their hands off the keys. We must emulate this layout for our command bar.",
      metadata: {
        faviconUrl: "https://linear.app/favicon.ico",
        author: "Linear Design",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600"
      },
      tags: ["design", "ui", "inspiration"],
      isPinned: false
    },
    {
      title: "How to Build a Custom Tiptap Text Highlighter Extension",
      url: "https://tiptap.dev/guide/custom-extensions",
      type: ItemType.LINK,
      contentString: "Guide on creating rich Tiptap extensions using custom HTML attributes, schema specs, input rules, and bubble menu actions. Crucial for the quick-note editor customization.",
      metadata: {
        faviconUrl: "https://tiptap.dev/favicon.ico",
        author: "Tiptap Authors",
        imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600"
      },
      tags: ["dev", "ui"],
      isPinned: false
    },
    {
      title: "SaaS Pricing Model Matrix for B2B Platforms",
      type: ItemType.FILE,
      contentString: "Analysis of scaling SaaS pricing:\n- Usage-Based: Highly aligned with value, but revenue can be highly volatile.\n- Per-User (Seats): Predictable, standard, but can deter viral growth within organizations.\n- Hybrid: Free tiers with small vector storage capacity, shifting to per-seat models for collaborative teams.\n\nHypeMind: Keep it hybrid. 100 free items, then $8/month for unlimited items and spatial graph features.",
      tags: ["startup", "ideas", "planning"],
      isPinned: false
    },
    {
      title: "Docker Compose for Multi-container Local Environments",
      type: ItemType.FILE,
      contentString: "Docker setup containing pgvector Postgres, Redis for BullMQ jobs, and a local MinIO bucket:\n```yaml\nversion: '3.8'\nservices:\n  db:\n    image: ankane/pgvector:latest\n    ports:\n      - '5432:5432'\n    environment:\n      POSTGRES_DB: hypemind_dev\n  redis:\n    image: redis:alpine\n    ports:\n      - '6379:6379'\n```",
      tags: ["devops", "backend", "dev"],
      isPinned: false
    },
    {
      title: "AI Agentic Workflows vs. Prompt Engineering (Andrew Ng)",
      url: "https://deeplearning.ai/the-batch/agentic-workflows/",
      type: ItemType.LINK,
      contentString: "Andrew Ng explains why agentic design patterns (reflexion, tool use, planning, multi-agent collaboration) generate much better LLM outputs than traditional single-prompt instructions.",
      metadata: {
        faviconUrl: "https://deeplearning.ai/favicon.ico",
        author: "Dr. Andrew Ng",
        imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600"
      },
      tags: ["ai", "research", "reading"],
      isPinned: false
    },
    {
      title: "User Interview #14 Highlights - Indie Hacker Feedback",
      type: ItemType.JOURNAL,
      contentString: "- User expressed that browser extensions are the primary friction point. Saving notes must be 1-click.\n- Tagging needs keyboard auto-completion with fast recall.\n- Visual spatial graph is highly anticipated but must load in under 1 second.",
      tags: ["research", "startup"],
      isPinned: false
    },
    {
      title: "Hydration Error Debugging in Next.js 15 & React 19",
      type: ItemType.QUICK_NOTE,
      contentString: "Always watch out for timezone mismatches when formatting dates server-side vs client-side. The mismatch causes a hydration bailout error. Fix by using custom mounted states or `suppressHydrationWarning` on specific nodes.",
      tags: ["bug", "dev"],
      isPinned: false
    },
    {
      title: "Book Highlights: Deep Work by Cal Newport",
      type: ItemType.JOURNAL,
      contentString: "Cal Newport's core principles:\n- High-Quality Work Produced = (Time Spent) x (Intensity of Focus)\n- Eliminate all shallow distractions (social media, emails).\n- Train your cognitive capacity to sustain 90-minute hyper-focused blocks.\n- Productive meditation: think about complex engineering problems during physical walks.",
      tags: ["productivity", "reading"],
      isPinned: false
    },
    {
      title: "Cool Typography Scale: Inter + Playfair Display combo",
      type: ItemType.QUICK_NOTE,
      contentString: "Clean Inter font (sans-serif) for small UI dashboard elements, combined with elegant Playfair Display (serif) for marketing hero headings. Gives a highly premium, editorial feel.",
      tags: ["design", "ui"],
      isPinned: false
    },
    {
      title: "How Postgres Executes Full-Text Search Queries under the Hood",
      url: "https://postgresqltutorial.com/postgresql-full-text-search/",
      type: ItemType.LINK,
      contentString: "Excellent technical breakdown of `tsvector`, `tsquery`, stemmers, and GIN indexes in PostgreSQL. Essential for building the keyword-search backup systems in HypeMind.",
      metadata: {
        faviconUrl: "https://postgresql.org/favicon.ico",
        author: "Postgres Pro",
        imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600"
      },
      tags: ["backend", "database", "dev"],
      isPinned: false
    },
    {
      title: "Post-launch Growth Loops & Viral Hooks",
      type: ItemType.QUICK_NOTE,
      contentString: "- Idea: Public Share links that show the spatial graph interactively. When users click it, they get prompted with 'Create your own brain graph in 10 seconds'.\n- Integrate Twitter/X share cards with gorgeous dynamic graph image generations.",
      tags: ["startup", "ideas", "marketing"],
      isPinned: false
    },
    {
      title: "Micro-interactions: Confetti Burst on Checkbox Complete",
      type: ItemType.QUICK_NOTE,
      contentString: "Using canvas-confetti, fire a subtle, color-matched explosion of exactly 8 small particles panned towards the cursor whenever a task checkbox is clicked. Add a slight pop sound effect.",
      tags: ["design", "ui", "inspiration"],
      isPinned: false
    },
    {
      title: "Vite HMR Websocket Failure Debugging",
      type: ItemType.QUICK_NOTE,
      contentString: "If hot module replacement (HMR) breaks, it's usually because of circular dependencies. Check the imports in `store.ts`.",
      tags: ["bug", "dev"],
      isPinned: false
    },
    {
      title: "Regex Helper Cheat Sheet for Common Scrapers",
      type: ItemType.QUICK_NOTE,
      contentString: "Extracting URLs: `https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)`\nExtracting Hashtags: `#\\w+`",
      tags: ["dev", "snippet"],
      isPinned: false
    },
    {
      title: "Checklist: High-performance API Guidelines",
      type: ItemType.QUICK_NOTE,
      contentString: "1. Compress response bodies using gzip/brotli.\n2. Add cache-control headers on static metadata queries.\n3. Utilize connection pools properly, closing db clients on process termination.\n4. Avoid N+1 database queries by using relational joins/includes in Prisma.",
      tags: ["backend", "productivity"],
      isPinned: false
    }
  ];

  for (let i = 0; i < inboxData.length; i++) {
    const data = inboxData[i];
    const item = await prisma.item.create({
      data: {
        workspaceId,
        title: data.title,
        type: data.type,
        contentString: data.contentString,
        url: data.url || null,
        metadata: data.metadata || null,
        aiSummary: data.aiSummary || null,
        aiMetadata: data.aiMetadata || null,
        createdById: user.id,
        isPinned: data.isPinned,
        pinnedAt: data.isPinned ? new Date() : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
        status: ItemStatus.ACTIVE
      }
    });

    if (data.tags && data.tags.length > 0) {
      for (const t of data.tags) {
        const tagId = tagMap.get(t);
        if (tagId) {
          await prisma.itemTag.create({
            data: { itemId: item.id, tagId }
          });
        }
      }
    }
  }

  // 5. Seed Quick Notes (type = QUICK_NOTE, projectId != null)
  console.log('Seeding 25+ rich Quick Notes associated with projects...');
  const quickNotesData = [
    {
      title: "Fix Next-Auth refresh loop bug",
      contentString: "Issue: JWT expired state keeps requesting token renewals, getting a 401, clearing state, redirecting to login, and middleware bouncing user back. \n\nSolution: \n- Make Next.js middleware depend only on client signal cookie `hm_logged_in`.\n- Make login page clear all cookies on login load.\n- Ensure server-side cookie deletion matches options exactly.",
      tags: ["bug", "dev", "planning"],
      projectSlug: "hypemind-launch",
      isPinned: true
    },
    {
      title: "Vector DB Chunking Specs",
      contentString: "We should use character-level text splitting first:\n- Chunk Size: 1000 characters\n- Overlap Size: 150 characters\n- Embeddings Model: `voyage-4` (1024 dimensions)\n- Database index type: pgvector HNSW with cosine distance metric.\n\nMake sure to run migration: `CREATE EXTENSION IF NOT EXISTS vector;` in pgadmin.",
      tags: ["ai", "backend", "research"],
      projectSlug: "ai-rag-engine",
      isPinned: true
    },
    {
      title: "UI Design Tokens & Palette",
      contentString: "Harsh white or absolute black grids look cheap. Let's use customized dark mode HSL scales:\n- Background: `hsl(224, 20%, 8%)` (Soft charcoal)\n- Surface Cards: `hsl(224, 18%, 12%)` (Soft dark grey)\n- Borders: `hsl(224, 12%, 18%)`\n- Accent / Primaries: `hsl(263, 70%, 50%)` (Deep Indigo Blue/Purple)\n- Typography Muted: `hsl(220, 9%, 60%)`",
      tags: ["design", "ui"],
      projectSlug: "design-ux-overhaul",
      isPinned: true
    },
    {
      title: "Indie Hacker Validation Framework",
      contentString: "1. Find popular Twitter threads talking about problems.\n2. Search Reddit subreddits like r/productivity, r/roamresearch for complains.\n3. Create a landing page mockup with interactive spatial graph gif.\n4. Drive 500 visitors using organic threads. Target > 10% email conversion signups.",
      tags: ["startup", "ideas"],
      projectSlug: "personal-brain-hub",
      isPinned: true
    },
    {
      title: "Claude API Proxy controller",
      contentString: "Express route handling prompt inputs:\n```typescript\nimport Anthropic from '@anthropic-ai/sdk';\n\nexport const synthesize = async (req: Request, res: Response) => {\n  const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });\n  const msg = await anthropic.messages.create({\n    model: 'claude-3-5-sonnet-20241022',\n    max_tokens: 1024,\n    messages: [{ role: 'user', content: req.body.prompt }]\n  });\n  res.json({ result: msg.content[0].text });\n};\n```",
      tags: ["backend", "ai", "dev"],
      projectSlug: "ai-rag-engine",
      isPinned: false
    },
    {
      title: "Onboarding Confetti & Delight layout",
      contentString: "Add interactive step-by-step wizard pages:\n- Step 1: Tell us your primary role (e.g. Developer, Student, Founder).\n- Step 2: Choose 3 initial colored tags.\n- Step 3: Link your first inbox link. When complete, light up screen with smooth CSS canvas particles and redirect to `/dashboard`.",
      tags: ["design", "ui", "inspiration"],
      projectSlug: "design-ux-overhaul",
      isPinned: false
    },
    {
      title: "BullMQ Job Worker Configuration",
      contentString: "Queue for processing vector migrations and indexing: \n```typescript\nimport { Queue, Worker } from 'bullmq';\n\nconst vectorQueue = new Queue('vector-indexing', { connection });\n\nconst worker = new Worker('vector-indexing', async (job) => {\n  console.log(`Processing embedding job: ${job.id}`);\n  const { text, itemId } = job.data;\n  await generateEmbeddingsService(itemId, text);\n}, { connection });\n```",
      tags: ["backend", "dev"],
      projectSlug: "ai-rag-engine",
      isPinned: false
    },
    {
      title: "Productivity Books: Mindset & Habits",
      contentString: "Books to summarize this month:\n1. Atomic Habits by James Clear (Systems over goals)\n2. Deep Work by Cal Newport (Hyper-focus)\n3. Show Your Work by Austin Kleon (Share learning transparently)\n4. Thinking, Fast and Slow by Daniel Kahneman (Cognitive biases)",
      tags: ["productivity", "reading", "learning"],
      projectSlug: "personal-brain-hub",
      isPinned: false
    },
    {
      title: "Landing Page Hero Taglines",
      contentString: "- 'The second brain that actually thinks with you.'\n- 'Organize and connect your digital chaos at the speed of thought.'\n- 'An AI-powered workspace that visualizes spatial relationships in your notes.'\n- 'Your ideas, articles, and bookmarks. Connected.'",
      tags: ["ideas", "marketing", "copy"],
      projectSlug: "hypemind-launch",
      isPinned: false
    },
    {
      title: "Vite dev server slow loads debug",
      contentString: "Problem: initial dev load takes 6 seconds.\nFixes:\n- Add `node_modules` and `.next` to vite exclude optimization list.\n- Turn off heavy source map generations during local dev settings.\n- Upgrade Node to >= 20 which runs V8 performance compile improvements.",
      tags: ["bug", "dev"],
      projectSlug: "hypemind-launch",
      isPinned: false
    },
    {
      title: "Checklist: Launch Requirements",
      contentString: "- [x] Migrate postgres db schema to cloud.\n- [/] Finalize spatial audio white noise loops.\n- [ ] Configure BullMQ redis queue on AWS.\n- [ ] Set up Resend API domains and verify.\n- [ ] Test mobile responsive layout boundaries.",
      tags: ["planning", "startup"],
      projectSlug: "hypemind-launch",
      isPinned: false
    },
    {
      title: "Micro-animation: Hover cards scaling",
      contentString: "Apply smooth transitions on dashboard catalog cards:\n```css\n.card {\n  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;\n}\n.card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 24px rgba(0,0,0,0.15);\n}\n```",
      tags: ["design", "ui"],
      projectSlug: "design-ux-overhaul",
      isPinned: false
    },
    {
      title: "Redis cluster dev environment credentials",
      contentString: "Local redis docker url: `redis://localhost:6379`\nProduction redis AWS cache cluster: secure via TLS and password authentication, configured under environment key `REDIS_URL`.",
      tags: ["backend", "devops"],
      projectSlug: "hypemind-launch",
      isPinned: false
    },
    {
      title: "Prompt Template: Auto-categorize tagger",
      contentString: "Instructions for Claude parsing text:\n```json\n{\n  \"role\": \"system\",\n  \"content\": \"Classify the following document into exactly 1-3 of these categories: dev, ui, design, ai, startup, reading. Respond only in raw JSON format matching: { 'tags': ['...'] }\"\n}\n```",
      tags: ["ai", "research"],
      projectSlug: "ai-rag-engine",
      isPinned: false
    },
    {
      title: "Keyboard Shortcuts Mapping Specs",
      contentString: "Shortcut mappings to implement globally:\n- `g i`: Go to Inbox page\n- `g q`: Go to Quick Notes page\n- `g d`: Go to Dashboard catalog\n- `n`: Trigger create new Quick Note popover\n- `esc`: Close active dialogs or overlays",
      tags: ["ui", "design", "planning"],
      projectSlug: "design-ux-overhaul",
      isPinned: false
    },
    {
      title: "SQL Query Optimization: Item table joins",
      contentString: "Symptoms: finding items linked to tags took 350ms.\nFix: Add index on workspaceId and itemId composite keys. In Prisma, this maps to `@@index([workspaceId, id])` inside the model schema block.",
      tags: ["bug", "backend", "database"],
      projectSlug: "hypemind-launch",
      isPinned: false
    },
    {
      title: "Blog Post Outline: Building with pgvector",
      contentString: "Title: How We built HypeMind's Semantic Vector Search using pure Postgres pgvector.\n\nSection 1: The architecture choices (why dedicated DBs are overkill for MVPs).\nSection 2: Embedding pipelines using Claude & Voyage.\nSection 3: Database setup, schema, SQL indexing.\nSection 4: Latency results & cost analysis.",
      tags: ["startup", "reading", "ideas"],
      projectSlug: "personal-brain-hub",
      isPinned: false
    },
    {
      title: "UX: Spatial audio player buttons",
      contentString: "Buttons should have standard dark grey rounded icons, changing to neon purple glows on hover/active states. Add subtle CSS scale pop down `active:scale-95` on mouse click.",
      tags: ["design", "ui"],
      projectSlug: "design-ux-overhaul",
      isPinned: false
    },
    {
      title: "BullMQ queue listener errors",
      contentString: "Issue: Redis connection drops cause jobs to freeze in active lists indefinitely.\nFix: Configure `maxStalledCount: 3` and auto-retry options inside Worker configurations to reschedule jobs on failure.",
      tags: ["bug", "backend"],
      projectSlug: "ai-rag-engine",
      isPinned: false
    },
    {
      title: "HypeMind Marketing Strategy",
      contentString: "- Launch on ProductHunt on a Tuesday at midnight PST.\n- Share build in public updates on Twitter/X with beautiful visual demos.\n- Leverage Reddit r/selfhosted, r/Notion to showcase speed differences.",
      tags: ["startup", "marketing", "planning"],
      projectSlug: "hypemind-launch",
      isPinned: false
    },
    {
      title: "Tiptap Markdown auto-shortcuts specs",
      contentString: "Default editor extensions for fast markdown typing:\n- `* ` or `- ` -> auto-starts bullet lists\n- `1. ` -> auto-starts ordered list block\n- `# ` -> converts paragraph into Heading 1\n- `> ` -> starts rich blockquote/callout block",
      tags: ["ui", "dev", "snippet"],
      projectSlug: "design-ux-overhaul",
      isPinned: false
    },
    {
      title: "Voyage AI embedder parameters",
      contentString: "To get highest search quality:\n- Model: `voyage-4`\n- Input Type: `document` for indexing notes, `query` for active user search inputs.\n- Ensure text chunks are trimmed and lowercased before calling model embeddings API.",
      tags: ["ai", "research", "backend"],
      projectSlug: "ai-rag-engine",
      isPinned: false
    },
    {
      title: "Personal health & productivity routines",
      contentString: "- Drink 1L of water first thing in the morning.\n- Run 3k on alternate days to reset physical capacity.\n- Write down 3 main priorities on a post-it before starting computer dev work.\n- Sleep by 11:30 PM to maintain consistent focus states.",
      tags: ["productivity", "learning"],
      projectSlug: "personal-brain-hub",
      isPinned: false
    },
    {
      title: "Prisma schema cleanups for v1.1",
      contentString: "Planned migrations:\n- Move `contentString` to native Postgres TEXT type (complete).\n- Add a dedicated `favorite` boolean column on Item model.\n- Build a composite index on User settings for fast onboarding queries.",
      tags: ["backend", "database", "planning"],
      projectSlug: "hypemind-launch",
      isPinned: false
    },
    {
      title: "Creative idea: Graph view custom physics",
      contentString: "- Use d3-force clustering to group items visually by tags.\n- Hovering over a tag highlights all connected items while dimming others.\n- Left-clicking opens a quick-preview side panel.",
      tags: ["ideas", "design", "ui"],
      projectSlug: "design-ux-overhaul",
      isPinned: false
    }
  ];

  for (let i = 0; i < quickNotesData.length; i++) {
    const data = quickNotesData[i];
    const projectId = projectMap.get(data.projectSlug);
    if (!projectId) continue;

    const item = await prisma.item.create({
      data: {
        workspaceId,
        title: data.title,
        type: ItemType.QUICK_NOTE,
        contentString: data.contentString,
        createdById: user.id,
        projectId,
        isPinned: data.isPinned,
        pinnedAt: data.isPinned ? new Date() : null,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000),
        status: ItemStatus.ACTIVE
      }
    });

    if (data.tags && data.tags.length > 0) {
      for (const t of data.tags) {
        const tagId = tagMap.get(t);
        if (tagId) {
          await prisma.itemTag.create({
            data: { itemId: item.id, tagId }
          });
        }
      }
    }
  }

  console.log('✅ Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Seed script crash:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
