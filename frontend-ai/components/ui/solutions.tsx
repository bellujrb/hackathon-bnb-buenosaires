'use client'

import { useEffect, useRef, useState } from 'react'
import { BlocksIcon, CpuIcon, LayersIcon, ShieldCheckIcon, WalletIcon, WorkflowIcon } from 'lucide-react'

import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { cn } from '@/lib/utils'

const solutions = [
	{
		Icon: ShieldCheckIcon,
		name: 'AI Wallet Screening (KYW)',
		description:
			'Our agent checks wallet age, activity and protocol interactions to prevent abuse and ensure fairness.',
		href: '#kyw',
		cta: 'See checklist',
		className: 'lg:row-start-1 lg:row-end-4 lg:col-start-2',
		background: (
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_60%)] opacity-70" />
		),
	},
	{
		Icon: WorkflowIcon,
		name: 'Batch Validation from CSV',
		description:
			'Paste addresses or import spreadsheets. Validate hundreds of wallets in one go with rules and risk checks.',
		href: '#batch',
		cta: 'Try batch',
		className: 'lg:row-start-1 lg:row-end-2 lg:col-start-1',
		background: (
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] opacity-70" />
		),
	},
	{
		Icon: WalletIcon,
		name: 'One‑click Airdrop',
		description:
			'Send tokens safely using our audited contract. Distribution per wallet is executed automatically.',
		href: '#airdrop',
		cta: 'See contract',
		className: 'lg:row-start-2 lg:row-end-3 lg:col-start-1',
		background: (
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_60%)] opacity-70" />
		),
	},
	{
		Icon: CpuIcon,
		name: 'KYW & Airdrop API + SDK',
		description:
			'Integrate validation and airdrop into your stack. Webhooks and TypeScript SDK for rapid adoption.',
		href: '#api',
		cta: 'View docs',
		className: 'lg:row-start-3 lg:row-end-4 lg:col-start-1',
		background: (
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.2),transparent_65%)] opacity-70" />
		),
	},
	{
		Icon: LayersIcon,
		name: 'Risk Scoring & Rules',
		description:
			'Configurable rules: wallet age, specific contract interactions, token history and more.',
		href: '#risk',
		cta: 'Configure rules',
		className: 'lg:row-start-1 lg:row-end-2 lg:col-start-3',
		background: (
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_60%)] opacity-70" />
		),
	},
	{
		Icon: BlocksIcon,
		name: 'Metrics & Dashboard',
		description:
			'Track eligibility, conversion and distribution. Export reports to share results with your team.',
		href: '#analytics',
		cta: 'Preview dashboard',
		className: 'lg:row-start-2 lg:row-end-4 lg:col-start-3',
		background: (
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_65%)] opacity-70" />
		),
	},
]

export function SolutionSection() {
	const [isVisible, setIsVisible] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true)
				}
			},
			{ threshold: 0.2 },
		)
		if (ref.current) observer.observe(ref.current)
		return () => observer.disconnect()
	}, [])

	return (
		<section ref={ref} className="relative overflow-hidden bg-black text-white">
			<div
				aria-hidden
				className="absolute inset-0 -z-10"
				style={{
					backgroundImage: [
						'radial-gradient(60% 60% at 30% 40%, rgba(147,51,234,0.22) 0%, transparent 65%)',
						'radial-gradient(70% 70% at 70% 60%, rgba(124,58,237,0.20) 0%, transparent 70%)',
					].join(','),
				}}
			/>
			<div className="mx-auto max-w-6xl">
				<div
					className={cn(
						'mb-16 text-center transition-all duration-1000',
						isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
					)}
				>
					<h2 className="mt-6 text-balance text-4xl font-bold md:text-5xl">
						AI‑powered KYW and Airdrops for BNB Chain
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
						Validate wallets, batch check lists and distribute tokens safely. Built for fair, efficient, scalable airdrops.
					</p>
				</div>
				<div
					className={cn(
						'transition-all duration-1000',
						isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
					)}
					style={{ transitionDelay: isVisible ? '150ms' : '0ms' }}
				>
					<BentoGrid className="lg:grid-rows-3">
						{solutions.map((s) => (
							<BentoCard key={s.name} {...s} />
						))}
					</BentoGrid>
				</div>
			</div>
		</section>
	)
}

