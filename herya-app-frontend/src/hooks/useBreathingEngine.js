import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Core breathing engine — drives the pranayama session with accurate timing.
 *
 * Uses `setInterval(16)` paired with `Date.now()` for sub-second accuracy
 * without the drift problems of `setInterval(1000)`. Phase transitions happen
 * when `elapsed >= phaseDuration`, measured against wall-clock deltas.
 *
 * Supports pause/resume, cycle counting, inter-cycle pauses, and completion.
 *
 * @param {object} options
 * @param {string[]} options.activePhases  - Ordered phase keys for one cycle
 * @param {object}   options.phaseDurations - { inhale: 5, hold: 0, exhale: 10, ... } in seconds
 * @param {number}   options.targetCycles   - Total cycles to complete
 * @param {number}   options.pauseBetween   - Seconds between cycles (0 = none)
 * @param {function} options.onPhaseChange  - (phaseKey, phaseIndex) => void
 * @param {function} options.onCycleComplete - (completedCount) => void
 * @param {function} options.onComplete     - () => void — all cycles done
 */
export default function useBreathingEngine({
	activePhases = [],
	phaseDurations = {},
	targetCycles = 10,
	pauseBetween = 0,
	onPhaseChange,
	onCycleComplete,
	onComplete,
}) {
	const [isRunning, setIsRunning] = useState(false);
	const [phaseIdx, setPhaseIdx] = useState(0);
	const [phaseElapsed, setPhaseElapsed] = useState(0);
	const [completedCycles, setCompletedCycles] = useState(0);
	const [isPausing, setIsPausing] = useState(false);
	const [pauseElapsed, setPauseElapsed] = useState(0);
	const [finished, setFinished] = useState(false);

	const intervalRef = useRef(null);
	const lastTickRef = useRef(null);

	// Callback refs to avoid stale closures
	const onPhaseChangeRef = useRef(onPhaseChange);
	const onCycleCompleteRef = useRef(onCycleComplete);
	const onCompleteRef = useRef(onComplete);
	useEffect(() => {
		onPhaseChangeRef.current = onPhaseChange;
	}, [onPhaseChange]);
	useEffect(() => {
		onCycleCompleteRef.current = onCycleComplete;
	}, [onCycleComplete]);
	useEffect(() => {
		onCompleteRef.current = onComplete;
	}, [onComplete]);

	// Mutable state ref for the interval callback
	const stateRef = useRef({
		phaseIdx: 0,
		phaseElapsed: 0,
		completedCycles: 0,
		isPausing: false,
		pauseElapsed: 0,
		finished: false,
	});

	const currentPhaseKey = activePhases[phaseIdx] || activePhases[0] || "inhale";
	const currentPhaseDuration = phaseDurations[currentPhaseKey] || 4;
	const phaseRemaining = Math.max(0, currentPhaseDuration - phaseElapsed);
	const phaseProgress =
		currentPhaseDuration > 0
			? Math.min(1, phaseElapsed / currentPhaseDuration)
			: 0;

	const totalCycleDuration = activePhases.reduce(
		(sum, k) => sum + (phaseDurations[k] || 0),
		0,
	);

	const visibleCycle = Math.min(completedCycles + 1, targetCycles);

	const totalDuration =
		targetCycles * totalCycleDuration +
		Math.max(0, targetCycles - 1) * pauseBetween;

	const globalElapsed =
		completedCycles * (totalCycleDuration + pauseBetween) +
		(isPausing
			? pauseElapsed
			: phaseElapsed +
				activePhases
					.slice(0, phaseIdx)
					.reduce((s, k) => s + (phaseDurations[k] || 0), 0));

	// ── Interval tick ───────────────────────────────────────────────────
	useEffect(() => {
		if (!isRunning || finished) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
			lastTickRef.current = null;
			return;
		}

		lastTickRef.current = Date.now();

		intervalRef.current = setInterval(() => {
			const now = Date.now();
			const dt = Math.min((now - (lastTickRef.current || now)) / 1000, 0.25);
			lastTickRef.current = now;
			const s = stateRef.current;

			if (s.finished) return;

			if (s.isPausing) {
				const nextPause = s.pauseElapsed + dt;
				if (nextPause >= pauseBetween) {
					s.isPausing = false;
					s.pauseElapsed = 0;
					setIsPausing(false);
					setPauseElapsed(0);
				} else {
					s.pauseElapsed = nextPause;
					setPauseElapsed(nextPause);
				}
				return;
			}

			const dur = phaseDurations[activePhases[s.phaseIdx]] || 4;
			const nextElapsed = s.phaseElapsed + dt;

			if (nextElapsed >= dur) {
				// Phase complete
				const nextIdx = (s.phaseIdx + 1) % activePhases.length;

				if (nextIdx === 0) {
					// Cycle complete
					const newCount = s.completedCycles + 1;
					s.completedCycles = newCount;
					setCompletedCycles(newCount);
					onCycleCompleteRef.current?.(newCount);

					if (newCount >= targetCycles) {
						s.finished = true;
						setIsRunning(false);
						setFinished(true);
						setTimeout(() => onCompleteRef.current?.(), 600);
						return;
					}

					if (pauseBetween > 0) {
						s.isPausing = true;
						s.pauseElapsed = 0;
						setIsPausing(true);
						setPauseElapsed(0);
					}
				}

				s.phaseIdx = nextIdx;
				s.phaseElapsed = 0;
				setPhaseIdx(nextIdx);
				setPhaseElapsed(0);
				onPhaseChangeRef.current?.(activePhases[nextIdx], nextIdx);
			} else {
				s.phaseElapsed = nextElapsed;
				setPhaseElapsed(nextElapsed);
			}
		}, 16);

		return () => {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		};
	}, [
		isRunning,
		finished,
		activePhases,
		phaseDurations,
		targetCycles,
		pauseBetween,
	]);

	// ── Controls ────────────────────────────────────────────────────────
	const start = useCallback(() => {
		if (finished) return;
		setIsRunning(true);
	}, [finished]);

	const pause = useCallback(() => {
		setIsRunning(false);
	}, []);

	const toggle = useCallback(() => {
		if (finished) return;
		setIsRunning((r) => !r);
	}, [finished]);

	const reset = useCallback(() => {
		clearInterval(intervalRef.current);
		intervalRef.current = null;
		lastTickRef.current = null;
		stateRef.current = {
			phaseIdx: 0,
			phaseElapsed: 0,
			completedCycles: 0,
			isPausing: false,
			pauseElapsed: 0,
			finished: false,
		};
		setIsRunning(false);
		setPhaseIdx(0);
		setPhaseElapsed(0);
		setCompletedCycles(0);
		setIsPausing(false);
		setPauseElapsed(0);
		setFinished(false);
	}, []);

	return {
		isRunning,
		finished,
		phaseIdx,
		phaseElapsed,
		phaseRemaining,
		phaseProgress,
		currentPhaseKey,
		currentPhaseDuration,
		completedCycles,
		visibleCycle,
		isPausing,
		pauseElapsed,
		totalCycleDuration,
		totalDuration,
		globalElapsed,
		start,
		pause,
		toggle,
		reset,
	};
}
