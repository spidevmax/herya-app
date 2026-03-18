import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { getSequences } from "../api/sequences.api";
import SequenceCard from "../components/library/SequenceCard";
import { SkeletonCard, EmptyState } from "../components/ui";
import { VK_FAMILIES } from "../utils/constants";

export default function Library() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const [level, setLevel] = useState("");

  const fetch = useCallback(() => {
    setLoading(true);
    getSequences({ family: family || undefined, level: level || undefined, limit: 50 })
      .then((r) => { const list = r.data?.data || r.data || []; setSequences(Array.isArray(list) ? list : []); })
      .catch(() => setSequences([]))
      .finally(() => setLoading(false));
  }, [family, level]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = sequences.filter((s) => !query || s.englishName?.toLowerCase().includes(query.toLowerCase()) || s.sanskritName?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col gap-4 pt-4 pb-6 min-h-0">
      <div className="px-4">
        <h1 className="font-display text-2xl font-bold text-[#1A1A2E] mb-4">Sequence Library</h1>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sequences…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#E8E4DE] text-sm text-[#1A1A2E] focus:outline-none focus:border-[#4A72FF] transition"
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 overflow-x-auto pb-1 no-scrollbar">
        <button onClick={() => setFamily("")} className={"flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition " + (!family ? "bg-[#4A72FF] text-white" : "bg-white border border-[#E8E4DE] text-[#6B7280]")}>All</button>
        {VK_FAMILIES.map((f) => (
          <button key={f.key} onClick={() => setFamily(family === f.key ? "" : f.key)}
            className={"flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition " + (family === f.key ? "text-white" : "bg-white border border-[#E8E4DE] text-[#6B7280]")}
            style={family === f.key ? { backgroundColor: f.color } : {}}>
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 5 }, (_, i) => <SkeletonCard key={i} className="mb-3" />)
          ) : filtered.length === 0 ? (
            <EmptyState icon={<SlidersHorizontal size={32} />} title="No sequences found" description="Try adjusting your filters" />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((seq, i) => <SequenceCard key={seq._id} sequence={seq} index={i} />)}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
