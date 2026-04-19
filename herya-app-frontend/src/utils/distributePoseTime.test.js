import { describe, expect, it } from "vitest";
import {
	distributePoseTime,
	estimateNaturalDuration,
	formatPoseDuration,
} from "./distributePoseTime";

// ── Mock data ───────────────────────────────────────────────────────────────
const symmetricPose = (breaths = 5) => ({
	pose: {
		romanizationName: "Uttanasana",
		sidedness: { type: "symmetric" },
		recommendedBreaths: {
			beginner: { min: breaths - 1, max: breaths + 1 },
			intermediate: { min: breaths + 1, max: breaths + 3 },
			advanced: { min: breaths + 3, max: breaths + 5 },
		},
	},
	breaths,
});

const bilateralPose = (breaths = 5) => ({
	pose: {
		romanizationName: "Trikonasana",
		sidedness: { type: "both_sides", breathsPerSide: breaths },
		recommendedBreaths: {
			beginner: { min: breaths - 1, max: breaths + 1 },
			intermediate: { min: breaths + 1, max: breaths + 3 },
			advanced: { min: breaths + 3, max: breaths + 5 },
		},
	},
	breaths,
});

const bareCorePose = (breaths = 5) => ({
	pose: { romanizationName: "Unknown", sidedness: { type: "symmetric" } },
	breaths,
});

