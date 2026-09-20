import { useEffect, useState } from "react";
import "@/styles/identity.css";

/*
 * Identity proof — not wired into the product.
 * Renders the surya/chandra token system against real seeded content
 * (Morning Reset, from sessionTemplates.csv) so the direction can be judged
 * without a running backend.
 */

const BLOCKS = [
	{ label: "Standing warm-up", detail: "Tadasana, level 1", minutes: 20, channel: "surya" },
	{ label: "Ujjayi breathing", detail: "8 cycles, 1:4:2", minutes: 8, channel: "chandra" },
	{ label: "Closing stillness", detail: "Body scan", minutes: 7, channel: "none" },
];

const TOTAL = BLOCKS.reduce((sum, b) => sum + b.minutes, 0);

function KramaLadder() {
	return (
		<ol className="mt-5 flex flex-col gap-2" style={{ listStyle: "none", padding: 0 }}>
			{BLOCKS.map((block, i) => {
				const filled = block.channel !== "none";
				const fill = filled ? `var(--${block.channel})` : "var(--paper-raised)";
				// Text on a channel fill is always dark ink — both hues stay light
				// in either theme, so theme-flipping the text would break contrast.
				const onFill = filled ? "var(--on-fill)" : "var(--ink)";
				const onFillSoft = filled ? "color-mix(in srgb, var(--on-fill) 72%, transparent)" : "var(--ink-soft)";
				return (
					<li
						key={block.label}
						className="ink-block flex items-stretch overflow-hidden"
						/* Height carries duration: the session's shape is readable
						   before any number is. */
						style={{ minHeight: `${block.minutes * 3.2}px`, background: fill, color: onFill }}
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
								<span className="block text-[0.82rem]" style={{ color: onFillSoft }}>
									{block.detail}
								</span>
							</span>
							<span className="display shrink-0 text-[1.15rem]">{block.minutes}m</span>
						</span>
					</li>
				);
			})}
		</ol>
	);
}

export default function IdentityProof() {
	// Drives the real mechanism (html.dark) rather than a local class, so the
	// proof exercises the same cascade the product uses.
	const [dark, setDark] = useState(() =>
		document.documentElement.classList.contains("dark"),
	);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", dark);
	}, [dark]);

	return (
		<div
			data-identity="next"
			style={{ minHeight: "100dvh", padding: "clamp(1rem, 4vw, 2.5rem) 1rem" }}
		>
			<div style={{ maxWidth: "26rem", margin: "0 auto" }}>
				<div className="mb-6 flex items-center justify-between">
					<span className="display text-[1.05rem]">Identity proof</span>
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
					<p className="mt-2 text-[0.9rem]" style={{ color: "var(--ink-soft)" }}>
						Three blocks, {TOTAL} minutes. Practised 12 times.
					</p>
					<KramaLadder />
					<button
						type="button"
						className="ink-block ink-block--press display mt-5 w-full py-3 text-[1.1rem]"
						style={{ background: "var(--surya)", color: "var(--on-fill)", cursor: "pointer" }}
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
						Keep breathing blocks under five minutes. Asthma — avoid rapid breathing.
					</p>
					<p className="mt-3 text-[0.92rem] leading-relaxed">
						Her anchor phrase is <strong>“My breath helps me.”</strong> Her body cue is
						shoulders dropping.
					</p>
					<p className="mt-4 text-[0.8rem]" style={{ color: "var(--ink-soft)" }}>
						No colour, no character, no encouragement copy on this screen.
					</p>
				</section>

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
							<span className="mt-1.5 block text-[0.72rem]" style={{ color: "var(--ink-soft)" }}>
								{name}
							</span>
						</div>
					))}
				</section>
			</div>
		</div>
	);
}
