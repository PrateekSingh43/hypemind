import { ResizableLayoutWrapper } from "../../components/dashboard/resizable-layout-wrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<ResizableLayoutWrapper>
			{children}
		</ResizableLayoutWrapper>
	);
}
