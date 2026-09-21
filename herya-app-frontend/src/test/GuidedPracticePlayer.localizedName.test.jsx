/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GuidedPracticePlayer from "../components/session/GuidedPracticePlayer";

/*
 * El idioma activo cambia entre pruebas, asi que vive en una variable que el
 * mock lee en cada render en lugar de quedar fijado al crear el mock.
 */
let currentLang = "es";

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		t: (key) => key,
		get lang() {
			return currentLang;
		},
	}),
}));

const sanitizeMotionProps = (props) => {
	const domProps = { ...props };
	delete domProps.initial;
	delete domProps.animate;
	delete domProps.exit;
	delete domProps.transition;
	delete domProps.whileTap;
	return domProps;
};

// Cacheado por etiqueta: devolver un componente nuevo en cada acceso le da a
// React un tipo distinto cada render, lo que remonta el arbol y desengancha
// los nodos que la prueba ya habia consultado.
vi.mock("framer-motion", () => {
	const cache = new Map();
	const tag = (Tag) => {
		if (!cache.has(Tag)) {
			const Component = ({ children, ...props }) => (
				<Tag {...sanitizeMotionProps(props)}>{children}</Tag>
			);
			Component.displayName = `motion.${Tag}`;
			cache.set(Tag, Component);
		}
		return cache.get(Tag);
	};
	return {
		AnimatePresence: ({ children }) => <>{children}</>,
		useReducedMotion: () => false,
		motion: new Proxy({}, { get: (_target, prop) => tag(prop) }),
	};
});

vi.mock("@/components/ui", () => ({
	Button: ({ children, onClick }) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
	CircleProgress: ({ children }) => <div>{children}</div>,
	ConfirmModal: () => null,
	ProgressBar: () => <div />,
}));

// La secuencia tal y como llega del backend, con nombre en los dos idiomas.
const SEQUENCE = {
	_id: "seq-1",
	englishName: "Standing Symmetric Family - Level 1",
	spanishName: "Familia Simétrica de Pie - Nivel 1",
};

/*
 * El bloque guarda el nombre en ingles, que es lo que hacia el constructor
 * antes del arreglo. Las sesiones ya creadas siguen teniendo este texto, asi
 * que el reproductor tiene que poder ignorarlo.
 */
const VK_BLOCK = {
	id: "b1",
	blockType: "vk_sequence",
	vkSequence: "seq-1",
	label: "Standing Symmetric Family - Level 1",
	durationMinutes: 6,
	guided: false,
};

const renderPlayer = (props = {}) =>
	render(
		<GuidedPracticePlayer
			blocks={[VK_BLOCK]}
			sequencesData={{ "seq-1": SEQUENCE }}
			onComplete={() => {}}
			onAbandon={() => {}}
			{...props}
		/>,
	);

describe("GuidedPracticePlayer — nombre de la secuencia", () => {
	beforeEach(() => {
		currentLang = "es";
	});
	afterEach(cleanup);

	it("usa el nombre en espanol aunque el bloque guarde el ingles", () => {
		renderPlayer();

		expect(
			screen.getByRole("heading", { name: SEQUENCE.spanishName }),
		).toBeInTheDocument();
		expect(screen.queryByText(SEQUENCE.englishName)).not.toBeInTheDocument();
	});

	it("usa el nombre en ingles cuando el idioma es ingles", () => {
		currentLang = "en";
		renderPlayer();

		expect(
			screen.getByRole("heading", { name: SEQUENCE.englishName }),
		).toBeInTheDocument();
	});

	it("tambien traduce el horario del modo tutor", () => {
		renderPlayer({ isTutorMode: true });

		// El nombre sale en el titulo del bloque y en el horario, por eso se
		// consultan todas las apariciones en lugar de una sola.
		expect(
			screen.getAllByText(SEQUENCE.spanishName).length,
		).toBeGreaterThanOrEqual(2);
	});

	it("cae en el nombre guardado si la secuencia no esta disponible", () => {
		renderPlayer({ sequencesData: {} });

		expect(
			screen.getByRole("heading", { name: VK_BLOCK.label }),
		).toBeInTheDocument();
	});

	it("respeta el nombre sanscrito guardado en los bloques de pranayama", () => {
		const pranayama = {
			id: "b2",
			blockType: "pranayama",
			breathingPattern: "pat-1",
			label: "Nadi Shodhana",
			durationMinutes: 5,
			guided: false,
		};

		renderPlayer({
			blocks: [pranayama],
			patternsData: {
				"pat-1": { englishName: "Alternate Nostril Breathing" },
			},
		});

		expect(
			screen.getByRole("heading", { name: "Nadi Shodhana" }),
		).toBeInTheDocument();
	});
});
