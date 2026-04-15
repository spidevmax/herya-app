import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ChevronLeft,
	Frown,
	Leaf,
	PersonStanding,
	Star,
	Trash2,
	Wind,
} from "lucide-react";
import { getSessionById, deleteSession } from "@/api/sessions.api";
import { ConfirmModal, SkeletonCard, Badge } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "@/utils/helpers";
import { VK_FAMILIES } from "@/utils/constants";

const toUniqueMoodTokens = (moods, prefix) => {
	const seen = {};
	return moods.map((mood) => {
		seen[mood] = (seen[mood] ?? 0) + 1;
		return {
			mood,
			key: `${prefix}-${mood}-${seen[mood]}`,
		};
	});
};

const TYPE_CONFIG = {
	vk_sequence: {
		icon: PersonStanding,
		color: "var(--color-primary)",
		labelKey: "dashboard.vk_sequence",
		fallback: "VK Sequence",
	},
	pranayama: {
		icon: Wind,
		color: "var(--color-primary)",
		labelKey: "dashboard.pranayama",
		fallback: "Pranayama",
	},
	meditation: {
		icon: Leaf,
		color: "var(--color-info)",
		labelKey: "dashboard.meditation",
		fallback: "Meditation",
	},
	complete_practice: {
		icon: Star,
		color: "var(--color-warning)",
		labelKey: "dashboard.complete_practice",
		fallback: "Complete Practice",
	},
};

export default function SessionDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t, lang } = useLanguage();
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
				<Frown
					size={52}
					className="mb-3"
					style={{ color: "var(--color-text-muted)" }}
				/>
				<p className="font-display text-lg font-bold text-[var(--color-text-primary)]">
					{t("session_detail.not_found")}
				</p>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mt-4 text-[var(--color-primary)] text-sm font-semibold"
				>
					{t("session_detail.back")}
				</button>
			</div>
		);
	}

	const moodBeforeTokens = toUniqueMoodTokens(
		session.moodBefore ?? [],
		"before",
	);
	const moodAfterTokens = toUniqueMoodTokens(session.moodAfter ?? [], "after");

	const cfg = TYPE_CONFIG[session.sessionType] ?? {
		icon: PersonStanding,
		color: "var(--color-primary)",
		label: session.sessionType,
	};
	const TypeIcon = cfg.icon || PersonStanding;
	const sessionTypeLabel =
		(cfg.labelKey ? t(cfg.labelKey) : "") ||
		cfg.label ||
		cfg.fallback ||
		session.sessionType;
	const sessionTitle =
		session.sessionType === "vk_sequence" && session.vkSequence?.englishName
			? session.vkSequence.englishName
			: sessionTypeLabel;
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
					<h1 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
						{t("session_detail.title")}
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
					className="rounded-3xl p-5 flex items-center gap-4"
					style={{
						backgroundColor: `color-mix(in srgb, ${cfg.color} 16%, var(--color-surface-card))`,
						border: `1px solid color-mix(in srgb, ${cfg.color} 32%, transparent)`,
					}}
				>
					{family?.emoji ? (
						<span className="text-4xl">{family.emoji}</span>
					) : (
						<TypeIcon
							size={34}
							strokeWidth={2.2}
							style={{ color: cfg.color }}
						/>
					)}
					<div>
						<p className="font-display text-xl font-bold text-[var(--color-text-primary)]">
							{sessionTitle}
						</p>
						{family && (
							<p className="text-sm text-[var(--color-text-secondary)]">
								{family.labelKey ? t(family.labelKey) : family.label}
							</p>
						)}
						<p className="text-xs mt-1 text-[var(--color-text-muted)]">
							{format.date(session.date || session.createdAt, lang)}
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
							<p className="text-[var(--color-text-muted)] text-xs">
								{t("session_detail.minutes")}
							</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-[var(--color-text-primary)]">
								{session.completed ? "✓" : "—"}
							</p>
							<p className="text-[var(--color-text-muted)] text-xs">
								{session.completed
									? t("session_detail.completed")
									: t("session_detail.in_progress")}
							</p>
						</div>
					</div>
				</div>

				{/* Moods */}
				{(session.moodBefore?.length > 0 || session.moodAfter?.length > 0) && (
					<div className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-soft)]">
						<p className="font-semibold text-[var(--color-text-primary)] text-sm mb-3">
							{t("session_detail.mood")}
						</p>
						{session.moodBefore?.length > 0 && (
							<div className="mb-2">
								<p className="text-xs text-[var(--color-text-muted)] mb-1">
									{t("session_detail.before")}
								</p>
								<div className="flex gap-1.5 flex-wrap">
									{moodBeforeTokens.map(({ mood, key }) => (
										<Badge key={key} color="var(--color-primary)">
											{t(`session.moods.${mood}`)}
										</Badge>
									))}
								</div>
							</div>
						)}
						{session.moodAfter?.length > 0 && (
							<div>
								<p className="text-xs text-[var(--color-text-muted)] mb-1">
									{t("session_detail.after")}
								</p>
								<div className="flex gap-1.5 flex-wrap">
									{moodAfterTokens.map(({ mood, key }) => (
										<Badge key={key} color="var(--color-primary)">
											{t(`session.moods.${mood}`)}
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
							{t("session_detail.notes")}
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
							{t("session_detail.vk_feedback")}
						</p>
						<div className="flex flex-col gap-2">
							{Object.entries(session.vkFeedback).map(([k, v]) => (
								<div key={k} className="flex items-center justify-between">
									<p className="text-xs text-[var(--color-text-secondary)]">
										{t(`session_detail.feedback_${k}`)}
									</p>
									<Badge color="var(--color-primary)">
										{t(`session_detail.feedback_val_${v}`)}
									</Badge>
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
				title={t("session_detail.delete_title")}
				description={t("session_detail.delete_description")}
				confirmLabel={t("session_detail.delete_confirm")}
				danger
				loading={deleting}
			/>
		</div>
	);
}
