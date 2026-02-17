import { Clock } from 'lucide-react';

export function RecentlyUpdatedCard({ title, timestamp }: { title: string; timestamp: string }) {
	return (
		<div className="bg-card rounded-xl border border-border p-3 min-w-[220px] max-w-[260px] hover:border-primary/30 transition-colors cursor-pointer shadow-sm">
			<div className="flex items-center gap-3">
				<div className="size-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
					<Clock className="size-4 text-primary" />
				</div>
				<div className="flex-1 min-w-0">
					<h4 className="text-sm font-medium text-foreground truncate">{title}</h4>
					<p className="text-[11px] text-muted-foreground mt-0.5">{timestamp}</p>
				</div>
			</div>
		</div>
	);
}
