import 'dotenv/config';
import { prisma } from '@repo/db';

async function main() {
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

  // Create Projects
  const projectsData = [
    { title: "Website Redesign", description: "Overhaul the main landing page and marketing site with the new branding." },
    { title: "Mobile App V2", description: "React Native rewrite of the mobile app to improve performance." },
    { title: "Q3 Marketing Campaign", description: "Assets and planning for the upcoming product launch." },
    { title: "Backend Scaling", description: "Migrate the database to a managed service and optimize slow queries." },
    { title: "AI Feature Integration", description: "Adding GPT-4 capabilities to the text editor." },
    { title: "User Onboarding", description: "Improve the first-time user experience and reduce drop-off." },
    { title: "Design System", description: "Create a unified component library in Figma and React." },
    { title: "Security Audit", description: "Address the vulnerabilities found in the recent penetration test." },
    { title: "Blog Content", description: "Drafts and ideas for the engineering blog." },
    { title: "Investor Updates", description: "Monthly reports and KPIs for stakeholders." }
  ];

  console.log(`Seeding ${projectsData.length} Projects...`);
  const createdProjects = [];
  
  for (let i = 0; i < projectsData.length; i++) {
    const data = projectsData[i];
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Check if exists
    let project = await prisma.project.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          workspaceId,
          title: data.title,
          slug,
          description: data.description,
          createdById: user.id,
          isPinned: Math.random() > 0.7,
        }
      });
    }
    createdProjects.push(project);
  }

  // Fetch the quick notes we created earlier (that have projectId = null)
  const quickNotes = await prisma.item.findMany({
    where: {
      workspaceId,
      type: "QUICK_NOTE",
      projectId: null
    }
  });

  console.log(`Assigning ${quickNotes.length} Quick Notes to random projects...`);

  for (const note of quickNotes) {
    const randomProject = createdProjects[Math.floor(Math.random() * createdProjects.length)];
    await prisma.item.update({
      where: { id: note.id },
      data: { projectId: randomProject.id }
    });
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
