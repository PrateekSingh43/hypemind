import { ItemType, ItemStatus } from './generated/enums';
import { prisma } from './index';

async function main() {
  const email = 'lucifermornigstarrr123@gmail.com';

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspaces: true, memberships: { include: { workspace: true } } }
  });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  // Find a workspace for this user
  let workspaceId = user.workspaces[0]?.id;
  if (!workspaceId) {
    const memberWorkspace = user.memberships[0]?.workspace;
    workspaceId = memberWorkspace?.id;
  }

  if (!workspaceId) {
    console.error(`User has no workspaces. Please create one first.`);
    process.exit(1);
  }

  console.log(`Seeding data for user ${user.name || email} in workspace ${workspaceId}`);

  // Helpers
  const randomDate = (startDaysAgo: number, endDaysAgo: number) => {
    const date = new Date();
    const daysAgo = Math.floor(Math.random() * (startDaysAgo - endDaysAgo + 1) + endDaysAgo);
    const hours = Math.floor(Math.random() * 24);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hours);
    return date;
  };

  // 1. INBOX ITEMS (25 items)
  const inboxItems = [
    {
      title: "Why React Server Components Change Everything",
      type: ItemType.LINK,
      contentString: "A deep dive into RSCs. They allow you to fetch data natively on the server without shipping the bundle to the client. This dramatically reduces JS payload.",
      url: "https://youtube.com/watch?v=react-server-components",
      tags: ["react", "webdev", "architecture"],
      createdAt: randomDate(30, 25),
      updatedAt: randomDate(25, 20),
    },
    {
      title: "Vite + Next.js Hybrid Architecture",
      type: ItemType.PAGE,
      contentString: "# Research\nCan we use Vite for SPA routes and Next.js for SSR routes? Needs investigation on how they share state.",
      tags: ["research", "build-tools"],
      createdAt: randomDate(20, 15),
    },
    {
      title: "Tailwind CSS v4 Roadmap",
      type: ItemType.LINK,
      url: "https://tailwindcss.com/blog/tailwindcss-v4",
      contentString: "Looks like they are rewriting the engine in Rust. Massive performance gains expected.",
      tags: ["css", "frontend"],
      createdAt: randomDate(10, 5),
    },
    {
      title: "Meeting Notes: Sync with Design Team",
      type: ItemType.PAGE,
      contentString: "- Need to finalize primary color palette by Friday.\n- Dropdown shadow is too harsh, soften it to `shadow-md`.\n- Dark mode tokens need a review.",
      tags: ["meeting", "design"],
      createdAt: randomDate(5, 2),
    },
    {
      title: "Y Combinator Paul Graham Essay: How to do great work",
      type: ItemType.LINK,
      url: "http://paulgraham.com/greatwork.html",
      contentString: "Key takeaway: Work on something you are deeply interested in. Curiosity is the best engine.",
      tags: ["startup", "inspiration"],
      createdAt: randomDate(40, 30),
    },
    {
      title: "Interesting Thread on Postgres Indexing",
      type: ItemType.SOCIAL_CLIP,
      url: "https://twitter.com/postgres/status/123",
      contentString: "Always use B-Tree for standard equality and range queries, but GiST is better for full-text search.",
      tags: ["database", "performance"],
      createdAt: randomDate(15, 10),
    },
    {
      title: null,
      type: ItemType.LINK,
      url: "https://news.ycombinator.com",
      contentString: "Check HackerNews top daily",
      tags: ["daily", "reading"],
      createdAt: randomDate(5, 1),
    },
    {
      title: "AI Summary: State of AI 2026",
      type: ItemType.PAGE,
      contentString: "AI has moved from prompt engineering to agentic workflows. Agents now autonomously plan, write, and execute code with minimal human intervention. Next step: multi-agent collaboration.",
      tags: ["ai", "tech-trends"],
      createdAt: randomDate(8, 2),
    },
    {
      title: "Productivity Tip: The 2-Minute Rule",
      type: ItemType.QUICK_NOTE,
      contentString: "If a task takes less than two minutes, do it immediately. Don't put it in the backlog.",
      tags: ["productivity", "habits"],
      createdAt: randomDate(50, 40),
    },
    {
      title: "Auth.js Integration Docs",
      type: ItemType.FILE,
      url: "https://authjs.dev/reference/core",
      contentString: "Need to implement refresh token rotation as per their new security guidelines.",
      tags: ["auth", "security", "documentation"],
      createdAt: randomDate(12, 10),
    },
    {
      title: "Code Snippet: Debounce Hook",
      type: ItemType.PAGE,
      contentString: "```typescript\nexport function useDebounce(value, delay) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debounced;\n}\n```",
      tags: ["react", "snippet", "typescript"],
      createdAt: randomDate(60, 50),
    },
    {
      title: "Startup Idea: AI-powered Calendar",
      type: ItemType.PAGE,
      contentString: "A calendar that automatically reschedules your low-priority tasks when a high-priority meeting is booked. Integrates with Notion to fetch task priorities.",
      tags: ["startup-idea", "brainstorm"],
      createdAt: randomDate(20, 18),
    },
    {
      title: "UI Inspiration: Glassmorphism Navbar",
      type: ItemType.LINK,
      url: "https://dribbble.com/shots/123-glassmorphism",
      contentString: "Love how the blur interacts with the gradient background. Let's try this in the next dashboard iteration.",
      tags: ["ui", "design", "inspiration"],
      createdAt: randomDate(25, 20),
    },
    {
      title: null,
      type: ItemType.PAGE,
      contentString: "Don't forget to cancel the AWS free tier account before the 30th!!!",
      tags: ["reminder", "urgent"],
      createdAt: randomDate(2, 1),
    },
    {
      title: "Supabase vs Firebase for next project",
      type: ItemType.PAGE,
      contentString: "Supabase gives raw Postgres access which is huge. Firebase real-time is easier out of the box but the NoSQL structure becomes a pain later.",
      tags: ["architecture", "backend"],
      createdAt: randomDate(14, 12),
    },
    {
      title: "Best fonts for coding 2026",
      type: ItemType.LINK,
      url: "https://github.com/tonsky/FiraCode",
      contentString: "Fira Code still reigns supreme for ligatures, but JetBrains Mono is a close second.",
      tags: ["setup", "typography"],
      createdAt: randomDate(100, 90),
    },
    {
      title: "Figma Variables Tutorial",
      type: ItemType.SOCIAL_CLIP,
      url: "https://youtube.com/figma-variables",
      contentString: "Watch this to understand how to map color tokens to dark mode automatically.",
      tags: ["design", "tutorial", "figma"],
      createdAt: randomDate(30, 25),
    },
    {
      title: "SaaS Pricing Models",
      type: ItemType.PAGE,
      contentString: "1. Flat rate (too simple)\n2. Tiered (Good, Better, Best)\n3. Usage-based (hard to predict revenue)\n4. Per-seat (standard for B2B)",
      tags: ["business", "saas"],
      createdAt: randomDate(45, 40),
    },
    {
      title: "Dockerizing a Node App",
      type: ItemType.FILE,
      contentString: "Always use multi-stage builds. `FROM node:18-alpine AS builder`. It reduces the final image size by like 80%.",
      tags: ["devops", "docker"],
      createdAt: randomDate(5, 3),
    },
    {
      title: "My favorite VS Code Extensions",
      type: ItemType.PAGE,
      contentString: "- Error Lens\n- Prettier\n- Tailwind CSS IntelliSense\n- Prisma\n- GitLens",
      tags: ["tools", "setup"],
      createdAt: randomDate(60, 50),
    },
    {
      title: "Serverless Cold Starts",
      type: ItemType.LINK,
      url: "https://vercel.com/blog/serverless-cold-starts",
      contentString: "Vercel's new edge runtime basically eliminates cold starts, but you can't use Node APIs.",
      tags: ["performance", "serverless"],
      createdAt: randomDate(20, 10),
    },
    {
      title: "Random Brain Dump",
      type: ItemType.PAGE,
      contentString: "What if we built a physical keyboard where every key has an OLED screen? Like the StreamDeck but for coding.",
      tags: ["random", "ideas"],
      createdAt: randomDate(1, 0),
    },
    {
      title: "Stripe API Webhooks",
      type: ItemType.LINK,
      url: "https://stripe.com/docs/webhooks",
      contentString: "Make sure to verify the Stripe signature in the webhook endpoint to prevent replay attacks.",
      tags: ["payments", "security"],
      createdAt: randomDate(3, 2),
    },
    {
      title: "Book Notes: Atomic Habits",
      type: ItemType.PAGE,
      contentString: "Habits are the compound interest of self-improvement. Focus on systems, not goals.",
      tags: ["books", "habits"],
      createdAt: randomDate(120, 110),
    },
    {
      title: "Next.js App Router Caching Gotchas",
      type: ItemType.PAGE,
      contentString: "Fetch requests are cached by default. Use `{ cache: 'no-store' }` if you want dynamic data.",
      tags: ["nextjs", "react"],
      createdAt: randomDate(15, 12),
    }
  ];

  // 2. QUICK NOTES (25 items)
  const quickNotes = [
    {
      title: "Groceries",
      contentString: "- Milk\n- Eggs\n- Avocados\n- Sourdough bread\n- Coffee beans",
      tags: ["personal", "shopping"],
      createdAt: randomDate(2, 1),
    },
    {
      title: "Fix bug in header",
      contentString: "The mobile menu hamburger icon is overflowing on iPhone SE. Need to add `shrink-0` to the svg wrapper.",
      tags: ["bug", "ui"],
      createdAt: randomDate(5, 4),
    },
    {
      title: "App name ideas",
      contentString: "1. FlowState\n2. SyncMind\n3. HypeMind (winner!)\n4. Nexus\n5. Orbit",
      tags: ["brainstorming"],
      createdAt: randomDate(100, 90),
    },
    {
      title: null,
      contentString: "Call Mom for her birthday tomorrow!",
      tags: ["personal", "urgent"],
      createdAt: randomDate(1, 0),
    },
    {
      title: "Prisma Schema update",
      contentString: "Remember to run `pnpm db:push` after adding the new Project status enum. Otherwise the API will crash.",
      tags: ["dev", "reminder"],
      createdAt: randomDate(10, 8),
    },
    {
      title: "Marketing tagline",
      contentString: "\"The second brain that actually thinks with you.\" - Is this too cheesy? Maybe \"Organize at the speed of thought.\"",
      tags: ["marketing", "copy"],
      createdAt: randomDate(30, 25),
    },
    {
      title: "Books to read",
      contentString: "- The Pragmatic Programmer\n- Thinking, Fast and Slow\n- Designing Data-Intensive Applications",
      tags: ["reading-list"],
      createdAt: randomDate(60, 50),
    },
    {
      title: "React hook rules",
      contentString: "Never call hooks inside loops, conditions, or nested functions. Always at the top level.",
      tags: ["react", "learning"],
      createdAt: randomDate(20, 15),
    },
    {
      title: "Workout plan",
      contentString: "Mon: Push (Chest/Triceps/Shoulders)\nWed: Pull (Back/Biceps)\nFri: Legs (Squats/Deadlifts)",
      tags: ["health", "fitness"],
      createdAt: randomDate(40, 30),
    },
    {
      title: "AI Prompt for code review",
      contentString: "You are a senior principal engineer. Review this TypeScript code for performance bottlenecks, security flaws, and type safety issues. Provide actionable feedback with code snippets.",
      tags: ["ai", "prompts"],
      createdAt: randomDate(12, 10),
    },
    {
      title: null,
      contentString: "Need to renew passport before December trip.",
      tags: ["personal"],
      createdAt: randomDate(80, 70),
    },
    {
      title: "UI Animation idea",
      contentString: "When a task is checked off, have a subtle confetti particle effect burst from the checkbox. Like 3-4 small particles. Not overwhelming.",
      tags: ["design", "ui", "delight"],
      createdAt: randomDate(15, 12),
    },
    {
      title: "Tech debt to fix",
      contentString: "- Move local storage logic to context\n- Add proper error boundaries\n- Replace `any` types in project service",
      tags: ["refactoring", "todo"],
      createdAt: randomDate(6, 5),
    },
    {
      title: "Podcast recommendations",
      contentString: "- Lex Fridman\n- Huberman Lab\n- Syntax.fm\n- The Primeagen",
      tags: ["podcasts"],
      createdAt: randomDate(25, 20),
    },
    {
      title: "Vite config issue",
      contentString: "If hot module replacement (HMR) breaks, it's usually because of circular dependencies. Check the imports in `store.ts`.",
      tags: ["debugging", "vite"],
      createdAt: randomDate(18, 16),
    },
    {
      title: "Startup Pitch",
      contentString: "Problem: Context switching kills productivity.\nSolution: A unified inbox for tasks, notes, and links that categorizes itself via AI.",
      tags: ["startup", "pitch"],
      createdAt: randomDate(90, 80),
    },
    {
      title: "Questions for 1-on-1",
      contentString: "- What is the expectation for the Q3 roadmap?\n- Can we get licenses for GitHub Copilot?\n- Feedback on my recent PRs?",
      tags: ["work", "meeting"],
      createdAt: randomDate(3, 2),
    },
    {
      title: null,
      contentString: "```css\n.glass {\n  background: rgba(255, 255, 255, 0.1);\n  backdrop-filter: blur(10px);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n}\n```",
      tags: ["css", "snippet"],
      createdAt: randomDate(50, 45),
    },
    {
      title: "Gift ideas for Sarah",
      contentString: "- Kindle Oasis\n- Matcha making set\n- Mechanical keyboard (Keychron?)",
      tags: ["personal", "ideas"],
      createdAt: randomDate(14, 10),
    },
    {
      title: "Regex for email",
      contentString: "`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$` - standard, good enough for most use cases.",
      tags: ["regex", "snippet"],
      createdAt: randomDate(35, 30),
    },
    {
      title: "Next.js Middleware",
      contentString: "Middleware runs on Edge runtime! You can't use node `fs` or `crypto` there. Use `jose` for JWT verification.",
      tags: ["nextjs", "learning"],
      createdAt: randomDate(22, 19),
    },
    {
      title: "Packing List",
      contentString: "[ ] Laptop charger\n[ ] Toothbrush\n[ ] Running shoes\n[ ] Kindle\n[ ] Sunglasses",
      tags: ["travel", "checklist"],
      createdAt: randomDate(4, 3),
    },
    {
      title: "Meeting notes template",
      contentString: "## Attendees\n\n## Agenda\n\n## Action Items\n- [ ] Task (Assignee)\n\n## Decisions",
      tags: ["template", "work"],
      createdAt: randomDate(105, 100),
    },
    {
      title: "Feature Flag implementation",
      contentString: "Let's use a simple JSON object in the database for now. No need for LaunchDarkly until we have at least 10k MAU.",
      tags: ["architecture", "decisions"],
      createdAt: randomDate(28, 25),
    },
    {
      title: "Joke",
      contentString: "Why do programmers prefer dark mode?\nBecause light attracts bugs.",
      tags: ["humor"],
      createdAt: randomDate(2, 1),
    }
  ];

  console.log('Seeding Inbox Items...');
  let inboxCount = 0;
  for (const item of inboxItems) {
    const createdItem = await prisma.item.create({
      data: {
        workspaceId,
        createdById: user.id,
        title: item.title,
        type: item.type,
        contentString: item.contentString,
        url: item.url,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
        tags: {
          create: item.tags?.map(tagName => ({
            tag: {
              connectOrCreate: {
                where: { workspaceId_name: { workspaceId, name: tagName } },
                create: { workspaceId, name: tagName }
              }
            }
          })) || []
        }
      }
    });
    inboxCount++;
  }

  console.log('Seeding Quick Notes...');
  let qnCount = 0;
  for (const qn of quickNotes) {
    await prisma.item.create({
      data: {
        workspaceId,
        createdById: user.id,
        title: qn.title,
        type: ItemType.QUICK_NOTE,
        contentString: qn.contentString,
        createdAt: qn.createdAt,
        updatedAt: qn.createdAt,
        tags: {
          create: qn.tags?.map(tagName => ({
            tag: {
              connectOrCreate: {
                where: { workspaceId_name: { workspaceId, name: tagName } },
                create: { workspaceId, name: tagName }
              }
            }
          })) || []
        }
      }
    });
    qnCount++;
  }

  console.log(`✅ Successfully seeded ${inboxCount} Inbox Items and ${qnCount} Quick Notes!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
