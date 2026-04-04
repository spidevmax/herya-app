/**
 * Distribute block duration across poses in a VK sequence.
 *
 * ── Model ───────────────────────────────────────────────────────────────────
 *
 *  Session total  = Σ block.durationMinutes
 *  Block duration = user-selected minutes  (e.g. 15)
 *  Pose duration  = block duration ÷ poses, weighted by breath count
 *  Side duration  = pose duration ÷ 2  (if both_sides)
 *
 * ── Algorithm ───────────────────────────────────────────────────────────────
 *
 *  1. For each pose, compute a "weight" = recommended breaths for the level.
 *     Bilateral poses get weight × 2 (both sides).
 *  2. Sum all weights → totalWeight.
 *  3. Each pose gets  (weight / totalWeight) × blockTotalSec  seconds.
 *  4. Enforce a minimum of MIN_POSE_SEC per pose (per side for bilaterals).
 *  5. If the minimums exceed block time, scale proportionally and flag a warning.
 *  6. Round to whole seconds, then redistribute remainder to largest poses
 *     so the sum exactly equals blockTotalSec.
 *
 * ── Modes ───────────────────────────────────────────────────────────────────
 *
 *  "auto"   – proportional distribution (default)
 *  "equal"  – equal time per pose (bilateral still doubled)
 *  "manual" – user overrides per pose (validated, remainder redistributed)
 *
 * @module distributePoseTime
 */

const MIN_POSE_SEC = 12; // minimum seconds per pose (per side)
const SECS_PER_BREATH = 4; // VK standard: ~4 seconds per breath cycle
const DEFAULT_BREATHS = 5;

/**
 * Get recommended breaths for a pose at a given level.
 * Falls back to corePose.breaths, then DEFAULT_BREATHS.
 */
function getBreathsForPose(corePose, level = "beginner") {
	const pose = corePose?.pose;
	if (!pose) return DEFAULT_BREATHS;

	const levelBreaths = pose.recommendedBreaths?.[level];
	if (levelBreaths) {
		return Math.round((levelBreaths.min + levelBreaths.max) / 2);
	}
	return corePose.breaths || DEFAULT_BREATHS;
}

/**
 * Whether a pose requires both sides.
 */
function isBilateral(corePose) {
	return corePose?.pose?.sidedness?.type === "both_sides";
}

/**
 * Compute the "natural" duration of the sequence based on breaths alone,
 * without any block time constraint. Useful for estimating recommended
 * block duration.
 *
 * @param {Array} corePoses - sequence.structure.corePoses
 * @param {string} level - "beginner" | "intermediate" | "advanced"
 * @returns {number} total seconds
 */
export function estimateNaturalDuration(corePoses, level = "beginner") {
	if (!corePoses?.length) return 0;
	return corePoses.reduce((sum, cp) => {
		const breaths = getBreathsForPose(cp, level);
		const sides = isBilateral(cp) ? 2 : 1;
		return sum + breaths * SECS_PER_BREATH * sides;
	}, 0);
}

/**
 * Distribute block time across poses.
 *
 * @param {object} options
 * @param {Array}  options.corePoses       - sequence.structure.corePoses (with populated pose refs)
 * @param {number} options.blockTotalSec   - total block duration in seconds
 * @param {string} options.level           - "beginner" | "intermediate" | "advanced"
 * @param {string} options.mode            - "auto" | "equal" | "manual"
 * @param {object} options.manualOverrides - { [poseIndex]: seconds } for manual mode
 *
 * @returns {object}
 *   .poses      – Array of { index, totalSec, perSideSec, breaths, bilateral, warning? }
 *   .mode       – effective mode used
 *   .warning    – null | "insufficient_time" | "manual_overflow"
 *   .totalSec   – sum of all pose seconds (should equal blockTotalSec)
 *   .naturalSec – what the sequence would take at natural breath pace
 */
