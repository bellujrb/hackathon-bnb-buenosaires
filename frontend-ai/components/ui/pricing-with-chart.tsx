'use client';

import { Button } from '@/components/ui/button';
import { CheckCircleIcon } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';

export function PricingWithChart() {
	return (
		<div className="mx-auto max-w-6xl">
			<div className="mx-auto mb-10 max-w-2xl text-center">
				<h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
					Plans for KYW, batch validation and airdrops
				</h1>
				<p className="text-muted-foreground mt-4 text-sm md:text-base">
					Choose the plan that fits your use case — from on‑demand checks to API and enterprise workflows.
				</p>
			</div>
			<div className="grid gap-4 md:grid-cols-6 items-stretch">
				{/* Left silver card */}
				<div className="md:col-span-2">
					<div className="relative h-full overflow-hidden rounded-xl border border-white/15 bg-white/5 p-6">
						<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_10%_10%,rgba(255,255,255,0.12),transparent_60%)]" />
						<div className="relative z-10 space-y-4">
							<div>
								<h2 className="backdrop-blur-2 inline rounded-[2px] p-1 text-xl font-semibold">Pro</h2>
								<span className="my-3 block text-3xl font-bold text-purple-600">$12.99</span>
								<p className="text-muted-foreground text-sm">Best for individuals and small teams</p>
							</div>
							<Button asChild variant="outline" className="w-full">
								<a href="#">Get Started</a>
							</Button>
							<div className="bg-border my-6 h-px w-full" />
							<ul className="text-muted-foreground space-y-3 text-sm">
								{[
									'Unlimited search sends',
									'Spreadsheet uploads',
									'10k tokens',
								].map((item, index) => (
									<li key={index} className="flex items-center gap-2">
										<CheckCircleIcon className="h-4 w-4 text-purple-600" />
										{item}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
				{/* Right silver card */}
				<div className="md:col-span-4">
					<div className="relative grid h-full gap-8 overflow-hidden rounded-xl border border-white/15 bg-white/5 p-6 lg:grid-cols-2">
						<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_80%_0%,rgba(255,255,255,0.10),transparent_60%)]" />
						<div className="relative z-10 flex h-full flex-col justify-between space-y-6">
							<div>
								<h2 className="text-xl font-semibold">Enterprise</h2>
								<span className="my-3 block text-3xl font-bold text-purple-600">$30</span>
								<p className="text-muted-foreground text-sm">For growing teams and organizations</p>
							</div>
							<div className="bg-muted/30 h-fit w-full rounded-lg border p-2">
								<InterestChart />
							</div>
						</div>
						<div className="relative z-10 w-full">
							<div className="text-sm font-medium">Everything in Pro plus:</div>
							<ul className="text-muted-foreground mt-4 space-y-3 text-sm">
								{[
									'Analytics dashboard',
									'API access',
									'Integrations MCP: Gmail, Discord, Telegram',
								].map((item, index) => (
									<li key={index} className="flex items-center gap-2">
										<CheckCircleIcon className="h-4 w-4 text-purple-500" />
										{item}
									</li>
								))}
							</ul>
							<div className="mt-10 grid w-full grid-cols-2 gap-2.5">
								<Button
									asChild
									className="bg-purple-600 text-white hover:bg-purple-700 hover:text-white"
								>
									<a href="#">Get Started</a>
								</Button>
								<Button asChild variant="outline">
									<a href="#">Contact sales</a>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function InterestChart() {
	const chartData = [
		{ month: 'January', interest: 120 },
		{ month: 'February', interest: 180 },
		{ month: 'March', interest: 150 },
		{ month: 'April', interest: 210 },
		{ month: 'May', interest: 250 },
		{ month: 'June', interest: 300 },
		{ month: 'July', interest: 280 },
		{ month: 'August', interest: 320 },
		{ month: 'September', interest: 340 },
		{ month: 'October', interest: 390 },
		{ month: 'November', interest: 420 },
		{ month: 'December', interest: 500 },
	];

	const chartConfig = {
		interest: {
			label: 'Interest',
			color: '#9333ea',
		},
	} satisfies ChartConfig;

	return (
		<Card>
			<CardHeader className="space-y-0 border-b p-3">
				<CardTitle className="text-lg">Plan Popularity</CardTitle>
				<CardDescription className="text-xs">
					Monthly trend of people considering this plan.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-3">
				<ChartContainer config={chartConfig}>
					<LineChart data={chartData} margin={{ left: 12, right: 12 }}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => (value as string).slice(0, 3)}
						/>
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<Line
							dataKey="interest"
							type="monotone"
							stroke="var(--color-interest)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}


