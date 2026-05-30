import 'dotenv/config';
import { prisma } from '@repo/db';

async function main() {
  const email = 'lucifermornigstarrr123@gmail.com';
  console.log(`Finding user with email: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspaces: true }
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  let workspaceId = user.workspaces[0]?.id;
  if (!workspaceId) {
    // maybe try memberships
    const member = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true }
    });
    if (member) {
      workspaceId = member.workspaceId;
    } else {
      console.error(`User has no workspaces`);
      process.exit(1);
    }
  }

  console.log(`Using workspace: ${workspaceId}`);

  // Tags
  const tagsToCreate = ['ui', 'bug', 'backend', 'ai', 'planning', 'inspiration', 'productivity', 'startup', 'dev', 'reading', 'design', 'research', 'ideas'];
  const tagMap = new Map<string, string>();
  
  for (const t of tagsToCreate) {
    let tag = await prisma.tag.findUnique({
      where: { workspaceId_name: { workspaceId, name: t } }
    });
    if (!tag) {
      tag = await prisma.tag.create({
        data: { workspaceId, name: t, color: '#4a90e2' }
      });
    }
    tagMap.set(t, tag.id);
  }

  const inboxData = [
    { title: "Building a Modern Next.js App Architecture", url: "https://nextjs.org/docs/app", type: "LINK", tags: ["dev", "backend"], contentString: "Great reference for App router patterns. Need to review the caching strategy." },
    { title: "Supabase vs Firebase: 2026 Comparison", url: "https://supabase.com/blog/supabase-vs-firebase", type: "LINK", tags: ["backend", "startup"], contentString: "Interesting read. Supabase seems to have better Edge Function support now." },
    { title: "Design Systems in Figma", type: "PAGE", tags: ["design", "ui"], contentString: "We should standardize our spacing and color tokens. Maybe follow Radix UI's scale." },
    { title: "Y-Combinator Startup Playbook", url: "https://youtube.com/watch?v=startup", type: "LINK", tags: ["startup", "inspiration"], contentString: "Focus on user retention first. Don't scale prematurely." },
    { title: "Astro 4.0 Release Notes", url: "https://astro.build/blog", type: "LINK", tags: ["dev", "reading"], contentString: "View transitions are native now! We should experiment with this for the marketing site." },
    { title: "Cool CSS Grid Tricks", url: "https://css-tricks.com", type: "SOCIAL_CLIP", tags: ["ui", "dev"], contentString: "Ah this is how you make a responsive grid without media queries: grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));" },
    { title: "Productivity System Setup", type: "PAGE", tags: ["productivity", "planning"], contentString: "1. Capture everything immediately.\n2. Organize at the end of the day.\n3. Review weekly." },
    { title: "How to use Prisma with Edge Functions", url: "https://prisma.io/docs/edge", type: "LINK", tags: ["backend"], contentString: "Need to use the Prisma Edge client and a connection pooler like PgBouncer or Supavisor." },
    { title: "Meeting Notes: Q3 Roadmap", type: "PAGE", tags: ["planning", "startup"], contentString: "Focus for Q3:\n- Launch AI features\n- Improve onboarding flow\n- Reduce latency by 20%" },
    { title: "New Landing Page Inspiration", type: "SOCIAL_CLIP", tags: ["design", "inspiration"], contentString: "Love the glassmorphism effects on Linear's new landing page. Let's try something similar for the hero section." },
    { title: "Understanding React Server Components", url: "https://react.dev", type: "LINK", tags: ["dev"], contentString: "RSC is a game changer. Keep client components as leaves in the component tree." },
    { title: "Docker Compose for Local Dev", type: "FILE", tags: ["backend", "dev"], contentString: "version: '3'\nservices:\n  db:\n    image: postgres:15" },
    { title: "AI Prompt Engineering Guide", url: "https://openai.com/prompt-guide", type: "LINK", tags: ["ai", "reading"], contentString: "Always give the AI a persona and be specific about the output format." },
    { title: "User Interview #12 Notes", type: "PAGE", tags: ["research", "startup"], contentString: "User mentioned they want an easier way to tag multiple items at once. Bulk editing is a priority." },
    { title: "Fixing the hydration error", type: "PAGE", tags: ["bug", "dev"], contentString: "The mismatch is caused by the date formatter running on the server with UTC and client with local time. Need to suppress hydration warning or use a mounted state." },
    { title: "Tailwind v4 alpha features", url: "https://tailwindcss.com/blog/tailwindcss-v4-alpha", type: "LINK", tags: ["dev", "ui"], contentString: "No more tailwind.config.js! It's all CSS variables now. This is awesome." },
    { title: "My awesome startup idea", type: "PAGE", tags: ["startup", "ideas"], contentString: "An AI agent that automatically reads and categorizes your emails into a Kanban board." },
    { title: "Book highlights: Deep Work", type: "PAGE", tags: ["productivity", "reading"], contentString: "Schedule deep work blocks. Turn off notifications. 90-minute intervals work best." },
    { title: "How to build a custom hook", type: "PAGE", tags: ["dev"], contentString: "function useDebounce(value, delay) {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n  // ..." },
    { title: "Top 10 VSCode Extensions", url: "https://youtube.com/watch?v=vscode", type: "LINK", tags: ["dev", "productivity"], contentString: "Check out 'Error Lens', it shows errors inline." },
    { title: "Design Review Feedback", type: "PAGE", tags: ["ui", "design"], contentString: "- Contrast on the primary button is too low.\n- Add more padding to the card components.\n- The empty state needs an illustration." },
    { title: "PostgreSQL Indexing Strategies", url: "https://use-the-index-luke.com", type: "LINK", tags: ["backend", "reading"], contentString: "Don't just index everything. Understand B-trees and composite indexes." },
    { title: "Vercel Analytics Setup", type: "LINK", tags: ["dev"], contentString: "Need to add the <Analytics /> component to the root layout." },
    { title: "Content Strategy 2026", type: "PAGE", tags: ["planning", "ideas"], contentString: "Post 2x a week on Twitter. Write 1 deep-dive blog post per month. Focus on engineering challenges." },
    { title: "Cool typography combinations", type: "SOCIAL_CLIP", tags: ["design", "ui"], contentString: "Inter for UI, Playfair Display for headings. Looks very premium." }
  ];

  const quickNotesData = [
    { title: "Grocery List", contentString: "- Milk\n- Eggs\n- Coffee beans\n- Avocados", tags: [] },
    { title: "Fix the mobile nav", contentString: "The hamburger menu is overlapping with the logo on screens < 380px.", tags: ["bug", "ui"] },
    { title: "Idea for the onboarding", contentString: "What if we gamify the onboarding? Give users a progress bar and a confetti animation when they complete it.", tags: ["ideas", "design"] },
    { title: "Check out that new AI model", contentString: "Claude 3 Opus just dropped. Need to test it against GPT-4 for code generation.", tags: ["ai"] },
    { title: "Remember to cancel subscription", contentString: "Cancel Adobe Creative Cloud before the 15th so I don't get charged for another year.", tags: ["productivity"] },
    { title: "CSS snippet for glass effect", contentString: "backdrop-filter: blur(12px);\nbackground: rgba(255, 255, 255, 0.1);\nborder: 1px solid rgba(255, 255, 255, 0.2);", tags: ["dev", "ui"] },
    { title: "Weekend trip to the mountains", contentString: "Need to book the Airbnb and check if we need snow chains for the tires.", tags: ["planning"] },
    { title: "Investigate memory leak", contentString: "The Node.js backend is slowly consuming memory. Maybe it's the image processing library?", tags: ["bug", "backend"] },
    { title: "New Feature Idea: Dark Mode Toggle", contentString: "Users have been asking for a quick toggle in the header. We should implement this next sprint.", tags: ["ideas", "ui"] },
    { title: "Meeting with Jane @ 3PM", contentString: "Discuss the new marketing budget and the upcoming campaign.", tags: ["planning"] },
    { title: "Review PR #452", contentString: "Check if the database migrations are safe to run in production.", tags: ["dev", "backend"] },
    { title: "Books to read", contentString: "1. The Pragmatic Programmer\n2. Atomic Habits\n3. Thinking, Fast and Slow", tags: ["reading", "productivity"] },
    { title: "Need to update Node.js", contentString: "Current version is 18.x, we should upgrade to 20.x for the new features.", tags: ["dev", "backend"] },
    { title: "Quick sketch of the dashboard", contentString: "Sidebar on the left. Main content area. A right panel for details.", tags: ["design", "ui"] },
    { title: "Why is the API so slow?", contentString: "Check the /projects endpoint. It might need an index on the user_id column.", tags: ["bug", "backend"] },
    { title: "Draft tweet about the launch", contentString: "We are finally live! 🚀 Check out the new version of our app. It's faster and more beautiful.", tags: ["startup", "ideas"] },
    { title: "Buy a new ergonomic chair", contentString: "My back is killing me. Look into Herman Miller or Steelcase.", tags: ["productivity"] },
    { title: "Test the new checkout flow", contentString: "Make sure the Stripe integration is working correctly with the new pricing plans.", tags: ["dev", "startup"] },
    { title: "Idea: AI powered search", contentString: "Use embeddings to make the search semantic instead of just keyword based.", tags: ["ai", "ideas"] },
    { title: "Update dependencies", contentString: "Run npm outdated and see what needs to be updated. Watch out for breaking changes in React 19.", tags: ["dev"] },
    { title: "Brainstorming company names", contentString: "- HypeMind\n- Cerebro\n- Synapse\n- Nexus", tags: ["startup", "ideas"] },
    { title: "Fix the footer alignment", contentString: "The links in the footer are not perfectly aligned on mobile.", tags: ["bug", "ui"] },
    { title: "Remember to drink water", contentString: "Stay hydrated!", tags: ["productivity"] },
    { title: "Check analytics", contentString: "See where the drop-off is happening in the sign-up funnel.", tags: ["research", "startup"] },
    { title: "Learn Rust", contentString: "Everyone says it's great. Need to find a good tutorial for beginners.", tags: ["dev", "reading"] }
  ];

  console.log(`Seeding ${inboxData.length} Inbox items...`);
  
  for (let i = 0; i < inboxData.length; i++) {
    const data = inboxData[i];
    const item = await prisma.item.create({
      data: {
        workspaceId,
        title: data.title,
        type: data.type as any,
        contentString: data.contentString,
        url: data.url || null,
        createdById: user.id,
        isPinned: Math.random() > 0.8,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
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

  console.log(`Seeding ${quickNotesData.length} Quick Notes...`);
  
  for (let i = 0; i < quickNotesData.length; i++) {
    const data = quickNotesData[i];
    const item = await prisma.item.create({
      data: {
        workspaceId,
        title: data.title,
        type: "QUICK_NOTE",
        contentString: data.contentString,
        createdById: user.id,
        isPinned: Math.random() > 0.8,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000),
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

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
