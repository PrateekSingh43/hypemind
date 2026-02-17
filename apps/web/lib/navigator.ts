export const Navigator = {
	dashboard: () => "/dashboard",
	unsorted: () => "/dashboard/unsorted",
	pinned: () => "/dashboard/pinned",
	journal: () => "/dashboard/journal",
	areas: () => "/dashboard/area",
	area: (id: string) => `/dashboard/area/${id}`,
	projects: () => "/dashboard/project",
	project: (id: string) => `/dashboard/project/${id}`,
	archive: () => "/dashboard/archive",
	settings: () => "/dashboard/settings",
};
