const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const BreathingPattern = require("../api/models/BreathingPattern.model");
const { inferTechniqueMeta } = require("../api/models/BreathingPattern.model");

const SUPPLEMENTAL_PATTERNS = [
	{
		romanizationName: "Anuloma Ujjayi",
		iastName: "Anuloma Ujjāyī",
		sanskritName: "अनुलोम उज्जायी",
		description:
			"Anuloma Ujjayi introduces staged breath progression within the Ujjayi family to refine control and lengthen the exhalation gradually.",
		descriptionEs:
			"Anuloma Ujjayi introduce una progresion escalonada dentro de la familia Ujjayi para refinar el control y alargar la exhalacion gradualmente.",
		difficulty: "intermediate",
		patternType: "ratio_based",
		patternRatio: { inhale: 1, hold: 0, exhale: 2, holdAfterExhale: 0 },
		baseBreathDuration: 5,
		recommendedPractice: {
			measureBy: "cycles",
			durationMinutes: { min: 4, max: 15, default: 8 },
			cycles: { min: 6, max: 18, default: 10 },
		},
		benefits: ["extends exhalation", "refines breath control", "supports concentration"],
		benefitsEs: [
			"alarga la exhalacion",
			"refina el control respiratorio",
			"favorece la concentracion",
		],
		contraindications: ["acute respiratory distress"],
		contraindicationsEs: ["dificultad respiratoria aguda"],
		vkContext: {
			practicePhase: "opening",
			recommendedBefore: ["meditative", "seated"],
			progressionNotes: "Best after establishing steady foundational Ujjayi.",
		},
		visualType: "wave",
		soundCue: "ocean",
		energyEffect: "balancing",
		bestTimeOfDay: ["morning", "evening"],
		tags: ["anuloma ujjayi", "ujjayi", "intermediate", "progression"],
		isSystemPattern: true,
	},
	{
		romanizationName: "Pratiloma Ujjayi",
		iastName: "Pratiloma Ujjāyī",
		sanskritName: "प्रतिलोम उज्जायी",
		description:
			"Pratiloma Ujjayi develops interrupted or reversed staging within the Ujjayi family, demanding refined attention to the transitions between phases.",
		descriptionEs:
			"Pratiloma Ujjayi desarrolla una respiracion escalonada o invertida dentro de la familia Ujjayi, exigiendo atencion fina en las transiciones.",
		difficulty: "advanced",
		patternType: "ratio_based",
		patternRatio: { inhale: 1, hold: 1, exhale: 2, holdAfterExhale: 0 },
		baseBreathDuration: 5,
		recommendedPractice: {
			measureBy: "cycles",
			durationMinutes: { min: 4, max: 12, default: 6 },
			cycles: { min: 4, max: 12, default: 8 },
		},
		benefits: ["sharpens attention", "improves phase transitions", "deepens internal awareness"],
		benefitsEs: [
			"afina la atencion",
			"mejora las transiciones de fase",
			"profundiza la conciencia interna",
		],
		contraindications: ["anxiety during retention", "uncontrolled hypertension"],
		contraindicationsEs: ["ansiedad durante retenciones", "hipertension no controlada"],
		warnings: "Introduce only after stable Ujjayi and Nadi Shodhana practice.",
		warningsEs: "Introducir solo despues de una practica estable de Ujjayi y Nadi Shodhana.",
		vkContext: {
			practicePhase: "opening",
			recommendedBefore: ["meditative", "seated"],
			progressionNotes: "Advanced Ujjayi variation requiring calm, steady breath retention.",
		},
		visualType: "wave",
		soundCue: "ocean",
		energyEffect: "balancing",
		bestTimeOfDay: ["morning"],
		tags: ["pratiloma ujjayi", "ujjayi", "advanced", "retention"],
		isSystemPattern: true,
	},
	{
		romanizationName: "Viloma Ujjayi",
		iastName: "Viloma Ujjāyī",
		sanskritName: "विलोम उज्जायी",
		description:
			"Viloma Ujjayi emphasizes interrupted inhalation or exhalation in measured segments, helping practitioners build precision and nervous system steadiness.",
		descriptionEs:
			"Viloma Ujjayi enfatiza la inhalacion o exhalacion interrumpida en segmentos medidos, ayudando a desarrollar precision y estabilidad del sistema nervioso.",
		difficulty: "intermediate",
		patternType: "ratio_based",
		patternRatio: { inhale: 1, hold: 1, exhale: 1, holdAfterExhale: 0 },
		baseBreathDuration: 4,
		recommendedPractice: {
			measureBy: "cycles",
			durationMinutes: { min: 4, max: 12, default: 6 },
			cycles: { min: 4, max: 16, default: 8 },
		},
		benefits: ["builds precision", "steadies the mind", "improves segmented control"],
		benefitsEs: ["desarrolla precision", "estabiliza la mente", "mejora el control segmentado"],
		contraindications: ["dizziness", "acute anxiety"],
		contraindicationsEs: ["mareo", "ansiedad aguda"],
		vkContext: {
			practicePhase: "opening",
			recommendedBefore: ["meditative", "seated"],
			progressionNotes: "Use after confidence with smooth Ujjayi and Sama Vritti.",
		},
		visualType: "wave",
		soundCue: "tone",
		energyEffect: "balancing",
		bestTimeOfDay: ["morning", "evening"],
		tags: ["viloma ujjayi", "ujjayi", "intermediate", "segmented"],
		isSystemPattern: true,
	},
	{
		romanizationName: "Candra Bhedana",
		iastName: "Candra Bhedana",
		sanskritName: "चन्द्र भेदन",
		alias: ["Chandra Bhedana", "Left Nostril Breathing", "Candra bedhana"],
		description:
			"Candra Bhedana activates the lunar channel through left-nostril inhalation, reducing heat and promoting calm focus.",
		descriptionEs:
			"Candra Bhedana activa el canal lunar mediante la inhalacion por la fosa nasal izquierda, reduciendo el calor y favoreciendo la calma.",
		difficulty: "beginner",
		patternType: "ratio_based",
		patternRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
		baseBreathDuration: 5,
		recommendedPractice: {
			measureBy: "cycles",
			durationMinutes: { min: 3, max: 10, default: 5 },
			cycles: { min: 5, max: 15, default: 8 },
		},
		benefits: ["reduces heat", "calms the mind", "supports evening practice"],
		benefitsEs: ["reduce el calor", "calma la mente", "favorece la practica nocturna"],
		contraindications: ["very low blood pressure"],
		contraindicationsEs: ["presion arterial muy baja"],
		vkContext: {
			practicePhase: "closing",
			recommendedBefore: ["meditative", "seated"],
			progressionNotes: "Lunar counterpart to Surya Bhedana; useful before meditation.",
		},
		visualType: "nostril",
		soundCue: "bell",
		energyEffect: "cooling",
		bestTimeOfDay: ["evening", "night"],
		tags: ["candra bhedana", "chandra bhedana", "left nostril", "cooling"],
		isSystemPattern: true,
	},
	{
		romanizationName: "Murccha",
		iastName: "Mūrcchā",
		sanskritName: "मूर्च्छा",
		description:
			"Murccha uses elongated retention and subtle throat control to produce an expansive, trance-like quieting of the mind.",
		descriptionEs:
			"Murccha utiliza retenciones prolongadas y un control sutil de la garganta para producir un aquietamiento expansivo de la mente.",
		difficulty: "advanced",
		patternType: "ratio_based",
		patternRatio: { inhale: 1, hold: 2, exhale: 2, holdAfterExhale: 0 },
		baseBreathDuration: 5,
		recommendedPractice: {
			measureBy: "cycles",
			durationMinutes: { min: 3, max: 8, default: 4 },
			cycles: { min: 3, max: 8, default: 5 },
		},
		benefits: ["deep mental quiet", "internalization", "subtle retention training"],
		benefitsEs: ["profundo silencio mental", "interiorizacion", "entrenamiento de retencion sutil"],
		contraindications: ["fainting tendency", "low blood pressure", "anxiety around retention"],
		contraindicationsEs: ["tendencia al desmayo", "presion baja", "ansiedad en retenciones"],
		warnings: "Advanced pranayama; supervise closely and stop at the first sign of dizziness.",
		warningsEs: "Pranayama avanzado; supervisar de cerca y detener ante cualquier mareo.",
		vkContext: {
			practicePhase: "closing",
			recommendedBefore: ["meditative"],
			progressionNotes: "Only after mature retention work and a stable seat.",
		},
		visualType: "pulse",
		soundCue: "tone",
		energyEffect: "calming",
		bestTimeOfDay: ["evening"],
		tags: ["murccha", "advanced", "retention", "meditative"],
		isSystemPattern: true,
	},
	{
		romanizationName: "Plavini",
		iastName: "Plāvinī",
		sanskritName: "प्लाविनी",
		description:
			"Plavini emphasizes expansive inhalation and internal buoyancy, often taught as an advanced practice of fullness and containment.",
		descriptionEs:
			"Plavini enfatiza la inhalacion expansiva y la sensacion de flotacion interna, como una practica avanzada de plenitud y contencion.",
		difficulty: "advanced",
		patternType: "ratio_based",
		patternRatio: { inhale: 2, hold: 1, exhale: 2, holdAfterExhale: 0 },
		baseBreathDuration: 5,
		recommendedPractice: {
			measureBy: "cycles",
			durationMinutes: { min: 3, max: 10, default: 5 },
			cycles: { min: 3, max: 10, default: 6 },
		},
		benefits: ["expands capacity", "develops containment", "supports subtle awareness"],
		benefitsEs: ["expande la capacidad", "desarrolla contencion", "favorece la conciencia sutil"],
		contraindications: ["digestive discomfort", "panic tendency"],
		contraindicationsEs: ["molestia digestiva", "tendencia al panico"],
		vkContext: {
			practicePhase: "mid_practice",
			recommendedBefore: ["meditative", "seated"],
			progressionNotes: "Advanced fullness practice after strong foundational breath control.",
		},
		visualType: "circle",
		soundCue: "tone",
		energyEffect: "balancing",
		bestTimeOfDay: ["morning"],
		tags: ["plavini", "advanced", "expansion", "fullness"],
		isSystemPattern: true,
	},
	{
		romanizationName: "Agni",
		iastName: "Agni",
		sanskritName: "अग्नि",
		alias: ["Agni Prasana", "Fire Breath Sequence"],
		description:
			"Agni builds internal heat progressively through conscious abdominal activation and structured breath ratios.",
		descriptionEs:
			"Agni genera calor interno de forma progresiva mediante la activacion abdominal consciente y ratios respiratorios estructurados.",
		difficulty: "intermediate",
		patternType: "ratio_based",
		patternRatio: { inhale: 1, hold: 1, exhale: 2, holdAfterExhale: 1 },
		baseBreathDuration: 4,
		recommendedPractice: {
			measureBy: "cycles",
			durationMinutes: { min: 5, max: 15, default: 8 },
			cycles: { min: 5, max: 15, default: 8 },
		},
		benefits: ["digestive stimulation", "core activation", "increases internal heat"],
		benefitsEs: ["estimulacion digestiva", "activacion del centro", "aumenta el calor interno"],
		contraindications: ["pregnancy", "hypertension", "recent abdominal surgery"],
		contraindicationsEs: ["embarazo", "hipertension", "cirugia abdominal reciente"],
		warnings: "Progress retention gradually and avoid strain in the abdomen or face.",
		warningsEs: "Progresar la retencion gradualmente y evitar tension en abdomen o rostro.",
		vkContext: {
			practicePhase: "mid_practice",
			recommendedBefore: ["seated", "supine", "prone"],
			progressionNotes: "Intermediate heating breath after Ujjayi and Sama Vritti.",
		},
		visualType: "circle",
		soundCue: "bell",
		energyEffect: "heating",
		bestTimeOfDay: ["morning"],
		tags: ["agni", "heating", "digestive fire", "intermediate"],
		isSystemPattern: true,
	},
];

