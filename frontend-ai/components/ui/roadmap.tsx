import { RoadmapCard, type RoadmapItem } from '@/components/ui/roadmap-card'

const techItems: RoadmapItem[] = [
	{
		quarter: 'v0.1 · TODAY',
		title: 'Agent + KYW analysis',
		description: 'AI wallet checks: age, protocol interactions, token history.',
		status: 'done',
	},
	{
		quarter: 'v0.2 · 2 MONTHS',
		title: 'Batch KYW',
		description: 'CSV import and mass validation with rules.',
		status: 'in-progress',
	},
	{
		quarter: 'v0.3 · 6 MONTHS',
		title: 'Integrated airdrop',
		description: 'Audited contract to distribute tokens automatically.',
		status: 'upcoming',
	},
	{
		quarter: 'v0.4 · 12 MONTHS',
		title: 'Dashboard + metrics',
		description: 'Airdrop analytics, exports and reporting.',
		status: 'upcoming',
	},
]

const businessItems: RoadmapItem[] = [
	{
		quarter: 'B1',
		title: 'Community partnerships',
		description: 'Engagement token airdrops with Web3 communities.',
		status: 'in-progress',
	},
	{
		quarter: 'B2',
		title: 'Grants',
		description: 'Funding to harden infra and expand the product.',
		status: 'upcoming',
	},
	{
		quarter: 'B3',
		title: 'BNB Chain adoption',
		description: 'Implement Dropit as the primary airdrop tooling.',
		status: 'upcoming',
	},
]

export function RoadmapSection() {
	return (
		<section className="relative overflow-hidden bg-black px-6 py-20 text-white md:py-32">
			<div
				aria-hidden
				className="absolute inset-0 -z-10"
				style={{
					backgroundImage: [
						'radial-gradient(100% 80% at 50% 50%, rgba(124,58,237,0.18) 0%, rgba(147,51,234,0.12) 40%, transparent 70%)',
					].join(','),
				}}
			/>
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-12 text-center">
				<div className="max-w-2xl">
					<h2 className="text-balance text-4xl font-bold md:text-5xl">Roadmap</h2>
					<p className="mt-4 text-lg text-white/70">From agent and KYW to integrated airdrops and analytics.</p>
				</div>
				<RoadmapCard
					title="Tech"
					description="Core milestones for product and infrastructure."
					items={techItems}
					className="border-white/10 bg-black/60"
				/>
				<RoadmapCard
					title="Business"
					description="Go-to-market and ecosystem adoption milestones."
					items={businessItems}
					className="border-white/10 bg-black/60"
				/>
			</div>
		</section>
	)
}

