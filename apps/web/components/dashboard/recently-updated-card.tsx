import { Clock } from 'lucide-react';

export function RecentlyUpdatedCard({ title, timestamp }: { title: string; timestamp: string }) {
	return (
		<div className="group cursor-pointer rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/30 min-w-[220px] max-w-[260px]">
			<div className="flex items-center gap-3">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 transition-colors group-hover:bg-primary/20">
					<Clock className="size-4 text-primary transition-transform duration-200 group-hover:scale-110" />
				</div>
				<div className="flex-1 min-w-0">
					<h4 className="text-sm font-medium text-foreground truncate">{title}</h4>
					<p className="text-[11px] text-muted-foreground mt-0.5">{timestamp}</p>
				</div>
			</div>
		</div>
	);
}
