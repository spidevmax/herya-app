/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useBreathingEngine from "./useBreathingEngine";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

/** Advance fake timers and flush React state updates */
function advance(ms) {
	act(() => {
		vi.advanceTimersByTime(ms);
	});
}

const DEFAULT_OPTS = {
	activePhases: ["inhale", "exhale"],
	phaseDurations: { inhale: 2, exhale: 2 },
	targetCycles: 3,
	pauseBetween: 0,
};

describe("useBreathingEngine", () => {
	describe("initial state", () => {
		it("starts stopped at phase 0", () => {
			const { result } = renderHook(() => useBreathingEngine(DEFAULT_OPTS));
			expect(result.current.isRunning).toBe(false);
			expect(result.current.phaseIdx).toBe(0);
			expect(result.current.completedCycles).toBe(0);
			expect(result.current.currentPhaseKey).toBe("inhale");
			expect(result.current.finished).toBe(false);
		});

		it("calculates totalCycleDuration", () => {
			const { result } = renderHook(() => useBreathingEngine(DEFAULT_OPTS));
			expect(result.current.totalCycleDuration).toBe(4);
		});

		it("calculates visibleCycle as 1", () => {
			const { result } = renderHook(() => useBreathingEngine(DEFAULT_OPTS));
			expect(result.current.visibleCycle).toBe(1);
		});
	});

	describe("start / pause / toggle", () => {
		it("starts the engine", () => {
			const { result } = renderHook(() => useBreathingEngine(DEFAULT_OPTS));
			act(() => result.current.start());
			expect(result.current.isRunning).toBe(true);
		});

		it("pauses the engine", () => {
			const { result } = renderHook(() => useBreathingEngine(DEFAULT_OPTS));
			act(() => result.current.start());
			act(() => result.current.pause());
			expect(result.current.isRunning).toBe(false);
		});

		it("toggles between running and paused", () => {
			const { result } = renderHook(() => useBreathingEngine(DEFAULT_OPTS));
			act(() => result.current.toggle());
			expect(result.current.isRunning).toBe(true);
			act(() => result.current.toggle());
			expect(result.current.isRunning).toBe(false);
		});
	});

	describe("phase transitions", () => {
		it("advances phase after phaseDuration elapses", () => {
			const onPhaseChange = vi.fn();
			const { result } = renderHook(() =>
				useBreathingEngine({ ...DEFAULT_OPTS, onPhaseChange }),
			);

			act(() => result.current.start());
			advance(2100); // past 2s inhale

			expect(result.current.currentPhaseKey).toBe("exhale");
			expect(onPhaseChange).toHaveBeenCalledWith("exhale", 1);
		});

		it("completes a cycle and increments counter", () => {
			const onCycleComplete = vi.fn();
			const { result } = renderHook(() =>
				useBreathingEngine({ ...DEFAULT_OPTS, onCycleComplete }),
			);

			act(() => result.current.start());
			advance(4200); // past full cycle (2s + 2s)

			expect(result.current.completedCycles).toBe(1);
			expect(result.current.visibleCycle).toBe(2);
			expect(onCycleComplete).toHaveBeenCalledWith(1);
		});
	});

	describe("cycle completion", () => {
		it("sets finished and calls onComplete after all target cycles", () => {
			const onComplete = vi.fn();
			const { result } = renderHook(() =>
				useBreathingEngine({
					...DEFAULT_OPTS,
					targetCycles: 1,
					onComplete,
				}),
			);

			act(() => result.current.start());
			advance(4200); // past 1 cycle

			expect(result.current.finished).toBe(true);
			expect(result.current.isRunning).toBe(false);

			advance(700); // flush setTimeout for onComplete
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		it("does not start after finished", () => {
			const { result } = renderHook(() =>
				useBreathingEngine({
					...DEFAULT_OPTS,
					targetCycles: 1,
				}),
			);

			act(() => result.current.start());
			advance(4500);

			expect(result.current.finished).toBe(true);
			act(() => result.current.start());
			expect(result.current.isRunning).toBe(false);
		});
	});

	describe("pause between cycles", () => {
		it("enters pause state between cycles", () => {
			const { result } = renderHook(() =>
				useBreathingEngine({
					...DEFAULT_OPTS,
					pauseBetween: 2,
				}),
			);

			act(() => result.current.start());
			advance(4200); // past cycle 1

			expect(result.current.isPausing).toBe(true);
			expect(result.current.completedCycles).toBe(1);
		});

		it("exits pause after pauseBetween duration", () => {
			const { result } = renderHook(() =>
				useBreathingEngine({
					...DEFAULT_OPTS,
					pauseBetween: 1,
				}),
			);

			act(() => result.current.start());
			advance(5500); // past cycle (4s) + pause (1s)

			expect(result.current.isPausing).toBe(false);
			expect(result.current.completedCycles).toBe(1);
		});
	});

	describe("reset", () => {
		it("resets all state to initial", () => {
			const { result } = renderHook(() => useBreathingEngine(DEFAULT_OPTS));

			act(() => result.current.start());
			advance(1000);
			act(() => result.current.reset());

			expect(result.current.isRunning).toBe(false);
			expect(result.current.phaseIdx).toBe(0);
			expect(result.current.completedCycles).toBe(0);
			expect(result.current.finished).toBe(false);
			expect(result.current.isPausing).toBe(false);
		});
	});

	describe("three-phase technique", () => {
		it("handles inhale → hold → exhale correctly", () => {
			const onCycleComplete = vi.fn();
			const { result } = renderHook(() =>
				useBreathingEngine({
					activePhases: ["inhale", "hold", "exhale"],
					phaseDurations: { inhale: 1, hold: 1, exhale: 1 },
					targetCycles: 2,
					pauseBetween: 0,
					onCycleComplete,
				}),
			);

			act(() => result.current.start());

			advance(1100);
			expect(result.current.currentPhaseKey).toBe("hold");

			advance(1100);
			expect(result.current.currentPhaseKey).toBe("exhale");

			advance(1100);
			expect(onCycleComplete).toHaveBeenCalledWith(1);
			expect(result.current.currentPhaseKey).toBe("inhale");
		});
	});

	describe("four-phase technique", () => {
		it("handles inhale → hold → exhale → holdAfterExhale", () => {
			const { result } = renderHook(() =>
				useBreathingEngine({
					activePhases: ["inhale", "hold", "exhale", "holdAfterExhale"],
					phaseDurations: {
						inhale: 1,
						hold: 1,
						exhale: 1,
						holdAfterExhale: 1,
					},
					targetCycles: 1,
					pauseBetween: 0,
				}),
			);

			expect(result.current.totalCycleDuration).toBe(4);

			act(() => result.current.start());

			advance(1100);
			expect(result.current.currentPhaseKey).toBe("hold");

			advance(1100);
			expect(result.current.currentPhaseKey).toBe("exhale");

			advance(1100);
			expect(result.current.currentPhaseKey).toBe("holdAfterExhale");

			advance(1100);
			expect(result.current.finished).toBe(true);
		});
	});

	describe("phaseProgress", () => {
		it("reports progress between 0 and 1 during a phase", () => {
			const { result } = renderHook(() =>
				useBreathingEngine({
					activePhases: ["inhale", "exhale"],
					phaseDurations: { inhale: 4, exhale: 4 },
					targetCycles: 1,
					pauseBetween: 0,
				}),
			);

			act(() => result.current.start());
			advance(2000); // 2s into 4s inhale

			expect(result.current.phaseProgress).toBeGreaterThan(0);
			expect(result.current.phaseProgress).toBeLessThanOrEqual(1);
		});
	});

	describe("pause and resume accuracy", () => {
		it("preserves progress after pause/resume", () => {
			const { result } = renderHook(() =>
				useBreathingEngine({
					...DEFAULT_OPTS,
					phaseDurations: { inhale: 4, exhale: 4 },
				}),
			);

			act(() => result.current.start());
			advance(1000); // 1s in

			act(() => result.current.pause());
			const progressAtPause = result.current.phaseElapsed;
			expect(progressAtPause).toBeGreaterThan(0);

			advance(5000); // time passes while paused

			act(() => result.current.start());
			// phaseElapsed should not have jumped
			expect(result.current.phaseElapsed).toBeCloseTo(progressAtPause, 0);
		});
	});
});
