// C:\Users\prate\hypemind\apps\api\src\utils\workspace.ts

import { Prisma } from "@repo/db";


export async function generateWorkspaceData(email: string) {
	const userName = email.split("@")[0];
	const capatilized = userName.charAt(0).toUpperCase() + userName.slice(1);
	const name = `${capatilized}'s Worksapce`;


	// slug creation 

	const baseSlug = `${userName}-Workspace`.toLowerCase().replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");

	return { name, baseSlug }

}


export async function generateUniqueSlug(tx: Prisma.TransactionClient, baseSlug: string) {
	let slug = baseSlug;
	let counter = 1;

	while (await tx.workspace.findUnique({ where: { slug } })){
		slug = `${baseSlug}-${counter}` ; 
		counter++ ; 
	}
	return slug ; 
}