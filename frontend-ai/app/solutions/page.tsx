import { SolutionSection } from '@/components/ui/solutions'
import { RoadmapSection } from '@/components/ui/roadmap'

export const metadata = {
	title: 'Solutions',
}

export default function SolutionsPage() {
	return (
		<main className="min-h-[calc(100vh-4rem)] pt-16 md:pt-24">
			<SolutionSection />
			<RoadmapSection />
		</main>
	)
}

