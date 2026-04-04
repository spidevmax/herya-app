import { describe, expect, it } from "vitest";
import {
	getProfile,
	applyLowStim,
	PHASE_KEYS,
	PHASE_COLORS,
	PHASE_LABEL_KEYS,
} from "./techniqueProfiles";

// ── Mock patterns matching backend seed data ────────────────────────────────
const MOCK_PATTERNS = {
	ujjayi: {
		romanizationName: "Ujjayi",
		patternRatio: { inhale: 1, hold: 0, exhale: 2, holdAfterExhale: 0 },
		baseBreathDuration: 5,
	},
	nadiShodhana: {
		romanizationName: "Nadi Shodhana",
		patternRatio: { inhale: 1, hold: 1, exhale: 2, holdAfterExhale: 0 },
		baseBreathDuration: 4,
	},
	kapalabhati: {
		romanizationName: "Kapalabhati",
		patternRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
		baseBreathDuration: 3,
		patternType: "count_based",
	},
	bhastrika: {
		romanizationName: "Bhastrika",
		patternRatio: { inhale: 1, hold: 1, exhale: 1, holdAfterExhale: 0 },
		baseBreathDuration: 3,
	},
	bhramari: {
		romanizationName: "Bhramari",
		patternRatio: { inhale: 1, hold: 0, exhale: 2, holdAfterExhale: 0 },
		baseBreathDuration: 5,
	},
	sitali: {
		romanizationName: "Sitali",
		patternRatio: { inhale: 1, hold: 0, exhale: 2, holdAfterExhale: 0 },
		baseBreathDuration: 5,
	},
	samaVritti: {
		romanizationName: "Sama Vritti",
		patternRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
		baseBreathDuration: 4,
	},
	agniPrasana: {
		romanizationName: "Agni Prasana",
		patternRatio: { inhale: 1, hold: 1, exhale: 2, holdAfterExhale: 1 },
		baseBreathDuration: 4,
	},
};