describe("distributePoseTime", () => {
	describe("estimateNaturalDuration", () => {
		it("calculates natural duration for symmetric poses", () => {
			const poses = [symmetricPose(5), symmetricPose(5)];
			// 5 breaths × 4s × 1 side × 2 poses = 40s
			expect(estimateNaturalDuration(poses, "beginner")).toBe(40);
		});

		it("doubles time for bilateral poses", () => {
			const poses = [bilateralPose(5)];
			// 5 breaths × 4s × 2 sides = 40s
			expect(estimateNaturalDuration(poses, "beginner")).toBe(40);
		});

		it("returns 0 for empty array", () => {
			expect(estimateNaturalDuration([], "beginner")).toBe(0);
		});

		it("uses level-appropriate breaths", () => {
			const poses = [symmetricPose(5)];
			// intermediate: (6+8)/2 = 7 breaths × 4s = 28s
			expect(estimateNaturalDuration(poses, "intermediate")).toBe(28);
		});
	});

	describe("auto mode", () => {
		it("distributes time proportionally by breaths", () => {
			const poses = [symmetricPose(5), symmetricPose(10)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 120,
				level: "beginner",
				mode: "auto",
			});

			expect(result.mode).toBe("auto");
			expect(result.warning).toBeNull();
			expect(result.totalSec).toBe(120);
			expect(result.poses).toHaveLength(2);

			// Pose with 10 breaths should get roughly 2x the time of pose with 5
			expect(result.poses[1].totalSec).toBeGreaterThan(result.poses[0].totalSec);
		});

		it("sum of pose times exactly equals block total", () => {
			const poses = [symmetricPose(3), symmetricPose(5), symmetricPose(7)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 300,
				level: "beginner",
				mode: "auto",
			});

			const sum = result.poses.reduce((s, p) => s + p.totalSec, 0);
			expect(sum).toBe(300);
		});

		it("handles bilateral poses with double weight", () => {
			const poses = [symmetricPose(5), bilateralPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 120,
				level: "beginner",
				mode: "auto",
			});

			// Bilateral should get ~2x the time
			expect(result.poses[1].totalSec).toBeGreaterThan(result.poses[0].totalSec);
			expect(result.poses[1].bilateral).toBe(true);
			expect(result.poses[1].perSideSec).toBe(
				Math.round(result.poses[1].totalSec / 2),
			);
		});

		it("warns when block time is too short for minimums", () => {
			const poses = [symmetricPose(5), symmetricPose(5), symmetricPose(5)];
			// 3 poses × 12s minimum = 36s, but only 30s
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 30,
				level: "beginner",
				mode: "auto",
			});

			expect(result.warning).toBe("insufficient_time");
			expect(result.totalSec).toBe(30);
		});

		it("every pose gets at least some time even with warning", () => {
			const poses = [symmetricPose(5), symmetricPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 20,
				level: "beginner",
				mode: "auto",
			});

			for (const p of result.poses) {
				expect(p.totalSec).toBeGreaterThan(0);
			}
		});

		it("computes breaths per pose from allocated time", () => {
			const poses = [symmetricPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 60,
				level: "beginner",
				mode: "auto",
			});

			// 60s ÷ 4s per breath = 15 breaths
			expect(result.poses[0].breaths).toBe(15);
		});

		it("returns naturalSec alongside distribution", () => {
			const poses = [symmetricPose(5), symmetricPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 120,
				level: "beginner",
				mode: "auto",
			});

			expect(result.naturalSec).toBe(40); // 2 × 5 × 4
		});
	});

	describe("equal mode", () => {
		it("gives equal time to symmetric poses", () => {
			const poses = [symmetricPose(3), symmetricPose(10)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 120,
				level: "beginner",
				mode: "equal",
			});

			expect(result.mode).toBe("equal");
			// Both should get ~60s each (they're both symmetric = 1 unit)
			expect(result.poses[0].totalSec).toBe(60);
			expect(result.poses[1].totalSec).toBe(60);
		});

		it("gives bilateral poses double the time of symmetric", () => {
			const poses = [symmetricPose(5), bilateralPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 120,
				level: "beginner",
				mode: "equal",
			});

			// symmetric = 1 unit, bilateral = 2 units, total = 3 units
			// symmetric gets 1/3 × 120 = 40, bilateral gets 2/3 × 120 = 80
			expect(result.poses[0].totalSec).toBe(40);
			expect(result.poses[1].totalSec).toBe(80);
		});

		it("sum equals blockTotalSec", () => {
			const poses = [symmetricPose(5), symmetricPose(5), bilateralPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 180,
				level: "beginner",
				mode: "equal",
			});

			const sum = result.poses.reduce((s, p) => s + p.totalSec, 0);
			expect(sum).toBe(180);
		});
	});

	describe("manual mode", () => {
		it("applies manual overrides and redistributes remainder", () => {
			const poses = [symmetricPose(5), symmetricPose(5), symmetricPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 120,
				level: "beginner",
				mode: "manual",
				manualOverrides: { 0: 60 },
			});

			expect(result.mode).toBe("manual");
			expect(result.poses[0].totalSec).toBe(60);
			expect(result.poses[0].manual).toBe(true);
			// Other poses share the remaining 60s
			expect(result.poses[1].totalSec + result.poses[2].totalSec).toBe(60);
		});

		it("warns when manual overrides exceed block time", () => {
			const poses = [symmetricPose(5), symmetricPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 60,
				level: "beginner",
				mode: "manual",
				manualOverrides: { 0: 50, 1: 50 },
			});

			expect(result.warning).toBe("manual_overflow");
		});

		it("enforces minimum on manual override", () => {
			const poses = [symmetricPose(5)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 60,
				level: "beginner",
				mode: "manual",
				manualOverrides: { 0: 3 }, // below minimum
			});

			expect(result.poses[0].totalSec).toBeGreaterThanOrEqual(12);
		});
	});

	describe("edge cases", () => {
		it("handles empty corePoses", () => {
			const result = distributePoseTime({
				corePoses: [],
				blockTotalSec: 120,
				level: "beginner",
			});

			expect(result.poses).toHaveLength(0);
			expect(result.totalSec).toBe(0);
		});

		it("handles zero blockTotalSec", () => {
			const result = distributePoseTime({
				corePoses: [symmetricPose(5)],
				blockTotalSec: 0,
				level: "beginner",
			});

			expect(result.warning).toBe("invalid_duration");
			expect(result.totalSec).toBe(0);
		});

		it("handles single pose", () => {
			const result = distributePoseTime({
				corePoses: [symmetricPose(5)],
				blockTotalSec: 60,
				level: "beginner",
				mode: "auto",
			});

			expect(result.poses).toHaveLength(1);
			expect(result.poses[0].totalSec).toBe(60);
		});

		it("handles poses without recommendedBreaths (uses fallback)", () => {
			const result = distributePoseTime({
				corePoses: [bareCorePose(8)],
				blockTotalSec: 60,
				level: "beginner",
				mode: "auto",
			});

			expect(result.poses[0].totalSec).toBe(60);
			// Uses corePose.breaths = 8 as fallback
		});

		it("handles many poses in short time", () => {
			const poses = Array.from({ length: 10 }, () => symmetricPose(5));
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 60,
				level: "beginner",
				mode: "auto",
			});

			// 10 poses × 12s min = 120s > 60s → warning
			expect(result.warning).toBe("insufficient_time");
			expect(result.totalSec).toBe(60);
			// Every pose still gets time
			for (const p of result.poses) {
				expect(p.totalSec).toBeGreaterThan(0);
			}
		});
	});

	describe("recommendedHoldSeconds (auto mode)", () => {
		const holdPose = (name, holdSec, type = "symmetric", breaths = 5) => ({
			pose: {
				romanizationName: name,
				sidedness: { type },
				recommendedHoldSeconds: holdSec,
				recommendedBreaths: {
					beginner: { min: breaths - 1, max: breaths + 1 },
					intermediate: { min: breaths + 1, max: breaths + 3 },
					advanced: { min: breaths + 3, max: breaths + 5 },
				},
			},
			breaths,
		});

		it("uses recommendedHoldSeconds as weight when present", () => {
			// Savasana 300s + Setu Bandhasana 60s, 15 min = 900s
			// Expected ratio 5:1 → Savasana 750s, Setu 150s
			const poses = [holdPose("Savasana", 300), holdPose("Setu", 60)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 900,
				level: "beginner",
				mode: "auto",
			});
			expect(result.poses[0].totalSec).toBe(750);
			expect(result.poses[1].totalSec).toBe(150);
		});

		it("falls back to breaths when recommendedHoldSeconds is missing", () => {
			// No hold → uses breaths × 4. 5 vs 10 → 1:2 → 40s/80s in 120s block
			const poses = [symmetricPose(5), symmetricPose(10)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 120,
				level: "beginner",
				mode: "auto",
			});
			expect(result.poses[0].totalSec).toBe(40);
			expect(result.poses[1].totalSec).toBe(80);
		});

		it("caps a dominant pose at MAX_POSE_RATIO when 3+ poses", () => {
			// 3 poses: Savasana 300, two short 30s → would give Savasana 83% without cap
			const poses = [
				holdPose("Savasana", 300),
				holdPose("Tadasana", 30),
				holdPose("Mountain", 30),
			];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 600,
				level: "beginner",
				mode: "auto",
			});
			// Cap is 45% × 600 = 270s
			expect(result.poses[0].totalSec).toBeLessThanOrEqual(270);
			// Sum still equals block
			const sum = result.poses.reduce((s, p) => s + p.totalSec, 0);
			expect(sum).toBe(600);
			// The two short ones absorbed the excess
			expect(result.poses[1].totalSec).toBeGreaterThan(30);
		});

		it("does NOT cap with only 2 poses (preserves natural ratio)", () => {
			// 2 poses: Savasana 300 + Setu 60 → ratio 5:1 stays
			const poses = [holdPose("Savasana", 300), holdPose("Setu", 60)];
			const result = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 900,
				level: "beginner",
				mode: "auto",
			});
			// 750/900 = 83% — well over the 45% cap, intentionally allowed
			expect(result.poses[0].totalSec).toBeGreaterThan(900 * 0.45);
		});

		it("recommended mode now produces different result than equal mode", () => {
			// Regression: was the original bug — both modes returned 50/50
			const poses = [holdPose("Savasana", 300), holdPose("Setu", 60)];
			const auto = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 600,
				level: "beginner",
				mode: "auto",
			});
			const equal = distributePoseTime({
				corePoses: poses,
				blockTotalSec: 600,
				level: "beginner",
				mode: "equal",
			});
			expect(auto.poses[0].totalSec).not.toBe(equal.poses[0].totalSec);
			expect(equal.poses[0].totalSec).toBe(equal.poses[1].totalSec);
		});
	});

	describe("formatPoseDuration", () => {
		it("formats seconds only", () => {
			expect(formatPoseDuration(45)).toBe("45s");
		});

		it("formats minutes only", () => {
			expect(formatPoseDuration(120)).toBe("2m");
		});

		it("formats minutes and seconds", () => {
			expect(formatPoseDuration(90)).toBe("1m 30s");
		});

		it("formats zero", () => {
			expect(formatPoseDuration(0)).toBe("0s");
		});
	});
});
