import 'dotenv/config';
import { getProjectsService } from './src/project/project.service.js';
import { getPinnedItemsService } from './src/workspaces/workspace.service.js';

async function main() {
  const workspaceId = 'cmprbdlie0001toadylgez75k';
  try {
    const pinned = await getPinnedItemsService(workspaceId);
    console.log("Pinned items success:", pinned.areas.length);
  } catch (e) {
    console.error("Error in getPinnedItemsService:", e);
  }

  try {
    const projects = await getProjectsService(workspaceId, true);
    console.log("Projects success:", projects.length);
  } catch (e) {
    console.error("Error in getProjectsService:", e);
  }
}
main();
