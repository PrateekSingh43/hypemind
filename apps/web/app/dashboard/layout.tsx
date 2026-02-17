import { cookies } from "next/headers";
import { ResizableLayoutWrapper } from "../../components/dashboard/resizable-layout-wrapper";

const PANEL_LAYOUT_COOKIE = "react-resizable-panels:layout";
const PANEL_LAYOUT_COOKIE_V2 = "react-resizable-panels-layout";
const FALLBACK_LAYOUT: [number, number, number] = [18, 62, 20];

function isValidLayout(value: unknown): value is [number, number, number] {
	if (!Array.isArray(value) || value.length !== 3) {
		return false;
	}

	return value.every(
		(item) => typeof item === "number" && Number.isFinite(item) && item > 0 && item < 100
	);
}

function parsePanelLayout(cookieValue: string | undefined): [number, number, number] {
	if (!cookieValue) {
		return FALLBACK_LAYOUT;
	}

	try {
		const decoded = decodeURIComponent(cookieValue);
		const parsed = JSON.parse(decoded) as unknown;
		return isValidLayout(parsed) ? parsed : FALLBACK_LAYOUT;
	} catch {
		return FALLBACK_LAYOUT;
	}
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const cookieStore = await cookies();
	const storedLayout =
		cookieStore.get(PANEL_LAYOUT_COOKIE_V2)?.value ??
		cookieStore.get(PANEL_LAYOUT_COOKIE)?.value;
	const defaultLayout = parsePanelLayout(storedLayout);

	return <ResizableLayoutWrapper defaultLayout={defaultLayout}>{children}</ResizableLayoutWrapper>;
}
