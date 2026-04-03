import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Leaf, RotateCcw, Settings2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
	createSession,
	startSessionTimer,
	completeGuidedSession,
	abandonSession,
} from "@/api/sessions.api";
import { createJournalEntry } from "@/api/journalEntries.api";
import useSessionPersistence from "@/hooks/useSessionPersistence";
import PracticeTypeSelector from "@/components/session/PracticeTypeSelector";
import SessionBuilder from "@/components/session/SessionBuilder";
import GuidedPracticePlayer from "@/components/session/GuidedPracticePlayer";
import PostPracticeJournal from "@/components/session/PostPracticeJournal";
import { Button } from "@/components/ui";

const MOOD_OPTIONS = [
	"calm",
	"anxious",
	"energized",
	"tired",
	"focused",
	"stressed",
	"happy",
	"restless",
];

/**
 * StartPractice — 4-phase flow:
 * 1. Choose type (PracticeTypeSelector)
 * 2. Build session (SessionBuilder)
 * 3. Execute guided (GuidedPracticePlayer)
 * 4. Post-practice journal (PostPracticeJournal)
 */
export default function StartPractice() {
	const navigate = useNavigate();
	const { refreshUser } = useAuth();
	const { t } = useLanguage();
	const persistence = useSessionPersistence();

	// Flow phase: "type" | "build" | "checkin" | "practice" | "journal" | "done"
	const [phase, setPhase] = useState("type");
	const [practiceType, setPracticeType] = useState(null);
	const [blocks, setBlocks] = useState([]);
	const [totalMinutes, setTotalMinutes] = useState(0);
	const [sessionId, setSessionId] = useState(null);
	const [sessionSummary, setSessionSummary] = useState(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	// Check-in state (optional)
	const [checkInEnabled, setCheckInEnabled] = useState(false);
	const [checkInMood, setCheckInMood] = useState([]);
	const [checkInEnergy, setCheckInEnergy] = useState(5);
	const [checkInIntention, setCheckInIntention] = useState("");

	// Recovery banner
	const [showRecovery, setShowRecovery] = useState(!!persistence.recovered);

	const handleSelectType = (type) => {
		setPracticeType(type);
		setPhase("build");
	};

	const handleStartSession = async (orderedBlocks, minutes) => {
		setBlocks(orderedBlocks);
		setTotalMinutes(minutes);

		if (checkInEnabled) {
			setPhase("checkin");
		} else {
			await createAndStartSession(orderedBlocks, minutes, null);
		}
	};

	const handleCheckInComplete = async () => {
		const checkIn = {
			enabled: true,
			mood: checkInMood,
			energyLevel: checkInEnergy,
			intention: checkInIntention,
		};
		await createAndStartSession(blocks, totalMinutes, checkIn);
	};

	const createAndStartSession = async (orderedBlocks, minutes, checkIn) => {
		setError(null);
		try {
			const payload = {
				sessionType: practiceType,
				duration: minutes,
				plannedBlocks: orderedBlocks,
				status: "planned",
				...(checkIn ? { checkIn } : {}),
			};

			const res = await createSession(payload);
			const session = res.data?.data || res.data;
			const id = session._id;
			setSessionId(id);

			await startSessionTimer(id);

			persistence.saveSession({
				sessionId: id,
				practiceType,
				blocks: orderedBlocks,
				totalMinutes: minutes,
				phase: "practice",
			});

			setPhase("practice");
		} catch (err) {
			console.error("Failed to create session:", err);
			setError(t("practice.error_create_session"));
		}
	};

	const handleSaveProgress = useCallback(
		(progressData) => {
			persistence.saveSession({
				sessionId,
				practiceType,
				blocks,
				totalMinutes,
				phase: "practice",
				...progressData,
			});
		},
		[sessionId, practiceType, blocks, totalMinutes, persistence],
	);

	const handleComplete = async (summary) => {
		setSessionSummary(summary);
		try {
			if (sessionId) {
				await completeGuidedSession(sessionId, {
					blocksCompleted: summary.blocksCompleted,
				});
			}
		} catch (err) {
			console.error("Failed to complete session:", err);
		}
		persistence.clearSession();
		setPhase("journal");
	};

	const handleAbandon = async (summary) => {
		setSessionSummary(summary);
		try {
			if (sessionId) {
				await abandonSession(sessionId);
			}
		} catch (err) {
			console.error("Failed to abandon session:", err);
		}
		persistence.clearSession();
		// Still show journal even on abandon
		setPhase("journal");
	};

	const handleSaveJournal = async (journalData) => {
		setSaving(true);
		try {
			if (sessionId) {
				await createJournalEntry({
					session: sessionId,
					...journalData,
				});
			}
			await refreshUser();
			persistence.clearSession();
			setPhase("done");
		} catch (err) {
			console.error("Failed to save journal:", err);
			setError(t("practice.error_save_journal"));
		} finally {
			setSaving(false);
		}
	};

	const handleRecoverSession = () => {
		const r = persistence.recovered;
		if (!r) return;
		setPracticeType(r.practiceType);
		setBlocks(r.blocks || []);
		setTotalMinutes(r.totalMinutes || 0);
		setSessionId(r.sessionId);
		setPhase("practice");
		setShowRecovery(false);
	};

	const toggleCheckInMood = (mood) => {
		setCheckInMood((prev) =>
			prev.includes(mood)
				? prev.filter((m) => m !== mood)
				: prev.length < 3
					? [...prev, mood]
					: prev,
		);
	};

	// Done screen
	if (phase === "done") {
		return (
			<div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
					className="flex justify-center"
				>
					<Leaf
						size={64}
						strokeWidth={2.2}
						style={{ color: "var(--color-primary)" }}
					/>
				</motion.div>
				<h2
					className="text-2xl font-semibold"
					style={{
						fontFamily: '"DM Sans", sans-serif',
						color: "var(--color-text-primary)",
					}}
				>
					{t("practice.done_title")}
				</h2>
				<p
					className="text-sm text-center"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{t("practice.done_subtitle")}
				</p>
				<div className="flex gap-3">
					<Button variant="outline" onClick={() => navigate("/sessions")}>
						{t("practice.view_history")}
					</Button>
					<Button onClick={() => navigate("/")}>
						{t("session.back_home")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-dvh">
			{/* Header */}
			<div
				className="sticky top-0 z-10 px-4 pt-4 pb-3 flex items-center gap-3 backdrop-blur-xl"
				style={{
					backgroundColor:
						"color-mix(in srgb, var(--color-surface) 90%, transparent)",
				}}
			>
				<button
					type="button"
					onClick={() => {
						if (phase === "build") setPhase("type");
						else if (phase === "checkin") setPhase("build");
						else if (phase === "type") navigate(-1);
						else navigate("/");
					}}
					className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} />
				</button>
				<h1
					className="text-lg font-semibold"
					style={{
						fontFamily: '"DM Sans", sans-serif',
						color: "var(--color-text-primary)",
					}}
				>
					{phase === "type"
						? t("practice.start_practice")
						: phase === "build"
							? t("practice.build_session")
							: phase === "checkin"
								? t("practice.check_in")
								: phase === "practice"
									? t("practice.in_progress")
									: t("practice.journal")}
				</h1>

				{/* Check-in toggle (visible in build phase) */}
				{phase === "build" && (
					<button
						type="button"
						onClick={() => setCheckInEnabled((e) => !e)}
						className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition"
						style={{
							backgroundColor: checkInEnabled
								? "var(--color-primary)"
								: "var(--color-surface-card)",
							color: checkInEnabled ? "white" : "var(--color-text-secondary)",
							border: `1px solid ${checkInEnabled ? "var(--color-primary)" : "var(--color-border-soft)"}`,
						}}
					>
						<Settings2 size={12} />
						{t("practice.check_in")}
					</button>
				)}
			</div>

			{/* Recovery banner */}
			{showRecovery && persistence.recovered && phase === "type" && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mx-4 mb-3 rounded-xl p-4 flex items-center gap-3"
					style={{
						backgroundColor: "#FEF3C7",
						border: "1px solid #F59E0B30",
					}}
				>
					<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
						<RotateCcw size={16} className="text-amber-700" />
					</div>
					<div className="flex-1">
						<p className="text-sm font-semibold text-amber-900">
							{t("practice.recovery_title")}
						</p>
						<p className="text-xs text-amber-700">
							{t("practice.recovery_subtitle")}
						</p>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => {
								persistence.dismissRecovery();
								setShowRecovery(false);
							}}
							className="text-xs font-medium text-amber-700 px-2 py-1"
						>
							{t("practice.dismiss")}
						</button>
						<button
							type="button"
							onClick={handleRecoverSession}
							className="text-xs font-semibold text-white bg-amber-600 px-3 py-1 rounded-lg"
						>
							{t("practice.resume")}
						</button>
					</div>
				</motion.div>
			)}

			{/* Error banner */}
			{error && (
				<div
					className="mx-4 mb-3 rounded-xl p-3 text-sm"
					style={{
						backgroundColor: "var(--color-danger, #EF4444)15",
						color: "var(--color-danger, #EF4444)",
					}}
				>
					{error}
					<button
						type="button"
						onClick={() => setError(null)}
						className="ml-2 font-semibold"
					>
						✕
					</button>
				</div>
			)}

			{/* Main content */}
			<div className="flex-1 px-4 pb-28 overflow-y-auto">
				<AnimatePresence mode="wait">
					{phase === "type" && (
						<motion.div
							key="type"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<PracticeTypeSelector onSelect={handleSelectType} />
						</motion.div>
					)}

					{phase === "build" && (
						<motion.div
							key="build"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<SessionBuilder
								practiceType={practiceType}
								onStartSession={handleStartSession}
								onBack={() => setPhase("type")}
							/>
						</motion.div>
					)}

					{phase === "checkin" && (
						<motion.div
							key="checkin"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="flex flex-col gap-5 pt-4"
						>
							<h2
								className="text-xl font-semibold"
								style={{
									fontFamily: '"DM Sans", sans-serif',
									color: "var(--color-text-primary)",
								}}
							>
								{t("practice.checkin_title")}
							</h2>

							<div
								className="rounded-2xl p-5"
								style={{ backgroundColor: "var(--color-surface-card)" }}
							>
								<p
									className="text-sm font-medium mb-3"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("practice.checkin_mood")}
								</p>
								<div className="flex flex-wrap gap-2">
									{MOOD_OPTIONS.map((m) => (
										<button
											type="button"
											key={m}
											onClick={() => toggleCheckInMood(m)}
											className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition"
											style={{
												backgroundColor: checkInMood.includes(m)
													? "var(--color-primary)"
													: "var(--color-surface)",
												color: checkInMood.includes(m)
													? "white"
													: "var(--color-text-secondary)",
											}}
										>
											{t(`session.moods.${m}`)}
										</button>
									))}
								</div>
							</div>

							<div
								className="rounded-2xl p-5"
								style={{ backgroundColor: "var(--color-surface-card)" }}
							>
								<p
									className="text-sm font-medium mb-3"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("practice.checkin_energy", { n: checkInEnergy })}
								</p>
								<input
									type="range"
									min={1}
									max={10}
									value={checkInEnergy}
									onChange={(e) => setCheckInEnergy(+e.target.value)}
									className="w-full"
									style={{ accentColor: "var(--color-primary)" }}
								/>
							</div>

							<div
								className="rounded-2xl p-5"
								style={{ backgroundColor: "var(--color-surface-card)" }}
							>
								<p
									className="text-sm font-medium mb-3"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("practice.checkin_intention")}
								</p>
								<input
									type="text"
									value={checkInIntention}
									onChange={(e) => setCheckInIntention(e.target.value)}
									placeholder={t("practice.checkin_intention_placeholder")}
									maxLength={200}
									className="w-full text-sm rounded-xl p-3 outline-none focus:ring-1 border"
									style={{
										backgroundColor: "var(--color-surface)",
										color: "var(--color-text-primary)",
										borderColor: "var(--color-border-soft)",
									}}
								/>
							</div>

							<Button
								onClick={handleCheckInComplete}
								size="lg"
								className="w-full"
							>
								{t("practice.begin_practice")}
							</Button>
						</motion.div>
					)}

					{phase === "practice" && (
						<motion.div
							key="practice"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<GuidedPracticePlayer
								blocks={blocks}
								onComplete={handleComplete}
								onAbandon={handleAbandon}
								onSaveProgress={handleSaveProgress}
							/>
						</motion.div>
					)}

					{phase === "journal" && (
						<motion.div
							key="journal"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<PostPracticeJournal
								sessionSummary={sessionSummary}
								checkInData={
									checkInEnabled
										? {
												mood: checkInMood,
												energyLevel: checkInEnergy,
												intention: checkInIntention,
											}
										: null
								}
								onSave={handleSaveJournal}
								saving={saving}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
