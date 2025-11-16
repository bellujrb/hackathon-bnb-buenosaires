import Link from 'next/link'

type Member = {
	name: string
	role: string
	avatar: string
	link?: string
}

const defaultMembers: Member[] = [
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

export default function TeamSection({ members = defaultMembers }: { members?: Member[] }) {
  return (
		<section className="bg-gray-50 py-16 md:py-24 dark:bg-transparent">
			<div className="mx-auto max-w-5xl px-6">
				<div className="mx-auto mb-10 max-w-2xl text-center">
					<h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Conheça nosso time</h2>
					<p className="text-muted-foreground mt-4 text-sm md:text-base">que está construindo na BNB Chain.</p>
				</div>

				<div className="mt-12 md:mt-24">
					<div className="mx-auto max-w-4xl grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 justify-items-center">
						{members.map((member, index) => (
							<div key={index} className="group overflow-hidden">
								<div className="aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-lg group-hover:rounded-xl">
									<img
										className="h-full w-full object-cover object-center grayscale transition-all duration-500 hover:grayscale-0"
										src={member.avatar}
										alt="team member"
										width="826"
										height="1032"
									/>
								</div>
								<div className="px-2 pt-2 sm:pb-0 sm:pt-4">
									<div className="flex justify-between">
										<h3 className="text-title text-base font-medium transition-all duration-500 group-hover:tracking-wider">
											{member.name}
										</h3>
										<span className="text-xs">_0{index + 1}</span>
									</div>
									<div className="mt-1 flex items-center justify-between">
										<span className="text-muted-foreground inline-block translate-y-6 text-sm opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
											{member.role}
										</span>
										<Link
											href={member.link || '#'}
											className="group-hover:text-primary-600 dark:group-hover:text-primary-400 inline-block translate-y-8 text-sm tracking-wide opacity-0 transition-all duration-500 hover:underline group-hover:translate-y-0 group-hover:opacity-100"
										>
											{' '}
											LinkedIn
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
    </div>
		</section>
	)
}
