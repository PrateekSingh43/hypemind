import { LucideIcon } from 'lucide-react';

export function MetricCard({ icon: Icon, label, value, iconBgColor = '#6F5DF5', iconColor = 'white' }: { icon: LucideIcon; label: string; value: number; iconBgColor?: string; iconColor?: string; }) {
	return (
		<div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
			<div className="flex size-12 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: iconBgColor }}>
				<Icon className="size-6 transition-transform duration-200 group-hover:scale-110" style={{ color: iconColor }} />
			</div>
			<div>
				<div className="text-2xl font-semibold text-foreground tracking-tight">{value}</div>
				<div className="text-sm text-muted-foreground font-medium">{label}</div>
			</div>
		</div>
	);
}
