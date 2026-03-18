import { motion } from "framer-motion";
import { Clock, Lock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VK_FAMILY_MAP, LEVEL_LABELS } from "../../utils/constants";
import { Badge } from "../ui";

export default function SequenceCard({ sequence, index = 0, unlocked = true }) {
  const navigate = useNavigate();
  const family = VK_FAMILY_MAP[sequence.family] || { color: "#4A72FF", emoji: "🧘", label: sequence.family };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={() => unlocked && navigate("/library/sequence/" + sequence._id)}
      className={"flex bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(74,114,255,0.08)] transition-transform " + (unlocked ? "cursor-pointer active:scale-[0.98]" : "opacity-60 cursor-not-allowed")}
    >
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: family.color }} />
      <div className="flex items-center gap-3 flex-1 p-4 min-w-0">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: family.color + "15" }}>
          {unlocked ? family.emoji : <Lock size={20} style={{ color: family.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-display font-semibold text-[#1A1A2E] text-sm leading-tight truncate">{sequence.englishName}</h3>
            {sequence.level && <Badge color={family.color} className="flex-shrink-0 text-[10px]">L{sequence.level}</Badge>}
          </div>
          <p className="text-[#9CA3AF] text-xs italic mb-2 truncate">{sequence.sanskritName}</p>
          <div className="flex items-center gap-3">
            {sequence.estimatedDuration?.recommended && (
              <span className="flex items-center gap-1 text-[#6B7280] text-xs"><Clock size={11} />{sequence.estimatedDuration.recommended} min</span>
            )}
            {sequence.difficulty && <span className="text-xs font-medium capitalize" style={{ color: family.color }}>{sequence.difficulty}</span>}
          </div>
        </div>
        <ChevronRight size={18} className="text-[#D1CCC7] flex-shrink-0" />
      </div>
    </motion.div>
  );
}
