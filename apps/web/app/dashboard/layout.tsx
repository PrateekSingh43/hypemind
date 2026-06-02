import { Suspense } from "react";
import { ResizableLayoutWrapper } from "../../components/dashboard/resizable-layout-wrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<Suspense fallback={<div className="flex h-screen w-full bg-background" />}>
			<ResizableLayoutWrapper>
				{children}
			</ResizableLayoutWrapper>
		</Suspense>
	);
}
