import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let res;
    if (isLoginView) {
      res = await login(email, password);
    } else {
      res = await register(email, password, name);
    }

    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Authentication failed");
    }
  };

  const handleGoogleClick = async () => {
    setError("");
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      onClose();
    } else if (res.error) {
      setError(res.error);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 text-white shadow-2xl backdrop-blur-xl"
          style={{
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title / Description */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
              {isLoginView ? "Begin Investigation" : "Create Security Profile"}
            </h2>
            <p className="text-sm text-white/60">
              {isLoginView
                ? "Sign in to deploy the Multi-Agent engine"
                : "Register credentials to access shared context"}
            </p>
          </div>

          {/* Social Sign-In (Google) */}
          <button
            onClick={handleGoogleClick}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/[0.04] py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/[0.08] active:bg-white/[0.12] disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center justify-between">
            <span className="h-px w-[35%] bg-white/10"></span>
            <span className="text-xs uppercase tracking-widest text-white/40 font-medium">Or Use Credentials</span>
            <span className="h-px w-[35%] bg-white/10"></span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Karan Shelar"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@agentbond.ai"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-colors"
              />
            </div>

            {error && <div className="text-sm text-red-400 font-medium text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white text-black py-3 text-sm font-semibold tracking-wide hover:bg-white/90 transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Decrypting..." : isLoginView ? "Sign In" : "Register"}
            </button>
          </form>

          {/* Toggle View Link */}
          <div className="mt-6 text-center text-sm text-white/60">
            {isLoginView ? "New Investigator?" : "Already registered?"}{" "}
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError("");
              }}
              className="text-white hover:underline font-semibold"
            >
              {isLoginView ? "Create a Profile" : "Sign In Here"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
