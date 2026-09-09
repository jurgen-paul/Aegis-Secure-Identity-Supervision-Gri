import React from 'react';
import {
  Shield,
  Eye,
  Lock,
  Radio,
  Volume2,
  VolumeX,
  FileText,
  AlertTriangle,
  Zap,
  Activity,
  Server,
  RefreshCw,
  ListTodo,
} from 'lucide-react';
import { soundFx } from '../lib/audio';

interface HeaderProps {
  systemMode: 'ONLINE' | 'SIMULATION' | 'LOCKDOWN';
  activeThreatCount: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onOpenDocsExport: () => void;
  onSimulateBreach: () => void;
  onToggleLockdown: () => void;
  isLockdownActive: boolean;
  onOpenTasks?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemMode,
  activeThreatCount,
  isMuted,
  setIsMuted,
  onOpenDocsExport,
  onSimulateBreach,
  onToggleLockdown,
  isLockdownActive,
  onOpenTasks,
}) => {
  const toggleAudio = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundFx.setMuted(nextMute);
    if (!nextMute) soundFx.playClick();
  };

  return (
    <header className="border-b border-cyan-900/60 bg-slate-950/95 text-slate-100 backdrop-blur-md sticky top-0 z-50">
      {/* Top Threat Banner if active */}
      {isLockdownActive && (
        <div className="bg-red-600/90 text-white px-4 py-1 text-xs font-mono font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>CRITICAL ALERT: SECTOR GEOFENCE BREACH DETECTED — AUTONOMOUS NODE LOCKDOWN ENGAGED</span>
          </div>
          <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] tracking-wider">PROTOCOL OMEGA-9</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & System Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600/30 to-blue-900/40 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Eye className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-950 animate-ping" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                AEGIS <span className="text-cyan-400 font-extrabold">GOD'S EYE</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                v3.2 SOVEREIGN
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 border border-emerald-700/50 text-emerald-300">
                <Shield className="w-3 h-3 text-emerald-400" />
                E2EE + DID
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>Decentralized Identity & Real-Time Multi-Vector Supervision Matrix</span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Live Node Stream Heartbeat */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">18 NODES LIVE</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400">4.8 MB/s E2EE</span>
          </div>

          {/* Simulate Breach Trigger */}
          <button
            id="btn-simulate-breach"
            onClick={onSimulateBreach}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-amber-950/50 border border-amber-600/60 text-amber-300 hover:bg-amber-900/60 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Trigger simulated rogue asset geofence breach"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Simulate</span> Breach
          </button>

          {/* Autonomous Lockdown Toggle */}
          <button
            id="btn-toggle-lockdown"
            onClick={onToggleLockdown}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
              isLockdownActive
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-slate-900/90 text-red-300 border-red-900/60 hover:bg-red-950/70 hover:border-red-600'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLockdownActive ? 'LOCKDOWN ACTIVE' : 'NODE LOCKDOWN'}</span>
          </button>

          {/* Export to Google Docs */}
          <button
            id="btn-export-docs"
            onClick={onOpenDocsExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 border border-cyan-400/40 shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Export Cryptographic Audit Dossier to Google Docs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Google Docs Export</span>
          </button>

          {/* Audio Sound FX Toggle */}
          <button
            id="btn-toggle-audio"
            onClick={toggleAudio}
            className={`p-1.5 rounded-md border text-xs font-mono transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-cyan-950/60 border-cyan-700/60 text-cyan-400 hover:bg-cyan-900/60'
            }`}
            title={isMuted ? 'Unmute tactical audio feedback' : 'Mute tactical audio feedback'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
