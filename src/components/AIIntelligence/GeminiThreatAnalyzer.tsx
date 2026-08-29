import React, { useState } from 'react';
import { TrackedSubject } from '../../types';
import { Cpu, Zap, RefreshCw, ShieldAlert, Sparkles, CheckCircle2, FileText } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface GeminiThreatAnalyzerProps {
  subjects: TrackedSubject[];
  selectedSubject: TrackedSubject | null;
  onSelectSubject: (sub: TrackedSubject) => void;
  onOpenDocsExport: () => void;
}

export const GeminiThreatAnalyzer: React.FC<GeminiThreatAnalyzerProps> = ({
  subjects,
  selectedSubject,
  onSelectSubject,
  onOpenDocsExport,
}) => {
  const [currentSubject, setCurrentSubject] = useState<TrackedSubject>(selectedSubject || subjects[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dossierResult, setDossierResult] = useState<{
    source: string;
    assessment: string;
    generatedAt: string;
  } | null>(null);

  const handleGenerateAIDossier = async () => {
    setIsAnalyzing(true);
    soundFx.playClick();

    try {
      const response = await fetch('/api/ai-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName: currentSubject.fullName,
          targetDid: currentSubject.did,
          biometricScore: currentSubject.biometrics.faceMatchScore,
          recentSightings: currentSubject.locationHistory,
          bankcardEvents: currentSubject.bankcardTransactions,
          transitEvents: currentSubject.transitEvents,
        }),
      });

      const data = await response.json();
      setDossierResult(data);
      soundFx.playDecrypt();
    } catch (err) {
      console.error('AI dossier error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                GEMINI AI THREAT & BEHAVIORAL DOSSIER SYNTHESIZER
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-300">
                  MULTI-VECTOR CORRELATION
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Correlates optical face vectors, bankcard signals, and transit routes into actionable intelligence briefs.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAIDossier}
            disabled={isAnalyzing}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-md"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Multi-Vector Telemetry...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Synthesize Threat Dossier</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Target Subject Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Select Supervised Target
          </h3>

          {subjects.map((sub) => (
            <div
              key={sub.id}
              onClick={() => {
                soundFx.playClick();
                setCurrentSubject(sub);
                onSelectSubject(sub);
              }}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                currentSubject.id === sub.id
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={sub.avatarUrl}
                  alt={sub.fullName}
                  className="w-10 h-10 rounded-lg object-cover border border-cyan-700/60"
                />
                <div>
                  <div className="font-bold text-white text-xs">{sub.fullName}</div>
                  <div className="text-[11px] text-slate-400">{sub.alias}</div>
                  <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                    {sub.threatLevel} • {sub.biometrics.faceMatchScore}% BIO
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Intelligence Output */}
        <div className="lg:col-span-2 space-y-4">
          {dossierResult ? (
            <div className="rounded-xl bg-slate-950 border border-cyan-800/80 p-6 space-y-4 shadow-xl text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    INTELLIGENCE SYNTHESIS ENGINE
                  </span>
                  <h3 className="text-sm font-bold text-white">{dossierResult.source}</h3>
                </div>
                <button
                  onClick={onOpenDocsExport}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export to Google Docs</span>
                </button>
              </div>

              {/* Formatted Markdown Content */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {dossierResult.assessment}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-950 border border-dashed border-slate-800 p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
              <Cpu className="w-8 h-8 text-cyan-500/50" />
              <span>Select a target and click "Synthesize Threat Dossier" to run AI multi-vector behavioral anomaly prediction.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