/**
 * Seed Breathing Patterns from CSV file
 * Reads breathingPatterns.csv and populates BreathingPattern collection
 */
async function seedBreathingPatterns() {
	try {
		// Read CSV file
		const csvPath = path.join(__dirname, "data", "breathingPatterns.csv");
		const csvContent = fs.readFileSync(csvPath, "utf-8");

		// Parse CSV — dynamicTyping auto-converts numbers and booleans
		const { data, errors } = Papa.parse(csvContent, {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
		});

		if (errors.length > 0) {
			throw new Error(`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`);
		}

		// Helper: split pipe-separated string into array
		// (dynamicTyping handles numbers and booleans; arrays use | as delimiter)
		const toArray = (val) =>
			val != null && val !== ""
				? String(val)
						.split("|")
						.map((s) => s.trim())
						.filter(Boolean)
				: [];

		// Helper: coerce CSV boolean values (dynamicTyping may yield true/false or "true"/"false")
		const toBool = (val) => val === true || val === "true" || val === 1 || val === "1";

		// Transform CSV data to BreathingPattern schema
		const breathingPatterns = data.map((row) => {
			const inferredMeta = inferTechniqueMeta({
				romanizationName: row.romanizationName?.trim(),
				vkTechniques: {
					nadishodhana: {
						enabled: toBool(row["vkTechniques.nadishodhana.enabled"]),
					},
					kapalabhati: {
						enabled: toBool(row["vkTechniques.kapalabhati.enabled"]),
					},
					bhastrika: {
						enabled: toBool(row["vkTechniques.bhastrika.enabled"]),
					},
					ujjayi: {
						enabled: toBool(row["vkTechniques.ujjayi.enabled"]),
					},
					bhramari: {
						enabled: toBool(row["vkTechniques.bhramari.enabled"]),
					},
					cooling: {
						enabled: toBool(row["vkTechniques.cooling.enabled"]),
						type: row["vkTechniques.cooling.type"] || undefined,
					},
				},
			});

			return {
				// IDENTIFICATION
				romanizationName: row.romanizationName?.trim(),
				iastName: row.iastName?.trim(),
				sanskritName: row.sanskritName?.trim(),
				alias: toArray(row.alias),
				description: row.description?.trim(),
				descriptionEs: row.descriptionEs?.trim() || undefined,

				// CLASSIFICATION
				difficulty: row.difficulty?.trim() || "beginner",
				techniqueKey: row.techniqueKey?.trim() || inferredMeta.techniqueKey,
				techniqueFamily: row.techniqueFamily?.trim() || inferredMeta.techniqueFamily,
				variantOf: row.variantOf?.trim() || undefined,

				// BREATHING PATTERN
				patternType: row.patternType?.trim() || "ratio_based",
				patternRatio: {
					inhale: row["patternRatio.inhale"] ?? 1,
					hold: row["patternRatio.hold"] ?? 0,
					exhale: row["patternRatio.exhale"] ?? 1,
					holdAfterExhale: row["patternRatio.holdAfterExhale"] ?? 0,
				},
				baseBreathDuration: row.baseBreathDuration ?? 5,

				// RECOMMENDED PRACTICE
				recommendedPractice: {
					measureBy: row["recommendedPractice.measureBy"] || "cycles",
					durationMinutes: {
						min: row["recommendedPractice.durationMinutes.min"] ?? 3,
						max: row["recommendedPractice.durationMinutes.max"] ?? 10,
						default: row["recommendedPractice.durationMinutes.default"] ?? 5,
					},
					cycles: {
						min: row["recommendedPractice.cycles.min"] ?? 5,
						max: row["recommendedPractice.cycles.max"] ?? 20,
						default: row["recommendedPractice.cycles.default"] ?? 10,
					},
				},

				// VK TECHNIQUES
				vkTechniques: {
					nadishodhana: {
						enabled: toBool(row["vkTechniques.nadishodhana.enabled"]),
						...(row["vkTechniques.nadishodhana.pattern"] && {
							pattern: row["vkTechniques.nadishodhana.pattern"],
						}),
					},
					kapalabhati: {
						enabled: toBool(row["vkTechniques.kapalabhati.enabled"]),
						...(row["vkTechniques.kapalabhati.pumpingRate"] != null && {
							pumpingRate: row["vkTechniques.kapalabhati.pumpingRate"],
						}),
						rounds: row["vkTechniques.kapalabhati.rounds"] ?? 3,
					},
					bhastrika: {
						enabled: toBool(row["vkTechniques.bhastrika.enabled"]),
						intensity: row["vkTechniques.bhastrika.intensity"] || "gentle",
						rounds: row["vkTechniques.bhastrika.rounds"] ?? 3,
					},
					ujjayi: {
						enabled: toBool(row["vkTechniques.ujjayi.enabled"]),
						withSound:
							row["vkTechniques.ujjayi.withSound"] != null
								? toBool(row["vkTechniques.ujjayi.withSound"])
								: true,
					},
					bhramari: {
						enabled: toBool(row["vkTechniques.bhramari.enabled"]),
						pitch: row["vkTechniques.bhramari.pitch"] || "medium",
					},
					cooling: {
						enabled: toBool(row["vkTechniques.cooling.enabled"]),
						type: row["vkTechniques.cooling.type"] || "sitali",
					},
					bandhas: {
						mula: toBool(row["vkTechniques.bandhas.mula"]),
						uddiyana: toBool(row["vkTechniques.bandhas.uddiyana"]),
						jalandhara: toBool(row["vkTechniques.bandhas.jalandhara"]),
						whenToApply: row["vkTechniques.bandhas.whenToApply"] || "none",
					},
					mudra: row["vkTechniques.mudra"] || "none",
				},

				// BENEFITS AND CONTRAINDICATIONS
				benefits: toArray(row.benefits),
				benefitsEs: toArray(row.benefitsEs),
				contraindications: toArray(row.contraindications),
				contraindicationsEs: toArray(row.contraindicationsEs),
				warnings: row.warnings?.trim() || undefined,
				warningsEs: row.warningsEs?.trim() || undefined,

				// VK CONTEXT
				vkContext: {
					practicePhase: row["vkContext.practicePhase"]?.trim() || "opening",
					recommendedBefore: toArray(row["vkContext.recommendedBefore"]),
					progressionNotes: row["vkContext.progressionNotes"]?.trim() || undefined,
				},

				// UI/UX
				visualType: row.visualType?.trim() || "circle",
				soundCue: row.soundCue?.trim() || "bell",

				// EFFECTS
				energyEffect: row.energyEffect?.trim() || "balancing",
				bestTimeOfDay: toArray(row.bestTimeOfDay),

				// METADATA
				tags: toArray(row.tags),
				isSystemPattern: toBool(row.isSystemPattern),
			};
		});

		const existingNames = new Set(
			breathingPatterns.map((pattern) => pattern.romanizationName).filter(Boolean),
		);
		for (const supplementalPattern of SUPPLEMENTAL_PATTERNS) {
			if (!existingNames.has(supplementalPattern.romanizationName)) {
				const inferredMeta = inferTechniqueMeta(supplementalPattern);
				breathingPatterns.push({
					...supplementalPattern,
					techniqueKey: supplementalPattern.techniqueKey || inferredMeta.techniqueKey,
					techniqueFamily: supplementalPattern.techniqueFamily || inferredMeta.techniqueFamily,
					variantOf: supplementalPattern.variantOf,
				});
			}
		}

		// Upsert by romanizationName — updates existing patterns with latest seed data
		const ops = breathingPatterns.map((pattern) => ({
			updateOne: {
				filter: { romanizationName: pattern.romanizationName },
				update: { $set: pattern },
				upsert: true,
			},
		}));
		const result = await BreathingPattern.bulkWrite(ops);
		console.log(
			`✅ Breathing patterns seeded: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`,
		);
	} catch (error) {
		console.error("❌ Error seeding breathing patterns:", error.message);
		throw error;
	}
}

module.exports = seedBreathingPatterns;
