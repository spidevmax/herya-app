import { describe, expect, it } from "vitest";
import {
	distributePoseTime,
	formatPoseDuration,
} from "@/utils/distributePoseTime";

/**
 * Integration tests: verify time consistency across the VK flow.
 *
 * These tests simulate the data flow:
 *   SessionBuilder (block config) → distributePoseTime → PoseByPosePlayer (per-pose allocation)
 *
 * The invariant: sum of all pose durations === block duration, always.
 */

// ── Helpers ────────────────────────────────────────────────────────────────
const mkPose = (name, breaths = 5, type = "symmetric") => ({
	pose: {
		romanizationName: name,
		sidedness: {
			type,
			...(type === "both_sides" ? { breathsPerSide: breaths } : {}),
		},
		recommendedBreaths: {
			beginner: { min: breaths - 1, max: breaths + 1 },
			intermediate: { min: breaths + 1, max: breaths + 3 },
			advanced: { min: breaths + 3, max: breaths + 5 },
		},
	},
	breaths,
});

const sunSalutation = [
	mkPose("Tadasana", 3),
	mkPose("Uttanasana", 5),
	mkPose("Ardha Uttanasana", 3),
	mkPose("Chaturanga", 3),
	mkPose("Urdhva Mukha", 5),
	mkPose("Adho Mukha", 8),
];

const mixedSequence = [
	mkPose("Tadasana", 3),
	mkPose("Trikonasana", 5, "both_sides"),
	mkPose("Virabhadrasana I", 5, "both_sides"),
	mkPose("Uttanasana", 5),
	mkPose("Adho Mukha", 8),
];

describe("VK Time Distribution — Integration", () => {
	describe("sum invariant", () => {
		const durations = [60, 120, 180, 300, 600, 900];
		const modes = ["auto", "equal"];
		const levels = ["beginner", "intermediate", "advanced"];

		for (const dur of durations) {
			for (const mode of modes) {
				for (const level of levels) {
					it(`sum === ${dur}s in ${mode} mode at ${level}`, () => {
						const result = distributePoseTime({
							corePoses: sunSalutation,
							blockTotalSec: dur,
							level,
							mode,
						});
						const sum = result.poses.reduce((s, p) => s + p.totalSec, 0);
						expect(sum).toBe(dur);
						expect(result.totalSec).toBe(dur);
					});
				}
			}
		}
	});

	describe("bilateral doubling", () => {
		it("bilateral poses get approximately 2x the time of symmetric in auto mode", () => {
			const result = distributePoseTime({
				corePoses: mixedSequence,
				blockTotalSec: 300,
				level: "beginner",
				mode: "auto",
			});

			const trikonasana = result.poses[1]; // bilateral 5 breaths
			const uttanasana = result.poses[3]; // symmetric 5 breaths

			// Bilateral should get roughly 2x (allow some rounding margin)
			expect(trikonasana.totalSec).toBeGreaterThan(uttanasana.totalSec * 1.5);
			expect(trikonasana.bilateral).toBe(true);
			expect(uttanasana.bilateral).toBe(false);
		});

		it("perSideSec is roughly half of totalSec for bilateral poses", () => {
			const result = distributePoseTime({
				corePoses: mixedSequence,
				blockTotalSec: 300,
				level: "beginner",
				mode: "auto",
			});

			for (const p of result.poses) {
				if (p.bilateral) {
					expect(p.perSideSec).toBe(Math.round(p.totalSec / 2));
				} else {
					expect(p.perSideSec).toBe(p.totalSec);
				}
			}
		});
	});

	describe("manual mode consistency", () => {
		it("manual overrides are respected, remainder distributed", () => {
			const result = distributePoseTime({
				corePoses: sunSalutation,
				blockTotalSec: 300,
				level: "beginner",
				mode: "manual",
				manualOverrides: { 0: 60, 5: 90 },
			});

			expect(result.poses[0].totalSec).toBe(60);
			expect(result.poses[0].manual).toBe(true);
			expect(result.poses[5].totalSec).toBe(90);
			expect(result.poses[5].manual).toBe(true);

			const sum = result.poses.reduce((s, p) => s + p.totalSec, 0);
			expect(sum).toBe(300);
		});

		it("overflow detected when manual overrides exceed block", () => {
			const result = distributePoseTime({
				corePoses: sunSalutation,
				blockTotalSec: 100,
				level: "beginner",
				mode: "manual",
				manualOverrides: { 0: 60, 1: 60 },
			});

			expect(result.warning).toBe("manual_overflow");
		});
	});

	describe("level scaling", () => {
		it("advanced level produces longer natural duration than beginner", () => {
			const beginner = distributePoseTime({
				corePoses: sunSalutation,
				blockTotalSec: 300,
				level: "beginner",
				mode: "auto",
			});
			const advanced = distributePoseTime({
				corePoses: sunSalutation,
				blockTotalSec: 300,
				level: "advanced",
				mode: "auto",
			});

			expect(advanced.naturalSec).toBeGreaterThan(beginner.naturalSec);
		});
	});

	describe("edge: very short block", () => {
		it("all poses get time even with insufficient_time warning", () => {
			const result = distributePoseTime({
				corePoses: sunSalutation,
				blockTotalSec: 30,
				level: "beginner",
				mode: "auto",
			});

			expect(result.warning).toBe("insufficient_time");
			expect(result.totalSec).toBe(30);
			for (const p of result.poses) {
				expect(p.totalSec).toBeGreaterThan(0);
			}
		});
	});

	describe("formatPoseDuration consistency", () => {
		it("formats all pose durations without error", () => {
			const result = distributePoseTime({
				corePoses: mixedSequence,
				blockTotalSec: 300,
				level: "beginner",
				mode: "auto",
			});

			for (const p of result.poses) {
				const formatted = formatPoseDuration(p.totalSec);
				expect(formatted).toMatch(/^\d+[ms]/);
				if (p.bilateral) {
					const perSide = formatPoseDuration(p.perSideSec);
					expect(perSide).toMatch(/^\d+[ms]/);
				}
			}
		});
	});
});
