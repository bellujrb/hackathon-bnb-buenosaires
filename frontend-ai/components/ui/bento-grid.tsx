import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

type BentoCardProps = {
	Icon?: React.ComponentType<{ className?: string }>
	name: string
	description: string
	href?: string
	cta?: string
	className?: string
	background?: ReactNode
}

export function BentoGrid({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<div className={cn('grid gap-4 md:gap-6 md:grid-cols-3', className)}>
			{children}
		</div>
	)
}

export function BentoCard({ Icon, name, description, href, cta, className, background }: BentoCardProps) {
	return (
		<div className={cn('relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5', className)}>
			{background}
			<div className="relative z-10 flex h-full flex-col justify-between gap-6">
				<div className="space-y-3">
					{Icon ? <Icon className="h-5 w-5 text-white/70" /> : null}
					<h3 className="text-lg font-semibold">{name}</h3>
					<p className="text-sm text-white/70">{description}</p>
				</div>
				{href && cta ? (
					<div>
						<a
							href={href}
							className="text-sm text-white/80 underline underline-offset-4 hover:text-white"
						>
							{cta}
						</a>
					</div>
				) : null}
			</div>
		</div>
	)
}

