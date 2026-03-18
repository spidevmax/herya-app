import { motion } from "framer-motion";
import { MOOD_COLORS, VK_FAMILY_MAP } from "../../utils/constants";

const FLOWER_SHAPES = ["🌸", "🌺", "🌼", "🌻", "🌹", "💐", "🌷", "🪷"];

function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

function getFlowerProps(entry, index) {
  const moods = entry.moodAfter || entry.moodBefore || [];
  const primaryMood = moods[0] || "calm";
  const color = MOOD_COLORS[primaryMood] || "#5DB075";
  const energy = entry.energyLevel?.after || 5;
  const size = 28 + energy * 4;
  const emoji = FLOWER_SHAPES[index % FLOWER_SHAPES.length];
  const family = entry.vkReflection?.sequenceFamily;
  const familyColor = family ? VK_FAMILY_MAP[family]?.color : color;
  return { color: familyColor || color, size, emoji, primaryMood };
}

export default function FlowerGarden({ entries = [], onFlowerClick }) {
  if (!entries.length) return null;

  const placed = entries.map((entry, i) => {
    const seed = i * 137.508;
    const angle = seed * (Math.PI / 180);
    const radius = 30 + (i % 4) * 45;
    const cx = 50 + Math.cos(angle) * (radius / 3);
    const cy = 50 + Math.sin(angle) * (radius / 5);
    return { entry, cx: clamp(cx, 8, 92), cy: clamp(cy, 8, 92), ...getFlowerProps(entry, i) };
  });

  return (
    <div className="relative w-full h-72 bg-gradient-to-b from-[#E8F5ED] to-[#F8F7F4] rounded-3xl overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#5DB075]/20 rounded-b-3xl" />
      {placed.map(({ entry, cx, cy, size, emoji, color, primaryMood }, i) => (
        <motion.button
          key={entry._id || i}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: cx + "%", top: cy + "%", fontSize: size - 8 }}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onFlowerClick?.(entry)}
          title={primaryMood}
          aria-label={"Journal entry: " + primaryMood}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
