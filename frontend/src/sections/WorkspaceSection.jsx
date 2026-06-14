import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkspaceSection({ onBackToLanding }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  const [loadingCases, setLoadingCases] = useState(true);

  // Accordion state for hypotheses
  const [expandedHypothesisId, setExpandedHypothesisId] = useState(null);

  // New Case Form States
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [problemStatement, setProblemStatement] = useState("");
  const [constraints, setConstraints] = useState([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference for keeping track of polling
  const pollingIntervalRef = useRef(null);

  // API base URL
  const API_BASE_URL = "http://localhost:8000";

  // Helper for auth headers
  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Fetch past cases
  const fetchCases = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cases`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data);
        if (data.length > 0 && !selectedCaseId && !isCreatingNew) {
          setSelectedCaseId(data[0].case_id);
          setIsCreatingNew(false);
        }
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  // Fetch details for the selected case
  const fetchCaseDetails = async (caseId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cases/${caseId}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCase(data);

        // Auto-expand first hypothesis if none is expanded and hypotheses are loaded
        if (data.hypotheses && data.hypotheses.length > 0 && !expandedHypothesisId) {
          setExpandedHypothesisId(data.hypotheses[0].id);
        }

        // Update in cases list to sync status
        setCases((prev) =>
          prev.map((c) => (c.case_id === caseId ? { ...c, status: data.status } : c))
        );

        // Stop polling if completed or failed
        if (data.status === "completed" || data.status === "failed") {
          stopPolling();
        }
      } else {
        stopPolling();
      }
    } catch (err) {
      console.error("Error fetching case details:", err);
      stopPolling();
    }
  };

  // Start polling active case details
  const startPolling = (caseId) => {
    stopPolling();
    fetchCaseDetails(caseId);
    pollingIntervalRef.current = setInterval(() => {
      fetchCaseDetails(caseId);
    }, 1500);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    fetchCases();
    return () => stopPolling();
  }, []);

  // Sync polling when selectedCaseId changes
  useEffect(() => {
    if (selectedCaseId) {
      setIsCreatingNew(false);
      setExpandedHypothesisId(null); // Reset accordion
      startPolling(selectedCaseId);
    } else {
      setActiveCase(null);
      stopPolling();
    }
    return () => stopPolling();
  }, [selectedCaseId]);

  // Handle selection of a case
  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
  };

  // Add constraint input
  const addConstraint = () => {
    setConstraints([...constraints, ""]);
  };

  // Remove constraint input
  const removeConstraint = (index) => {
    setConstraints(constraints.filter((_, i) => i !== index));
  };

  // Update constraint text
  const updateConstraint = (index, value) => {
    const next = [...constraints];
    next[index] = value;
    setConstraints(next);
  };

  // Submit case to backend
  const handleSubmitCase = async (e) => {
    e.preventDefault();
    if (!problemStatement.trim()) return;

    setIsSubmitting(true);
    try {
      const cleanConstraints = constraints.filter((c) => c.trim() !== "");
      const createRes = await fetch(`${API_BASE_URL}/api/cases`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          problem_statement: problemStatement,
          constraints: cleanConstraints,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to initialize case");
      const newCase = await createRes.json();

      const decompRes = await fetch(`${API_BASE_URL}/api/cases/${newCase.case_id}/decompose`, {
        method: "POST",
        headers: getHeaders(),
      });

      if (!decompRes.ok) throw new Error("Failed to deploy agent pipeline");
      const activeContext = await decompRes.json();

      setProblemStatement("");
      setConstraints([""]);
      await fetchCases();
      setSelectedCaseId(activeContext.case_id);
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while deploying the agent pipeline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative w-screen min-h-screen pt-24 pb-12 px-6 lg:px-12 flex gap-6 z-10 text-white selection:bg-[#7C5CFC]/30 selection:text-white">
      {/* ── SIDEBAR: PAST CASES ── */}
      <div className="w-80 rounded-[1.25rem] bg-[#0a0a0c]/85 border border-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col p-5 h-[calc(100vh-140px)] shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading italic text-2xl tracking-tight text-white/90">Investigation nodes</h2>
          <button
            onClick={() => {
              setSelectedCaseId(null);
              setIsCreatingNew(true);
            }}
            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-white/80 hover:text-white"
            title="New investigation"
          >
            ＋
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {loadingCases ? (
            <div className="flex items-center justify-center py-10 text-white/30 text-xs tracking-wider uppercase">
              Accessing Context Store...
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-white/30 text-xs px-2">
              <span className="text-xl mb-2">📁</span>
              No investigation sessions stored yet.
            </div>
          ) : (
            cases.map((c) => (
              <button
                key={c.case_id}
                onClick={() => handleSelectCase(c.case_id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedCaseId === c.case_id
                    ? "bg-[#7C5CFC]/10 border-[#7C5CFC]/40 shadow-lg shadow-[#7C5CFC]/5"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                }`}
              >
                <span className="text-xs font-body font-light text-white/90 line-clamp-2 leading-relaxed">
                  {c.problem_statement}
                </span>

                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] text-white/40 font-light font-body">
                    {c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                  </span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                      c.status === "completed"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : c.status === "failed"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : c.status === "investigating"
                        ? "bg-[#7C5CFC]/15 text-[#9E8EFD] border border-[#7C5CFC]/30 animate-pulse"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Back to Home CTA */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onBackToLanding}
            className="w-full py-2.5 text-xs font-semibold tracking-wider text-white/50 hover:text-white rounded-full border border-white/5 hover:border-white/15 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            ← Back to Landing
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 rounded-[1.25rem] bg-[#09090b]/85 border border-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col p-8 h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {isCreatingNew ? (
            /* CREATE CASE WORKSPACE */
            <motion.div
              key="create-workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto w-full flex flex-col justify-center min-h-full py-6"
            >
              <div className="mb-8">
                <h1 className="font-heading italic text-4xl text-white tracking-tight leading-none mb-3">
                  Deploy Autonomous Pipeline
                </h1>
                <p className="text-sm text-white/55 font-light font-body leading-relaxed">
                  Enter an open-ended scenario or problem statement. Our Case Manager will decompose it into structured hypotheses, which are verified against DuckDuckGo searches by autonomous investigators.
                </p>
              </div>

              <form onSubmit={handleSubmitCase} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                    Investigation Objective / Problem Statement
                  </label>
                  <textarea
                    required
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder="e.g. Why are Nvidia's stock gains decelerating in Q2 2026?"
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/35 focus:border-[#7C5CFC]/40 focus:outline-none focus:bg-white/[0.04] transition-all resize-none font-body leading-relaxed"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                      Scope boundaries / Constraints (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={addConstraint}
                      className="text-[10px] font-semibold text-[#9E8EFD] hover:text-white transition-colors cursor-pointer"
                    >
                      ＋ Add Constraint
                    </button>
                  </div>

                  <div className="space-y-2">
                    {constraints.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={c}
                          onChange={(e) => updateConstraint(i, e.target.value)}
                          placeholder={`Constraint #${i + 1} (e.g. limit context to official reports)`}
                          className="flex-1 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-white placeholder-white/35 focus:border-[#7C5CFC]/40 focus:outline-none focus:bg-white/[0.03] transition-all font-body"
                        />
                        {constraints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeConstraint(i)}
                            className="w-8 h-8 rounded-full border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-colors text-white/40 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !problemStatement.trim()}
                    className="flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold text-white liquid-glass-strong hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg disabled:opacity-40 disabled:hover:scale-100 disabled:active:scale-100 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Deploying Pipeline...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="7" />
                          <line x1="16.5" y1="16.5" x2="21" y2="21" />
                        </svg>
                        Deploy Agent Pipeline
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* ACTIVE CASE DETAILS */
            <motion.div
              key="active-workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 pb-20"
            >
              {/* Header block */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-6">
                <div className="space-y-2 max-w-3xl">
                  <span className="text-[10px] font-semibold text-[#9E8EFD] uppercase tracking-widest">
                    Active case context
                  </span>
                  <h1 className="text-xl md:text-2xl font-body font-light text-white/95 leading-relaxed">
                    {activeCase?.problem_statement}
                  </h1>
                  {activeCase?.constraints && activeCase.constraints.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      <span className="text-[10px] text-white/45 font-medium uppercase mr-1">Scope:</span>
                      {activeCase.constraints.map((c, i) => (
                        <span key={i} className="text-[9px] rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-white/70">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                      activeCase?.status === "completed"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : activeCase?.status === "failed"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-[#7C5CFC]/15 text-[#9E8EFD] border border-[#7C5CFC]/30 animate-pulse"
                    }`}
                  >
                    {activeCase?.status}
                  </span>
                  <span className="text-[9px] text-white/30 font-mono">
                    ID: {activeCase?.case_id.substring(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Status Visual Pipeline */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    name: "Case Manager Agent",
                    desc: "Hypothesis generation",
                    active: activeCase?.status === "investigating" && activeCase?.hypotheses.length === 0,
                    done: activeCase?.hypotheses.length > 0,
                  },
                  {
                    name: "Research Agent",
                    desc: "Web queries & verification",
                    active: activeCase?.status === "investigating" && activeCase?.hypotheses.length > 0 && activeCase?.hypotheses.some(h => h.status === "investigating"),
                    done: activeCase?.status === "completed" || (activeCase?.hypotheses.length > 0 && activeCase?.hypotheses.every(h => h.status !== "pending" && h.status !== "investigating")),
                  },
                  {
                    name: "Synthesis Specialist",
                    desc: "Final verdicts & sorting",
                    active: activeCase?.status === "investigating" && activeCase?.hypotheses.length > 0 && activeCase?.hypotheses.every(h => h.status !== "pending" && h.status !== "investigating"),
                    done: activeCase?.status === "completed",
                  },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      step.active
                        ? "bg-[#7C5CFC]/5 border-[#7C5CFC]/30 shadow-md shadow-[#7C5CFC]/5"
                        : step.done
                        ? "bg-green-500/[0.02] border-green-500/25"
                        : "bg-white/[0.01] border-white/5 opacity-40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold tracking-wide block">
                        {step.name}
                      </span>
                      {step.active ? (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9E8EFD] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7C5CFC]" />
                        </span>
                      ) : step.done ? (
                        <span className="text-green-400 text-xs font-bold">✓</span>
                      ) : (
                        <span className="text-white/20 text-[10px]">○</span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/50 block font-light leading-snug">
                      {step.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Accordion List of Hypotheses with Nested Evidence */}
              <div className="space-y-5">
                <h3 className="font-heading italic text-3xl tracking-tight border-b border-white/10 pb-2">
                  Generated Hypotheses & Live Evidence
                </h3>

                {activeCase?.hypotheses && activeCase.hypotheses.length > 0 ? (
                  <div className="space-y-4">
                    {activeCase.hypotheses.map((h, i) => {
                      const isExpanded = expandedHypothesisId === h.id;
                      // Filter evidence belonging to this hypothesis
                      const relatedEvidence = activeCase.evidence ? activeCase.evidence.filter(ev => ev.hypothesis_id === h.id) : [];

                      return (
                        <div
                          key={h.id || i}
                          className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                            isExpanded
                              ? "bg-white/[0.03] border-white/20 shadow-xl"
                              : "bg-white/[0.01] border-white/5 hover:border-white/10"
                          }`}
                        >
                          {/* Accordion Trigger Header */}
                          <button
                            onClick={() => setExpandedHypothesisId(isExpanded ? null : h.id)}
                            className="w-full text-left p-5 flex items-start justify-between gap-4 cursor-pointer"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-white/35 bg-white/5 px-2 py-0.5 rounded">
                                  HYPOTHESIS {i + 1}
                                </span>
                                {h.assigned_investigator && (
                                  <span className="text-[10px] text-[#9E8EFD] font-mono font-semibold">
                                    🕵️ {h.assigned_investigator}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-body font-light text-white/95 leading-relaxed pr-4">
                                {h.statement}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  h.status === "verified"
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : h.status === "disproved"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : h.status === "inconclusive"
                                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                    : h.status === "investigating"
                                    ? "bg-[#7C5CFC]/15 text-[#9E8EFD] border border-[#7C5CFC]/30 animate-pulse"
                                    : "bg-white/5 text-white/30 border border-white/5"
                                }`}
                              >
                                {h.status}
                              </span>
                              <span className="text-white/40 text-xs">
                                {isExpanded ? "▲" : "▼"}
                              </span>
                            </div>
                          </button>

                          {/* Accordion Body Content */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                              >
                                <div className="border-t border-white/5 p-5 bg-black/20 space-y-4">
                                  {/* Evidence items */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                                      Collected Evidence & Web Snippets
                                    </h4>

                                    {relatedEvidence.length > 0 ? (
                                      <div className="space-y-3">
                                        {relatedEvidence.map((ev, evIdx) => {
                                          const isContrary = ev.content.startsWith("[CONTRARY]");
                                          const cleanContent = isContrary ? ev.content.replace("[CONTRARY] ", "") : ev.content;

                                          return (
                                            <div
                                              key={ev.id || evIdx}
                                              className={`p-4 rounded-lg border text-xs font-body font-light leading-relaxed ${
                                                isContrary
                                                  ? "bg-red-950/10 border-red-500/20 text-red-100/90 pl-3.5 border-l-2 border-l-red-500"
                                                  : "bg-green-950/5 border-green-500/20 text-green-500/90 pl-3.5 border-l-2 border-l-green-500"
                                              }`}
                                            >
                                              <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-mono font-medium text-white/40">
                                                  Source: {ev.source}
                                                </span>
                                                <span className="text-[10px] font-mono font-medium text-white/40">
                                                  Confidence: {(ev.confidence * 100).toFixed(0)}%
                                                </span>
                                              </div>
                                              <p>{cleanContent}</p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : h.status === "investigating" ? (
                                      <div className="flex items-center gap-2 text-white/35 text-xs py-2">
                                        <svg className="animate-spin h-3.5 w-3.5 text-[#9E8EFD]" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Crawling DuckDuckGo search queries for evidence...
                                      </div>
                                    ) : (
                                      <div className="text-white/35 text-xs py-2 italic">
                                        No direct evidence recorded for this hypothesis.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl text-white/30 text-xs">
                    <svg className="animate-spin h-5 w-5 text-[#9E8EFD] mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Case Manager decomposing case objective...
                  </div>
                )}
              </div>

              {/* ── Conclusion Section ── */}
              {activeCase?.status === "completed" && activeCase?.facts && activeCase.facts.length > 0 && (
                <div className="bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 p-6 rounded-xl space-y-4 mt-6">
                  <h3 className="font-heading italic text-3xl text-white">
                    Final Case Verdict Summary
                  </h3>
                  <div className="space-y-3">
                    {activeCase.facts
                      .filter((f) => f.source === "ResearchAgent")
                      .map((f, i) => (
                        <div key={i} className="text-sm font-body font-light text-white/90 leading-relaxed border-l-2 border-[#7C5CFC]/50 pl-3">
                          {f.content.replace("Hypothesis Verdict:", "")}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
