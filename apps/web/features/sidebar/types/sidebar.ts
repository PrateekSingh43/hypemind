


export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
  createdAt: string;
  joinedAt: string;
};



export type QuickNoteSummary = {
  id: string;
  title?: string | null;
  contentString?: string | null;
  tags?: string[];
  updatedAt?: string;
};