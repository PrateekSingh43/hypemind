import { LucideIcon } from 'lucide-react';

export function MetricCard({ icon: Icon, label, value, iconBgColor = '#6F5DF5', iconColor = 'white' }: { icon: LucideIcon; label: string; value: number; iconBgColor?: string; iconColor?: string; }) {
	return (
		<div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
			<div className="size-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBgColor }}>
				<Icon className="size-6" style={{ color: iconColor }} />
			</div>
			<div>
				<div className="text-2xl font-semibold text-foreground tracking-tight">{value}</div>
				<div className="text-sm text-muted-foreground font-medium">{label}</div>
			</div>
		</div>
	);
}
