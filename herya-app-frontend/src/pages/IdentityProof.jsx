import { useEffect, useState } from "react";
import AdminQuickCard from "@/components/dashboard/AdminQuickCard";
import CalendarStrip from "@/components/dashboard/CalendarStrip";
import HeroCard from "@/components/dashboard/HeroCard";
import PracticeSnapshotCard from "@/components/dashboard/PracticeSnapshotCard";
import RecentSessionCard from "@/components/dashboard/RecentSessionCard";
import BreathBuddy from "@/components/identity/BreathBuddy";
import BreathMark from "@/components/identity/BreathMark";
import { DesktopSidebar } from "@/components/layout/AppLayout";
import BottomNav from "@/components/layout/BottomNav";
import { Badge, Button, Card, SkeletonCard, StatCard } from "@/components/ui";
import "@/styles/identity.css";

/*
 * Identity proof — not wired into the product.
 * Renders the surya/chandra token system against real seeded content
 * (Morning Reset, from sessionTemplates.csv) so the direction can be judged
 * without a running backend.
 */

const BLOCKS = [
	{
		label: "Standing warm-up",
		detail: "Tadasana, level 1",
		minutes: 20,
		channel: "surya",
	},
	{
		label: "Ujjayi breathing",
		detail: "8 cycles, 1:4:2",
		minutes: 8,
		channel: "chandra",
	},
	{
		label: "Closing stillness",
		detail: "Body scan",
		minutes: 7,
		channel: "none",
	},
];

const TOTAL = BLOCKS.reduce((sum, b) => sum + b.minutes, 0);

// Fixtures so the dashboard cards can be reviewed without a signed-in session.
const FIXTURE_SEQUENCE = {
	_id: "seq1",
	family: "tadasana",
	level: 1,
	englishName: "Tadasana Family - Level 1",
	sanskritName: "Tāḍāsana",
	difficulty: "beginner",
	estimatedDuration: { recommended: 20 },
};

const FIXTURE_SESSIONS = [
	{
		_id: "s1",
		sessionType: "vk_sequence",
		duration: 45,
		completed: true,
		date: "2026-09-18",
		vkSequence: { englishName: "Standing Asymmetric - Level 2" },
	},
	{
		_id: "s2",
		sessionType: "pranayama",
		duration: 10,
		completed: true,
		date: "2026-09-17",
	},
	{
		_id: "s3",
		sessionType: "meditation",
		duration: 20,
		completed: false,
		date: "2026-09-16",
	},
];

const FIXTURE_DATES = ["2026-09-18", "2026-09-17", "2026-09-15", "2026-09-14"];

const KramaLadder = () => {
	return (
		<ol
			className="mt-5 flex flex-col gap-2"
			style={{ listStyle: "none", padding: 0 }}
		>
			{BLOCKS.map((block, i) => {
				const filled = block.channel !== "none";
				const fill = filled ? `var(--${block.channel})` : "var(--paper-raised)";
				// Text on a channel fill is always dark ink — both hues stay light
				// in either theme, so theme-flipping the text would break contrast.
				const onFill = filled ? "var(--on-fill)" : "var(--ink)";
				const onFillSoft = filled
					? "color-mix(in srgb, var(--on-fill) 72%, transparent)"
					: "var(--ink-soft)";
				return (
					<li
						key={block.label}
						className="ink-block flex items-stretch overflow-hidden"
						/* Height carries duration: the session's shape is readable
						   before any number is. */
						style={{
							minHeight: `${block.minutes * 3.2}px`,
							background: fill,
							color: onFill,
						}}
					>
						<span
							className="display flex w-12 shrink-0 items-center justify-center text-[1.05rem]"
							style={{
								borderRight: "var(--ink-width) solid var(--ink)",
								background: "var(--paper-raised)",
								color: "var(--ink)",
							}}
						>
							{i + 1}
						</span>
						<span className="flex flex-1 items-center justify-between gap-3 px-4 py-3">
							<span>
								<span className="block text-[1rem] font-bold leading-tight">
									{block.label}
								</span>
								<span
									className="block text-[0.82rem]"
									style={{ color: onFillSoft }}
								>
									{block.detail}
								</span>
							</span>
							<span className="display shrink-0 text-[1.15rem]">
								{block.minutes}m
							</span>
						</span>
					</li>
				);
			})}
		</ol>
	);
};

