import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, BookOpen, Play, Dumbbell } from "lucide-react";
import { getSequenceById } from "@/api/sequences.api";
import { VK_FAMILY_MAP, LEVEL_LABELS } from "@/utils/constants";
import { Button, Badge, SkeletonCard } from "@/components/ui";

export default function SequenceDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [seq, setSeq] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getSequenceById(id)
			.then((r) => setSeq(r.data?.data || r.data))
			.catch(() => setSeq(null))
			.finally(() => setLoading(false));
	}, [id]);

	const family = seq
		? VK_FAMILY_MAP[seq.family] || {
				color: "var(--color-primary)",
				emoji: "🧘",
				label: seq.family,
			}
		: null;

	return (
		<div className="pb-6">
			<div className="sticky top-0 z-10 bg-[#F8F7F4]/90 backdrop-blur-xl px-4 pt-4 pb-3 flex items-center gap-3">
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
				>
					<ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} />
				</button>
				<h1
					className="font-display text-lg font-semibold truncate"
					style={{
						fontFamily: '"Fredoka", sans-serif',
						color: "var(--color-text-primary)",
					}}
				>
					{loading ? "Loading…" : seq?.englishName}
				</h1>
			</div>

			{loading ? (
				<div className="px-4 flex flex-col gap-4 mt-2">
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
				</div>
			) : !seq ? (
				<div className="px-4 mt-8 text-center text-[#9CA3AF]">
					Sequence not found
				</div>
			) : (
				<div className="px-4 flex flex-col gap-5 mt-2">
					<motion.div
						initial={{ opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						className="rounded-3xl p-6 relative overflow-hidden"
						style={{
							background:
								"linear-gradient(135deg, " +
								family.color +
								", " +
								family.color +
								"AA)",
						}}
					>
						<div className="absolute right-4 bottom-4 text-8xl opacity-20 float select-none">
							{family.emoji}
						</div>
						<span className="text-white/80 text-xs font-bold uppercase tracking-widest">
							{family.label}
						</span>
						<h2
							className="font-display text-2xl font-bold text-white mt-1 mb-1"
							style={{ fontFamily: '"Fredoka", sans-serif' }}
						>
							{seq.englishName}
						</h2>
						<p className="text-white/70 text-sm italic mb-4">
							{seq.sanskritName}
						</p>
						<div className="flex flex-wrap gap-2">
							{seq.estimatedDuration?.recommended && (
								<Badge className="text-white bg-white/20 border-0">
									<Clock size={12} />
									{seq.estimatedDuration.recommended} min
								</Badge>
							)}
							{seq.level && (
								<Badge className="text-white bg-white/20 border-0">
									<Dumbbell size={12} />
									{LEVEL_LABELS[seq.level] ?? seq.level}
								</Badge>
							)}
							{seq.difficulty && (
								<Badge className="text-white bg-white/20 border-0 capitalize">
									{seq.difficulty}
								</Badge>
							)}
						</div>
					</motion.div>

					{seq.description && (
						<div className="bg-white rounded-2xl p-5">
							<h3
								className="font-semibold mb-2"
								style={{ color: "var(--color-text-primary)" }}
							>
								About
							</h3>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{seq.description}
							</p>
						</div>
					)}

					{seq.keyPoses?.length > 0 && (
						<div className="bg-white rounded-2xl p-5">
							<h3
								className="font-semibold mb-3 flex items-center gap-2"
								style={{ color: "var(--color-text-primary)" }}
							>
								<BookOpen size={16} /> Key Poses
							</h3>
							<div className="flex flex-wrap gap-2">
								{seq.keyPoses.slice(0, 10).map((p) => (
									<span
										key={typeof p === "string" ? p : p._id || p.englishName}
										className="px-3 py-1.5 rounded-xl text-xs font-medium"
										style={{
											backgroundColor: family.color + "15",
											color: family.color,
										}}
									>
										{p.englishName || p}
									</span>
								))}
							</div>
						</div>
					)}

					<Button
						onClick={() => navigate("/session/vk_sequence?seq=" + seq._id)}
						className="w-full text-base py-4"
					>
						<Play size={18} /> Start This Practice
					</Button>
				</div>
			)}
		</div>
	);
}
