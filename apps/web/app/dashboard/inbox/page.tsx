import { redirect } from "next/navigation";
import { Navigator } from "../../../lib/navigator";

export default function InboxPage() {
	redirect(Navigator.unsorted());
}