describe("techniqueProfiles", () => {
	describe("constants", () => {
		it("exports standard phase keys", () => {
			expect(PHASE_KEYS).toEqual([
				"inhale",
				"hold",
				"exhale",
				"holdAfterExhale",
			]);
		});

		it("has colours for all standard phases", () => {
			for (const key of PHASE_KEYS) {
				expect(PHASE_COLORS[key]).toBeDefined();
			}
			expect(PHASE_COLORS.rest).toBeDefined();
		});

		it("has translation keys for all standard phases", () => {
			for (const key of PHASE_KEYS) {
				expect(PHASE_LABEL_KEYS[key]).toMatch(/^pranayama\./);
			}
		});
	});

	describe("getProfile", () => {
		it("returns default profile when pattern is null", () => {
			const profile = getProfile(null);
			expect(profile.activePhases.length).toBeGreaterThan(0);
			expect(profile.phaseDurations).toBeDefined();
			expect(profile.totalCycleDuration).toBeGreaterThan(0);
		});

		it("returns default profile for unknown technique", () => {
			const profile = getProfile({
				romanizationName: "Unknown Technique",
				patternRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
				baseBreathDuration: 4,
			});
			expect(profile.activePhases).toContain("inhale");
			expect(profile.activePhases).toContain("exhale");
		});

		describe("phase order per technique", () => {
			it("Ujjayi has inhale → exhale (no holds)", () => {
				const profile = getProfile(MOCK_PATTERNS.ujjayi);
				expect(profile.activePhases).toEqual(["inhale", "exhale"]);
			});

			it("Nadi Shodhana has inhale → hold → exhale", () => {
				const profile = getProfile(MOCK_PATTERNS.nadiShodhana);
				expect(profile.activePhases).toEqual([
					"inhale",
					"hold",
					"exhale",
				]);
			});

			it("Kapalabhati has exhale → inhale order", () => {
				const profile = getProfile(MOCK_PATTERNS.kapalabhati);
				expect(profile.activePhases).toEqual(["exhale", "inhale"]);
			});

			it("Agni Prasana has all four phases", () => {
				const profile = getProfile(MOCK_PATTERNS.agniPrasana);
				expect(profile.activePhases).toEqual([
					"inhale",
					"hold",
					"exhale",
					"holdAfterExhale",
				]);
			});
		});

		describe("phase durations", () => {
			it("calculates Ujjayi durations from ratio × base", () => {
				const profile = getProfile(MOCK_PATTERNS.ujjayi);
				expect(profile.phaseDurations.inhale).toBe(5); // 1 × 5
				expect(profile.phaseDurations.exhale).toBe(10); // 2 × 5
				expect(profile.phaseDurations.hold).toBe(0);
			});

			it("calculates Nadi Shodhana durations correctly", () => {
				const profile = getProfile(MOCK_PATTERNS.nadiShodhana);
				expect(profile.phaseDurations.inhale).toBe(4); // 1 × 4
				expect(profile.phaseDurations.hold).toBe(4); // 1 × 4
				expect(profile.phaseDurations.exhale).toBe(8); // 2 × 4
			});

			it("calculates total cycle duration", () => {
				const profile = getProfile(MOCK_PATTERNS.ujjayi);
				expect(profile.totalCycleDuration).toBe(15); // 5 + 10
			});

			it("calculates Agni Prasana total correctly", () => {
				const profile = getProfile(MOCK_PATTERNS.agniPrasana);
				// 4 + 4 + 8 + 4 = 20
				expect(profile.totalCycleDuration).toBe(20);
			});
		});

		describe("technique-specific flags", () => {
			it("Nadi Shodhana has nostrilAlternation", () => {
				const profile = getProfile(MOCK_PATTERNS.nadiShodhana);
				expect(profile.nostrilAlternation).toBe(true);
			});

			it("Kapalabhati has roundBased and countBased", () => {
				const profile = getProfile(MOCK_PATTERNS.kapalabhati);
				expect(profile.roundBased).toBe(true);
				expect(profile.countBased).toBe(true);
			});

			it("Bhastrika has roundBased", () => {
				const profile = getProfile(MOCK_PATTERNS.bhastrika);
				expect(profile.roundBased).toBe(true);
			});

			it("Ujjayi does not have nostrilAlternation", () => {
				const profile = getProfile(MOCK_PATTERNS.ujjayi);
				expect(profile.nostrilAlternation).toBeUndefined();
			});
		});

		describe("stimulation levels", () => {
			it("Ujjayi is low stimulation", () => {
				expect(getProfile(MOCK_PATTERNS.ujjayi).stimulation).toBe("low");
			});

			it("Bhramari is low stimulation", () => {
				expect(getProfile(MOCK_PATTERNS.bhramari).stimulation).toBe("low");
			});

			it("Kapalabhati is high stimulation", () => {
				expect(getProfile(MOCK_PATTERNS.kapalabhati).stimulation).toBe(
					"high",
				);
			});

			it("Bhastrika is high stimulation", () => {
				expect(getProfile(MOCK_PATTERNS.bhastrika).stimulation).toBe(
					"high",
				);
			});
		});

		describe("safety rules", () => {
			it("Kapalabhati has safety warning", () => {
				const profile = getProfile(MOCK_PATTERNS.kapalabhati);
				expect(profile.safety.showWarning).toBe(true);
				expect(profile.safety.warningKey).toBe(
					"pranayama.safety_kapalabhati",
				);
			});

			it("Bhastrika has safety warning", () => {
				const profile = getProfile(MOCK_PATTERNS.bhastrika);
				expect(profile.safety.showWarning).toBe(true);
			});

			it("Ujjayi has no safety warning", () => {
				const profile = getProfile(MOCK_PATTERNS.ujjayi);
				expect(profile.safety.showWarning).toBeUndefined();
			});

			it("all profiles have maxCyclesBeginner", () => {
				for (const mockPattern of Object.values(MOCK_PATTERNS)) {
					const profile = getProfile(mockPattern);
					expect(profile.safety.maxCyclesBeginner).toBeGreaterThan(0);
				}
			});
		});

		describe("audio config", () => {
			it("every profile has audio descriptors for active phases", () => {
				for (const mockPattern of Object.values(MOCK_PATTERNS)) {
					const profile = getProfile(mockPattern);
					expect(profile.audio).toBeDefined();
					// At minimum, each active phase should have a key in audio
					for (const phase of profile.activePhases) {
						expect(phase in profile.audio || "phaseChange" in profile.audio).toBe(
							true,
						);
					}
				}
			});

			it("Bhramari has hum audio on exhale", () => {
				const profile = getProfile(MOCK_PATTERNS.bhramari);
				expect(profile.audio.exhale).toBeDefined();
				expect(profile.audio.exhale.type).toBe("sine");
				expect(profile.audio.exhale.sustain).toBe(true);
			});
		});

		describe("pause between cycles", () => {
			it("Ujjayi has 0 pause", () => {
				expect(getProfile(MOCK_PATTERNS.ujjayi).pauseBetweenCycles).toBe(0);
			});

			it("Kapalabhati has 3s pause", () => {
				expect(
					getProfile(MOCK_PATTERNS.kapalabhati).pauseBetweenCycles,
				).toBe(3);
			});

			it("Bhastrika has 4s pause", () => {
				expect(
					getProfile(MOCK_PATTERNS.bhastrika).pauseBetweenCycles,
				).toBe(4);
			});
		});
	});

	describe("applyLowStim", () => {
		it("reduces animation scales towards 1.0", () => {
			const profile = getProfile(MOCK_PATTERNS.ujjayi);
			const low = applyLowStim(profile);
			// Original inhale scale is 1.25, low stim should be closer to 1
			expect(low.animation.inhale.scale).toBeLessThan(
				profile.animation.inhale.scale,
			);
			expect(low.animation.inhale.scale).toBeGreaterThan(1);
		});

		it("zeroes haptic feedback", () => {
			const profile = getProfile(MOCK_PATTERNS.nadiShodhana);
			const low = applyLowStim(profile);
			for (const val of Object.values(low.haptic)) {
				expect(val).toBe(0);
			}
		});

		it("preserves non-animation/haptic fields", () => {
			const profile = getProfile(MOCK_PATTERNS.bhramari);
			const low = applyLowStim(profile);
			expect(low.activePhases).toEqual(profile.activePhases);
			expect(low.phaseDurations).toEqual(profile.phaseDurations);
			expect(low.audio).toEqual(profile.audio);
		});
	});
});
