export const Navigator = {
	dashboard: () => "/dashboard",
	inbox: () => "/dashboard/inbox",
	pinned: () => "/dashboard/pinned",
	journal: () => "/dashboard/journal",
	areas: () => "/dashboard/area",
	area: (id: string) => `/dashboard/area/${id}`,
	projects: () => "/dashboard/project",
	project: (id: string) => `/dashboard/project/${id}`,
	trash: () => "/dashboard/trash",
	settings: () => "/dashboard/settings",
};
