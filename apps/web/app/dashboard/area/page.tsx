"use client";

import { Layers, Plus } from "lucide-react";
import Link from "next/link";
import { Navigator } from "../../../lib/navigator";

const AREAS = [
	{ id: "1", name: "Product Development", count: 8 },
	{ id: "2", name: "Marketing", count: 3 },
	{ id: "3", name: "Design Operations", count: 5 },
];

export default function AreasPage() {
	return (
		<div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
			<div className="mb-8 flex items-center justify-between gap-3 border-b border-border pb-6">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-[#23C58A]/10">
						<Layers className="size-5 text-[#23C58A]" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground">Areas</h1>
						<p className="text-sm text-muted-foreground">High-level domains of responsibility.</p>
					</div>
				</div>
				<button type="button" className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
					<Plus className="size-4" />
					New Area
				</button>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{AREAS.map((area) => (
					<Link key={area.id} href={Navigator.area(area.id)} className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<Layers className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{area.count} items</span>
						</div>
						<h3 className="text-base font-semibold text-foreground">{area.name}</h3>
					</Link>
				))}
			</div>
		</div>
	);
}