export function distributePoseTime({
	corePoses,
	blockTotalSec,
	level = "beginner",
	mode = "auto",
	manualOverrides = {},
}) {
	if (!corePoses?.length || blockTotalSec <= 0) {
		return {
			poses: [],
			mode,
			warning: !corePoses?.length ? null : "invalid_duration",
			totalSec: 0,
			naturalSec: 0,
		};
	}

	const naturalSec = estimateNaturalDuration(corePoses, level);

	// ── Manual mode ──────────────────────────────────────────────────────
	if (mode === "manual") {
		return distributeManual(
			corePoses,
			blockTotalSec,
			level,
			manualOverrides,
			naturalSec,
		);
	}

	// ── Equal mode ───────────────────────────────────────────────────────
	if (mode === "equal") {
		return distributeEqual(corePoses, blockTotalSec, level, naturalSec);
	}

	// ── Auto (proportional) mode ─────────────────────────────────────────
	return distributeAuto(corePoses, blockTotalSec, level, naturalSec);
}

// ── Auto distribution ────────────────────────────────────────────────────
function distributeAuto(corePoses, blockTotalSec, level, naturalSec) {
	const weights = corePoses.map((cp) => {
		const breaths = getBreathsForPose(cp, level);
		const sides = isBilateral(cp) ? 2 : 1;
		return breaths * sides;
	});
	const totalWeight = weights.reduce((a, b) => a + b, 0);

	// Check if minimum times are feasible
	const minRequired = corePoses.reduce((sum, cp) => {
		const sides = isBilateral(cp) ? 2 : 1;
		return sum + MIN_POSE_SEC * sides;
	}, 0);

	let warning = null;
	let effectiveTotal = blockTotalSec;

	if (minRequired > blockTotalSec) {
		warning = "insufficient_time";
		// Scale down proportionally but still allocate
		effectiveTotal = blockTotalSec;
	}

	// Proportional allocation
	const rawAllocations = weights.map((w) => (w / totalWeight) * effectiveTotal);

	// Apply minimums
	const poses = applyMinimumsAndRound(
		corePoses,
		rawAllocations,
		effectiveTotal,
		level,
		warning,
	);

	return {
		poses,
		mode: "auto",
		warning,
		totalSec: poses.reduce((s, p) => s + p.totalSec, 0),
		naturalSec,
	};
}

// ── Equal distribution ───────────────────────────────────────────────────
function distributeEqual(corePoses, blockTotalSec, level, naturalSec) {
	// Weight by sides only (bilateral gets 2 units, symmetric gets 1)
	const units = corePoses.map((cp) => (isBilateral(cp) ? 2 : 1));
	const totalUnits = units.reduce((a, b) => a + b, 0);

	const rawAllocations = units.map((u) => (u / totalUnits) * blockTotalSec);

	const minRequired = corePoses.reduce((sum, cp) => {
		const sides = isBilateral(cp) ? 2 : 1;
		return sum + MIN_POSE_SEC * sides;
	}, 0);

	const warning = minRequired > blockTotalSec ? "insufficient_time" : null;

	const poses = applyMinimumsAndRound(
		corePoses,
		rawAllocations,
		blockTotalSec,
		level,
		warning,
	);

	return {
		poses,
		mode: "equal",
		warning,
		totalSec: poses.reduce((s, p) => s + p.totalSec, 0),
		naturalSec,
	};
}

