import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { createSession } from "../api/sessions.api";
import { useAuth } from "../context/AuthContext";
import PranayamaMetronome from "../components/session/PranayamaMetronome";
import { Button } from "../components/ui";
import { SESSION_TYPES } from "../utils/constants";

const MOOD_OPTIONS = ["energized", "calm", "focused", "tired", "stiff", "peaceful", "grateful", "anxious"];
const ENERGY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Session() {
  const { type } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const seqId = params.get("seq");

  const [step, setStep] = useState("pre"); // pre | active | post | done
  const [duration, setDuration] = useState(20);
  const [moodBefore, setMoodBefore] = useState([]);
  const [moodAfter, setMoodAfter] = useState([]);
  const [energyBefore, setEnergyBefore] = useState(5);
  const [energyAfter, setEnergyAfter] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const sessionType = SESSION_TYPES.find((s) => s.value === type) || { label: "Practice", icon: "🧘", color: "#4A72FF" };
  const isPranayama = type === "pranayama";

  const toggleMood = (list, setList, mood) => {
    setList((prev) => prev.includes(mood) ? prev.filter((m) => m !== mood) : prev.length < 3 ? [...prev, mood] : prev);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const payload = {
        sessionType: type, duration, completed: true,
        moodBefore, moodAfter, energyLevel: { before: energyBefore, after: energyAfter },
        notes, ...(seqId ? { vkSequence: seqId } : {}),
      };
      await createSession(payload);
      await refreshUser();
      setStep("done");
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  };

  if (step === "done") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <CheckCircle size={72} className="text-[#5DB075]" />
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-[#1A1A2E]">Practice Complete! 🌟</h2>
        <p className="text-[#6B7280] text-center text-sm">Great work. Your session has been saved.</p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="sticky top-0 z-10 bg-[#F8F7F4]/90 backdrop-blur-xl px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold text-[#1A1A2E]">{sessionType.label}</h1>
      </div>

      <div className="flex-1 px-4 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "pre" && (
            <motion.div key="pre" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6 pt-4">
              <h2 className="font-display text-xl font-semibold text-[#1A1A2E]">Before you begin</h2>
              <div className="bg-white rounded-2xl p-5">
                <p className="text-sm font-semibold text-[#1A1A2E] mb-3">How are you feeling? (pick up to 3)</p>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button key={m} onClick={() => toggleMood(moodBefore, setMoodBefore, m)}
                      className={"px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition " + (moodBefore.includes(m) ? "bg-[#4A72FF] text-white" : "bg-[#F8F7F4] text-[#6B7280]")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5">
                <p className="text-sm font-semibold text-[#1A1A2E] mb-3">Energy level: {energyBefore}/10</p>
                <input type="range" min={1} max={10} value={energyBefore} onChange={(e) => setEnergyBefore(+e.target.value)} className="w-full accent-[#4A72FF]" />
              </div>
              <div className="bg-white rounded-2xl p-5">
                <p className="text-sm font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2"><Clock size={16} /> Duration: {duration} min</p>
                <div className="flex gap-2 flex-wrap">
                  {[15, 20, 30, 45, 60, 90].map((d) => (
                    <button key={d} onClick={() => setDuration(d)} className={"px-4 py-2 rounded-xl text-sm font-semibold transition " + (duration === d ? "bg-[#4A72FF] text-white" : "bg-[#F8F7F4] text-[#6B7280]")}>{d}m</button>
                  ))}
                </div>
              </div>
              <Button onClick={() => setStep("active")}>Begin Practice</Button>
            </motion.div>
          )}

          {step === "active" && (
            <motion.div key="active" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6 pt-4 items-center">
              {isPranayama ? (
                <PranayamaMetronome />
              ) : (
                <div className="text-center py-16">
                  <div className="text-7xl mb-4">{sessionType.icon}</div>
                  <p className="font-display text-xl text-[#1A1A2E]">Practice in Progress</p>
                  <p className="text-[#9CA3AF] text-sm mt-2">{duration} minutes</p>
                </div>
              )}
              <Button onClick={() => setStep("post")} className="w-full">Finish Practice</Button>
            </motion.div>
          )}

          {step === "post" && (
            <motion.div key="post" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6 pt-4">
              <h2 className="font-display text-xl font-semibold text-[#1A1A2E]">How do you feel now?</h2>
              <div className="bg-white rounded-2xl p-5">
                <p className="text-sm font-semibold text-[#1A1A2E] mb-3">Mood after (pick up to 3)</p>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button key={m} onClick={() => toggleMood(moodAfter, setMoodAfter, m)}
                      className={"px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition " + (moodAfter.includes(m) ? "bg-[#5DB075] text-white" : "bg-[#F8F7F4] text-[#6B7280]")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5">
                <p className="text-sm font-semibold text-[#1A1A2E] mb-3">Energy after: {energyAfter}/10</p>
                <input type="range" min={1} max={10} value={energyAfter} onChange={(e) => setEnergyAfter(+e.target.value)} className="w-full accent-[#5DB075]" />
              </div>
              <div className="bg-white rounded-2xl p-5">
                <p className="text-sm font-semibold text-[#1A1A2E] mb-3">Notes (optional)</p>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="How was your practice today?"
                  className="w-full text-sm text-[#1A1A2E] placeholder-[#9CA3AF] bg-[#F8F7F4] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#5DB075] resize-none" />
              </div>
              <Button onClick={handleComplete} disabled={saving}>{saving ? "Saving…" : "Save Session"}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
