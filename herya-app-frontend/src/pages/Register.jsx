import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-br from-[#F8F7F4] to-[#E8E4DE]">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="font-display text-4xl font-bold text-[#1A1A2E] mb-1">Herya</h1>
          <p className="text-[#9CA3AF] text-sm">Begin your practice journey</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_40px_rgba(74,114,255,0.1)]">
          <h2 className="font-display text-xl font-semibold text-[#1A1A2E] mb-5">Create account</h2>
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <User size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text" autoComplete="name" required placeholder="Full name" minLength={2}
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E8E4DE] bg-[#F8F7F4] text-[#1A1A2E] text-sm focus:outline-none focus:border-[#4A72FF] focus:ring-1 focus:ring-[#4A72FF] transition"
              />
            </div>
            <div className="relative">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="email" autoComplete="email" required placeholder="Email"
                value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[#E8E4DE] bg-[#F8F7F4] text-[#1A1A2E] text-sm focus:outline-none focus:border-[#4A72FF] focus:ring-1 focus:ring-[#4A72FF] transition"
              />
            </div>
            <div className="relative">
              <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type={showPw ? "text" : "password"} autoComplete="new-password" required placeholder="Password" minLength={6}
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-[#E8E4DE] bg-[#F8F7F4] text-[#1A1A2E] text-sm focus:outline-none focus:border-[#4A72FF] focus:ring-1 focus:ring-[#4A72FF] transition"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Creating account…" : "Get started"}
            </Button>
          </form>
          <p className="text-center text-sm text-[#9CA3AF] mt-5">
            Already have an account? <Link to="/login" className="text-[#4A72FF] font-semibold">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