// ── Manual distribution ──────────────────────────────────────────────────
function distributeManual(
	corePoses,
	blockTotalSec,
	level,
	manualOverrides,
	naturalSec,
) {
	// Start with auto distribution as base
	const autoResult = distributeAuto(
		corePoses,
		blockTotalSec,
		level,
		naturalSec,
	);
	const poses = autoResult.poses.map((p, i) => {
		if (manualOverrides[i] !== undefined) {
			const overrideSec = Math.max(
				MIN_POSE_SEC,
				Number(manualOverrides[i]) || 0,
			);
			const bilateral = isBilateral(corePoses[i]);
			return {
				...p,
				totalSec: overrideSec,
				perSideSec: bilateral ? Math.round(overrideSec / 2) : overrideSec,
				breaths: Math.round(
					overrideSec / SECS_PER_BREATH / (bilateral ? 2 : 1),
				),
				manual: true,
			};
		}
		return p;
	});

	// Check if manual overrides alone exceed block time
	const manualOnlyTotal = poses
		.filter((p) => p.manual)
		.reduce((s, p) => s + p.totalSec, 0);
	let warning = null;

	if (manualOnlyTotal > blockTotalSec) {
		warning = "manual_overflow";
	} else {
		// Redistribute remaining time to non-manual poses
		const remaining = blockTotalSec - manualOnlyTotal;
		const nonManual = poses.filter((p) => !p.manual);
		if (nonManual.length > 0) {
			const nonManualTotal = nonManual.reduce((s, p) => s + p.totalSec, 0);
			for (const p of nonManual) {
				const ratio =
					nonManualTotal > 0
						? p.totalSec / nonManualTotal
						: 1 / nonManual.length;
				const newTotal = Math.round(ratio * remaining);
				const bilateral = p.bilateral;
				p.totalSec = newTotal;
				p.perSideSec = bilateral ? Math.round(newTotal / 2) : newTotal;
				p.breaths = Math.round(
					newTotal / SECS_PER_BREATH / (bilateral ? 2 : 1),
				);
			}
		}
	}

	// Fix rounding to match exactly
	const currentTotal = poses.reduce((s, p) => s + p.totalSec, 0);
	if (currentTotal !== blockTotalSec && !warning) {
		const diff = blockTotalSec - currentTotal;
		// Apply to the largest non-manual pose
		const target = poses
			.filter((p) => !p.manual)
			.sort((a, b) => b.totalSec - a.totalSec)[0];
		if (target) {
			target.totalSec += diff;
			target.perSideSec = target.bilateral
				? Math.round(target.totalSec / 2)
				: target.totalSec;
			target.breaths = Math.round(
				target.totalSec / SECS_PER_BREATH / (target.bilateral ? 2 : 1),
			);
		}
	}

	return {
		poses,
		mode: "manual",
		warning,
		totalSec: poses.reduce((s, p) => s + p.totalSec, 0),
		naturalSec,
	};
}

// ── Shared: apply minimums and round ─────────────────────────────────────
function applyMinimumsAndRound(
	corePoses,
	rawAllocations,
	targetTotal,
	_level,
	warning,
) {
	const n = corePoses.length;

	// Apply minimums (only when we have enough time)
	const allocations = rawAllocations.map((raw, i) => {
		if (warning) return raw; // skip minimums when time is insufficient
		const sides = isBilateral(corePoses[i]) ? 2 : 1;
		const min = MIN_POSE_SEC * sides;
		return Math.max(raw, min);
	});

	// If minimums pushed us over, scale back proportionally
	const allocTotal = allocations.reduce((a, b) => a + b, 0);
	if (allocTotal > targetTotal) {
		const scale = targetTotal / allocTotal;
		for (let i = 0; i < n; i++) {
			allocations[i] = allocations[i] * scale;
		}
	}

	// Round to integers
	const rounded = allocations.map((a) => Math.round(a));
	const roundedTotal = rounded.reduce((a, b) => a + b, 0);

	// Fix rounding error: add/subtract from largest poses
	let diff = targetTotal - roundedTotal;
	if (diff !== 0) {
		const indices = [...Array(n).keys()].sort(
			(a, b) => rounded[b] - rounded[a],
		);
		for (const idx of indices) {
			if (diff === 0) break;
			if (diff > 0) {
				rounded[idx] += 1;
				diff -= 1;
			} else {
				if (rounded[idx] > MIN_POSE_SEC) {
					rounded[idx] -= 1;
					diff += 1;
				}
			}
		}
	}

	return corePoses.map((cp, i) => {
		const bilateral = isBilateral(cp);
		const totalSec = rounded[i];
		const perSideSec = bilateral ? Math.round(totalSec / 2) : totalSec;
		const breaths = Math.max(1, Math.round(perSideSec / SECS_PER_BREATH));

		return {
			index: i,
			totalSec,
			perSideSec,
			breaths,
			bilateral,
			poseName: cp.pose?.romanizationName || cp.pose?.name || `Pose ${i + 1}`,
		};
	});
}

/**
 * Format seconds as "Xm Ys" or just "Xs".
 */
export function formatPoseDuration(sec) {
	if (sec >= 60) {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return s > 0 ? `${m}m ${s}s` : `${m}m`;
	}
	return `${sec}s`;
}

export default distributePoseTime;