const IdentityProof = () => {
	// Drives the real mechanism (html.dark) rather than a local class, so the
	// proof exercises the same cascade the product uses.
	const [dark, setDark] = useState(() =>
		document.documentElement.classList.contains("dark"),
	);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", dark);
	}, [dark]);

	// Walks the breath cycle so the character can be judged in motion.
	const [phase, setPhase] = useState("inhale");
	useEffect(() => {
		const order = ["inhale", "hold", "exhale"];
		let i = 0;
		const id = setInterval(() => {
			i = (i + 1) % order.length;
			setPhase(order[i]);
		}, 2200);
		return () => clearInterval(id);
	}, []);

	return (
		<div
			data-identity="next"
			style={{ minHeight: "100dvh", padding: "clamp(1rem, 4vw, 2.5rem) 1rem" }}
		>
			<div style={{ maxWidth: "26rem", margin: "0 auto" }}>
				<div className="mb-6 flex items-center justify-between">
					<span className="flex items-center gap-2">
						<BreathMark size={30} />
						<span className="display text-[1.05rem]">Identity proof</span>
					</span>
					<button
						type="button"
						onClick={() => setDark((d) => !d)}
						className="ink-block ink-block--press px-3 py-1.5 text-[0.8rem] font-bold"
						style={{ cursor: "pointer", color: "var(--ink)" }}
					>
						{dark ? "Light" : "Dark"}
					</button>
				</div>

				{/* Session card — the krama ladder */}
				<section className="ink-block p-5">
					<h1 className="display text-[2.1rem]">Morning Reset</h1>
					<p
						className="mt-2 text-[0.9rem]"
						style={{ color: "var(--ink-soft)" }}
					>
						Three blocks, {TOTAL} minutes. Practised 12 times.
					</p>
					<KramaLadder />
					<button
						type="button"
						className="ink-block ink-block--press display mt-5 w-full py-3 text-[1.1rem]"
						style={{
							background: "var(--surya)",
							color: "var(--on-fill)",
							cursor: "pointer",
						}}
					>
						Begin practice
					</button>
				</section>

				{/* Quiet mode — safety screens drop all colour */}
				<section
					className="ink-block mt-5 p-5"
					style={{ background: "var(--hush)", boxShadow: "none" }}
				>
					<h2 className="display text-[1.15rem]">Before you begin with Lily</h2>
					<p className="mt-3 text-[0.92rem] leading-relaxed">
						Keep breathing blocks under five minutes. Asthma — avoid rapid
						breathing.
					</p>
					<p className="mt-3 text-[0.92rem] leading-relaxed">
						Her anchor phrase is <strong>“My breath helps me.”</strong> Her body
						cue is shoulders dropping.
					</p>
					<p
						className="mt-4 text-[0.8rem]"
						style={{ color: "var(--ink-soft)" }}
					>
						No colour, no character, no encouragement copy on this screen.
					</p>
				</section>

				{/* Character — cycles through the breath phases */}
				<section className="ink-block mt-5 flex flex-col items-center p-5">
					<BreathBuddy
						size={150}
						phase={phase}
						fill={phase === "exhale" ? "var(--chandra)" : "var(--surya)"}
					/>
					<p className="display mt-3 text-[1.3rem]">
						{phase === "inhale"
							? "Breathe in"
							: phase === "hold"
								? "Hold"
								: "Breathe out"}
					</p>
					<p
						className="mt-1 text-[0.85rem]"
						style={{ color: "var(--ink-soft)" }}
					>
						Ujjayi, 1:4:2 — the figure is the pacer, not a mascot.
					</p>
				</section>

				{/* Shared UI library */}
				<section className="mt-5 flex flex-col gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<Button variant="primary">Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="accent">Accent</Button>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button variant="outline">Outline</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="primary" loading>
							Loading
						</Button>
						<Button variant="primary" disabled>
							Disabled
						</Button>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Badge>Neutral</Badge>
						<Badge color="var(--surya)">Surya</Badge>
						<Badge color="var(--chandra)">Chandra</Badge>
						<Badge color="var(--alert)">Alert</Badge>
					</div>
					<Card>
						<p className="text-sm font-bold">Card — shared .section-card</p>
					</Card>
					<div className="grid grid-cols-2 gap-3">
						<StatCard label="Sessions" value="42" />
						<StatCard label="Minutes" value="320" color="var(--chandra)" />
					</div>
					<SkeletonCard lines={3} />
				</section>

				{/* Dashboard cards on fixture data */}
				<section className="mt-5 flex flex-col gap-4">
					<HeroCard
						sequence={FIXTURE_SEQUENCE}
						reason="Sigue tu progresión"
						loading={false}
					/>
					<CalendarStrip
						sessionDates={FIXTURE_DATES}
						streak={4}
						weekSessions={3}
						loading={false}
					/>
					<PracticeSnapshotCard
						streak={4}
						weekSessions={3}
						totalPracticeMinutes={320}
						loading={false}
					/>
					<AdminQuickCard />
					{FIXTURE_SESSIONS.map((session) => (
						<RecentSessionCard key={session._id} session={session} />
					))}
				</section>

				{/* Navigation chrome, mounted live: the sidebar pins left at
				    >=1024px, the bottom bar pins to the bottom below it. */}
				<DesktopSidebar />
				<BottomNav />

				{/* Palette reference */}
				<section className="mt-5 flex gap-2">
					{[
						["Surya", "var(--surya)"],
						["Chandra", "var(--chandra)"],
						["Ink", "var(--ink)"],
						["Paper", "var(--paper-raised)"],
					].map(([name, value]) => (
						<div key={name} className="flex-1 text-center">
							<div
								className="ink-block"
								style={{ background: value, height: "3rem", boxShadow: "none" }}
							/>
							<span
								className="mt-1.5 block text-[0.72rem]"
								style={{ color: "var(--ink-soft)" }}
							>
								{name}
							</span>
						</div>
					))}
				</section>
			</div>
		</div>
	);
};

export default IdentityProof;
