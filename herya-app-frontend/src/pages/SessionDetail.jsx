import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2 } from "lucide-react";
import { getSessionById, deleteSession } from "@/api/sessions.api";
import { ConfirmModal, SkeletonCard, Badge } from "@/components/ui";
import { format } from "@/utils/helpers";
import { VK_FAMILIES } from "@/utils/constants";

const TYPE_CONFIG = {
	vk_sequence: {
		emoji: "🧘",
		color: "var(--color-primary)",
		label: "Secuencia VK",
	},
	pranayama: { emoji: "💨", color: "var(--color-primary)", label: "Pranayama" },
	meditation: { emoji: "🌿", color: "var(--color-info)", label: "Meditación" },
	complete_practice: {
		emoji: "⭐",
		color: "var(--color-warning)",
		label: "Práctica completa",
	},
};

export default function SessionDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showDelete, setShowDelete] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		getSessionById(id)
			.then((r) => setSession(r.data?.data || r.data))
			.catch(() => setSession(null))
			.finally(() => setLoading(false));
	}, [id]);

	const handleDelete = async () => {
		setDeleting(true);
		try {
			await deleteSession(id);
			navigate(-1);
		} catch {
			setDeleting(false);
			setShowDelete(false);
		}
	};

	if (loading) {
		return (
			<div className="px-4 pt-4 flex flex-col gap-4">
				<SkeletonCard lines={5} />
				<SkeletonCard lines={3} />
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<span className="text-5xl mb-3">😕</span>
				<p className="font-display text-lg font-bold text-[var(--color-text-primary)]">
					Sesión no encontrada
				</p>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mt-4 text-[var(--color-primary)] text-sm font-semibold"
				>
					Volver
				</button>
			</div>
		);
	}

	const cfg = TYPE_CONFIG[session.sessionType] ?? {
		emoji: "🧘",
		color: "var(--color-primary)",
		label: session.sessionType,
	};
	const family = session.vkFamily
		? VK_FAMILIES.find((f) => f.key === session.vkFamily)
		: null;

	return (
		<div className="flex flex-col pt-4 pb-6">
			<div className="flex items-center justify-between px-4 mb-5">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] flex items-center justify-center shadow-sm"
					>
						<ChevronLeft
							size={20}
							className="text-[var(--color-text-secondary)]"
						/>
					</button>
					<h1
						className="font-display text-xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-text-primary)",
						}}
					>
						Detalle de sesión
					</h1>
				</div>
				<button
					type="button"
					onClick={() => setShowDelete(true)}
					className="w-9 h-9 rounded-full bg-[var(--color-tone-danger-bg)] flex items-center justify-center"
				>
					<Trash2 size={16} className="text-[var(--color-danger)]" />
				</button>
			</div>

			<div className="px-4 flex flex-col gap-4">
				{/* Type card */}
				<div
					className="rounded-3xl p-5 text-white flex items-center gap-4"
					style={{
						background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}CC)`,
					}}
				>
					<span className="text-4xl">{family?.emoji ?? cfg.emoji}</span>
					<div>
						<p
							className="font-display text-xl font-bold"
							style={{ fontFamily: '"Fredoka", sans-serif' }}
						>
							{cfg.label}
						</p>
						{family && <p className="text-white/80 text-sm">{family.label}</p>}
						<p className="text-white/70 text-xs mt-1">
							{format.date(session.date || session.createdAt)}
						</p>
					</div>
				</div>

				{/* Stats */}
				<div className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-soft)]">
					<div className="grid grid-cols-2 gap-4">
						<div className="text-center">
							<p className="font-bold text-2xl text-[var(--color-text-primary)]">
								{session.duration ?? "—"}
							</p>
							<p className="text-[var(--color-text-muted)] text-xs">minutos</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-[var(--color-text-primary)]">
								{session.completed ? "✓" : "—"}
							</p>
							<p className="text-[var(--color-text-muted)] text-xs">
								{session.completed ? "Completada" : "En progreso"}
							</p>
						</div>
					</div>
				</div>

				{/* Moods */}
				{(session.moodBefore?.length > 0 || session.moodAfter?.length > 0) && (
					<div className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-soft)]">
						<p className="font-semibold text-[var(--color-text-primary)] text-sm mb-3">
							Estado de ánimo
						</p>
						{session.moodBefore?.length > 0 && (
							<div className="mb-2">
								<p className="text-xs text-[var(--color-text-muted)] mb-1">
									Antes
								</p>
								<div className="flex gap-1.5 flex-wrap">
									{session.moodBefore.map((m) => (
										<Badge key={m} color="var(--color-primary)">
											{m}
										</Badge>
									))}
								</div>
							</div>
						)}
						{session.moodAfter?.length > 0 && (
							<div>
								<p className="text-xs text-[var(--color-text-muted)] mb-1">
									Después
								</p>
								<div className="flex gap-1.5 flex-wrap">
									{session.moodAfter.map((m) => (
										<Badge key={m} color="var(--color-primary)">
											{m}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Notes */}
				{session.notes && (
					<div className="bg-[var(--color-surface-card)] rounded-2xl p-4">
						<p className="font-semibold text-[var(--color-text-primary)] text-sm mb-2">
							Notas
						</p>
						<p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
							{session.notes}
						</p>
					</div>
				)}

				{/* VK Feedback */}
				{session.vkFeedback && (
					<div className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-soft)]">
						<p className="font-semibold text-[var(--color-text-primary)] text-sm mb-3">
							Feedback Vinyasa Krama
						</p>
						<div className="flex flex-col gap-2">
							{Object.entries(session.vkFeedback).map(([k, v]) => (
								<div key={k} className="flex items-center justify-between">
									<p className="text-xs text-[var(--color-text-secondary)] capitalize">
										{k.replace(/([A-Z])/g, " $1")}
									</p>
									<div className="flex gap-0.5">
										{Array.from({ length: 5 }, (_, idx) => idx + 1).map(
											(star) => (
												<div
													key={`star-${k}-${star}`}
													className="w-2 h-2 rounded-full"
													style={{
														backgroundColor:
															star <= v
																? "var(--color-primary)"
																: "var(--color-surface-secondary)",
													}}
												/>
											),
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			<ConfirmModal
				open={showDelete}
				onClose={() => setShowDelete(false)}
				onConfirm={handleDelete}
				title="¿Eliminar sesión?"
				description="Esta acción no se puede deshacer."
				confirmLabel="Eliminar"
				danger
				loading={deleting}
			/>
		</div>
	);
}
