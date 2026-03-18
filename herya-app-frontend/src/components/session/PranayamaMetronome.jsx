import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { PRANAYAMA_PATTERNS } from "../../utils/constants";

const PHASES = ["inhale", "hold1", "exhale", "hold2"];
const PHASE_LABELS = { inhale: "Inhale", hold1: "Hold", exhale: "Exhale", hold2: "Hold" };
const PHASE_COLORS = { inhale: "#4A72FF", hold1: "#FFB347", exhale: "#5DB075", hold2: "#9B5DE5" };

export default function PranayamaMetronome({ patternKey = "4-4-4-4" }) {
  const [selectedKey, setSelectedKey] = useState(patternKey);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  const intervalRef = useRef(null);

  const currentPattern = PRANAYAMA_PATTERNS[selectedKey] || PRANAYAMA_PATTERNS["4-4-4-4"];
  const phase = PHASES[phaseIdx];
  const phaseDuration = currentPattern[phase];
  const color = PHASE_COLORS[phase];

  const nextPhase = useCallback(() => {
    setPhaseIdx((prev) => {
      let next = prev;
      let attempts = 0;
      do { next = (next + 1) % PHASES.length; attempts++; } while (currentPattern[PHASES[next]] === 0 && attempts < 4);
      if (next < prev) setTotalCycles((c) => c + 1);
      return next;
    });
    setTick(0);
  }, [currentPattern]);

  useEffect(() => {
    if (!isRunning) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTick((t) => { if (t >= phaseDuration - 1) { nextPhase(); return 0; } return t + 1; });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, phaseDuration, nextPhase]);

  const reset = () => { setIsRunning(false); setPhaseIdx(0); setTick(0); setTotalCycles(0); };

  const scale = phase === "inhale" ? 1.35 : phase === "exhale" ? 0.85 : 1;

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <div className="flex gap-2 flex-wrap justify-center">
        {Object.entries(PRANAYAMA_PATTERNS).map(([key, p]) => (
          <button key={key} onClick={() => { reset(); setSelectedKey(key); }}
            className={"px-3 py-1.5 rounded-xl text-xs font-semibold transition-all " + (selectedKey === key ? "bg-[#4A72FF] text-white shadow-[0_4px_12px_rgba(74,114,255,0.4)]" : "bg-white text-[#6B7280] border border-[#E8E4DE]")}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="relative flex items-center justify-center">
        {isRunning && (
          <motion.div className="absolute rounded-full border-4 opacity-30" style={{ borderColor: color, width: 200, height: 200 }}
            animate={{ scale: [1, 1.2], opacity: [0.3, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />
        )}
        <motion.div
          className="w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-xl"
          animate={{ scale: isRunning ? scale : 1 }}
          transition={{ duration: phaseDuration, ease: phase === "inhale" ? "easeIn" : phase === "exhale" ? "easeOut" : "linear" }}
          style={{ backgroundColor: color + "20", border: "4px solid " + color }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-center">
              <p className="font-display text-lg font-semibold" style={{ color }}>{PHASE_LABELS[phase]}</p>
              <p className="text-3xl font-bold" style={{ color }}>{isRunning ? phaseDuration - tick : phaseDuration}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {totalCycles > 0 && <p className="text-[#6B7280] text-sm font-medium">{totalCycles} cycle{totalCycles !== 1 ? "s" : ""} completed</p>}

      <div className="flex items-center gap-4">
        <button onClick={reset} className="w-11 h-11 rounded-full bg-white border border-[#E8E4DE] flex items-center justify-center text-[#9CA3AF]">
          <RotateCcw size={18} />
        </button>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setIsRunning((r) => !r)}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-[0_6px_24px_rgba(74,114,255,0.4)]"
          style={{ backgroundColor: color }}>
          {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </motion.button>
      </div>

      <div className="flex gap-4">
        {PHASES.filter((p) => currentPattern[p] > 0).map((p) => (
          <div key={p} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl" style={{ backgroundColor: PHASE_COLORS[p] + "12" }}>
            <span className="text-[10px] font-semibold uppercase text-[#9CA3AF]">{PHASE_LABELS[p]}</span>
            <span className="text-lg font-bold" style={{ color: PHASE_COLORS[p] }}>{currentPattern[p]}s</span>
          </div>
        ))}
      </div>
    </div>
  );
}
