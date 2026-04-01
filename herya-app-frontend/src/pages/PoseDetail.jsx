import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Play } from "lucide-react";
import { getPoseById, getRelatedPoses } from "@/api/poses.api";
import { Badge, Button, SkeletonCard } from "@/components/ui";

const DIFF_COLORS = {
	beginner: "var(--color-info)",
	intermediate: "var(--color-warning)",
	advanced: "var(--color-danger)",
};
const DIFF_LABELS = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
};

function RelatedPoseChip({ pose, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex-shrink-0 flex flex-col items-center gap-1.5 w-20"
		>
			<div className="w-16 h-16 rounded-2xl bg-[var(--color-tone-info-bg)] flex items-center justify-center overflow-hidden">
				{pose.image ? (
					<img
						src={pose.image}
						alt={pose.englishName}
						className="w-full h-full object-cover"
					/>
				) : (
					<span className="text-2xl">🧘</span>
				)}
			</div>
			<p className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium leading-tight line-clamp-2">
				{pose.englishName}
			</p>
		</button>
	);
}

export default function PoseDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [pose, setPose] = useState(null);
	const [related, setRelated] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.allSettled([getPoseById(id), getRelatedPoses(id)])
			.then(([p, r]) => {
				if (p.status === "fulfilled")
					setPose(p.value.data?.data || p.value.data);
				if (r.status === "fulfilled") {
					// Backend returns { basePose, preparatoryPoses, followUpPoses, counterposes }
					const payload = r.value.data?.data || r.value.data || {};
					setRelated(payload);
				}
			})
			.finally(() => setLoading(false));
	}, [id]);

	if (loading) {
		return (
			<div className="px-4 pt-4 flex flex-col gap-4">
				<div className="h-56 rounded-3xl bg-[var(--color-surface-card)] animate-pulse" />
				<SkeletonCard lines={4} />
				<SkeletonCard lines={3} />
			</div>
		);
	}

	if (!pose) {
		return (
			<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<span className="text-5xl mb-3">😕</span>
				<p className="font-display text-lg font-bold text-[var(--color-text-primary)]">
					Postura no encontrada
				</p>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mt-4 text-[var(--color-info)] text-sm font-semibold"
				>
					Volver
				</button>
			</div>
		);
	}

	const benefits = pose.benefits ?? [];
	const instructions =
		(pose.instructions ?? pose.description) ? [pose.description] : [];
	// Backend keys: preparatoryPoses, followUpPoses, counterposes
	const preparatory = related?.preparatoryPoses ?? [];
	const followUp = related?.followUpPoses ?? [];
	const counterposes = related?.counterposes ?? [];

	return (
		<div className="flex flex-col pb-32">
			{/* Hero image */}
			<div className="relative h-64 bg-[var(--color-tone-info-bg)]">
				{pose.image ? (
					<img
						src={pose.image}
						alt={pose.englishName}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-8xl">
						🧘
					</div>
				)}
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm"
				>
					<ChevronLeft size={20} className="text-[var(--color-text-primary)]" />
				</button>
			</div>

			<div className="px-4 pt-5 flex flex-col gap-5">
				{/* Name & badges */}
				<div>
					<h1
						className="font-display text-2xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-text-primary)",
						}}
					>
						{pose.englishName}
					</h1>
					{pose.romanizedName && (
						<p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
							{pose.romanizedName}
						</p>
					)}
					{pose.sanskritName && (
						<p className="text-[var(--color-text-muted)] text-xs italic">
							{pose.sanskritName}
						</p>
					)}
					<div className="flex flex-wrap gap-1.5 mt-3">
						{pose.difficulty && (
							<Badge
								color={
									DIFF_COLORS[pose.difficulty] ?? "var(--color-text-muted)"
								}
							>
								{DIFF_LABELS[pose.difficulty] ?? pose.difficulty}
							</Badge>
						)}
						{pose.category && (
							<Badge color="var(--color-info)">
								{pose.category.replace(/_/g, " ")}
							</Badge>
						)}
						{pose.family && (
							<Badge color="var(--color-lavender)">
								{pose.family.replace(/_/g, " ")}
							</Badge>
						)}
						{pose.drishti && (
							<Badge color="var(--color-warning)">
								Drishti: {pose.drishti}
							</Badge>
						)}
					</div>
				</div>

				{/* Description */}
				{pose.description && (
					<p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
						{pose.description}
					</p>
				)}

				{/* Benefits */}
				{benefits.length > 0 && (
					<div className="bg-[var(--color-tone-info-bg)] rounded-2xl p-4">
						<h3 className="font-display font-bold text-[var(--color-text-primary)] mb-3">
							Beneficios
						</h3>
						<ul className="flex flex-col gap-2">
							{benefits.map((b) => (
								<li
									key={`benefit-${b}`}
									className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
								>
									<span className="text-[var(--color-info)] mt-0.5 flex-shrink-0">
										✓
									</span>
									{b}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Instructions */}
				{instructions.length > 0 && (
					<div>
						<h3 className="font-display font-bold text-[var(--color-text-primary)] mb-3">
							Instrucciones
						</h3>
						<ol className="flex flex-col gap-3">
							{instructions.map((step, i) => (
								<li key={`step-${step}`} className="flex items-start gap-3">
									<span className="w-6 h-6 rounded-full bg-[var(--color-info)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
										{i + 1}
									</span>
									<p className="text-[var(--color-text-secondary)] text-sm leading-relaxed flex-1">
										{step}
									</p>
								</li>
							))}
						</ol>
					</div>
				)}

				{/* Related poses */}
				{(preparatory.length > 0 ||
					followUp.length > 0 ||
					counterposes.length > 0) && (
					<div>
						<h3 className="font-display font-bold text-[var(--color-text-primary)] mb-3">
							Posturas relacionadas
						</h3>
						<div className="flex flex-col gap-4">
							{preparatory.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										Preparación
									</p>
									<div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
										{preparatory.map((p) => (
											<RelatedPoseChip
												key={p._id}
												pose={p}
												onClick={() => navigate(`/poses/${p._id}`)}
											/>
										))}
									</div>
								</div>
							)}
							{followUp.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										Continuación
									</p>
									<div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
										{followUp.map((p) => (
											<RelatedPoseChip
												key={p._id}
												pose={p}
												onClick={() => navigate(`/poses/${p._id}`)}
											/>
										))}
									</div>
								</div>
							)}
							{counterposes.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										Contraposturas
									</p>
									<div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
										{counterposes.map((p) => (
											<RelatedPoseChip
												key={p._id}
												pose={p}
												onClick={() => navigate(`/poses/${p._id}`)}
											/>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* CTA sticky */}
			<motion.div
				initial={{ y: 80 }}
				animate={{ y: 0 }}
				className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4"
			>
				<Button
					size="lg"
					className="w-full flex items-center justify-center gap-2"
					onClick={() => navigate("/session/vk_sequence")}
				>
					<Play size={18} /> Iniciar práctica
				</Button>
			</motion.div>
		</div>
	);
}
