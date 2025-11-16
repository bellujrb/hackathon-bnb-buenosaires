import { cn } from '@/lib/utils'

export type RoadmapStatus = 'done' | 'in-progress' | 'upcoming'

export type RoadmapItem = {
	quarter: string
	title: string
	description: string
	status: RoadmapStatus
}

export function RoadmapCard({
	title,
	description,
	items,
	className,
}: {
	title: string
	description?: string
	items: RoadmapItem[]
	className?: string
}) {
	return (
		<div className={cn('w-full rounded-xl border bg-white/5 p-6 text-left', className)}>
			<div className="mb-6">
				<h3 className="text-xl font-semibold">{title}</h3>
				{description ? <p className="text-white/70">{description}</p> : null}
			</div>
			<ol className="grid gap-4 md:grid-cols-2">
				{items.map((item, idx) => (
					<li key={idx} className="rounded-lg border border-white/10 bg-black/40 p-4">
						<div className="flex items-center justify-between">
							<span className="text-xs uppercase tracking-wide text-white/60">{item.quarter}</span>
							<StatusPill status={item.status} />
						</div>
						<h4 className="mt-2 text-lg font-medium">{item.title}</h4>
						<p className="mt-1 text-sm text-white/70">{item.description}</p>
					</li>
				))}
			</ol>
		</div>
	)
}

function StatusPill({ status }: { status: RoadmapStatus }) {
	const map: Record<RoadmapStatus, { label: string; className: string }> = {
		done: { label: 'Concluído', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
		'in-progress': {
			label: 'Em progresso',
			className: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
		},
		upcoming: { label: 'Próximo', className: 'bg-white/10 text-white/70 border-white/20' },
	}
	const v = map[status]
	return <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', v.className)}>{v.label}</span>
}

