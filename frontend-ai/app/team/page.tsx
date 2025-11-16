import DemoTeam from '@/components/ui/demo'

export const metadata = {
	title: 'Team',
}

export default function AboutPage() {
	const members = [
		{
			name: 'João Rubens Belluzzo Neto',
			role: 'Co-founder',
			avatar: '/bellu.jpeg',
			link: '#',
		},
		{
			name: 'Lucas Oliveira',
			role: 'Co-founder',
			avatar: '/lucas.jpeg',
			link: '#',
		},
	]
	return (
		<main className="min-h-[calc(100vh-4rem)] pt-12 md:pt-4">
			<DemoTeam members={members} />
		</main>
	)
}

