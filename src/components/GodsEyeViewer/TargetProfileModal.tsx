import React, { useState } from 'react';
import {
  TrackedSubject,
} from '../../types';
import {
  X,
  Shield,
  CreditCard,
  Train,
  Fingerprint,
  Radio,
  MapPin,
  Lock,
  FileText,
  AlertTriangle,
  Zap,
  Activity,
  CheckCircle2,
  Share2,
  Eye,
  KeyRound,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface TargetProfileModalProps {
  subject: TrackedSubject | null;
  onClose: () => void;
  onDispatchContainment: (subject: TrackedSubject) => void;
  onExportToDocs: (subject: TrackedSubject) => void;
  onRequestAIAssessment: (subject: TrackedSubject) => void;
}

export const TargetProfileModal: React.FC<TargetProfileModalProps> = ({
  subject,
  onClose,
  onDispatchContainment,
  onExportToDocs,
  onRequestAIAssessment,
}) => {
  const [activeTab, setActiveTab] = useState<'biometrics' | 'financial' | 'transit' | 'sovereign'>('biometrics');

  if (!subject) return null;

  const isRed = subject.threatLevel === 'CRITICAL_CODE_RED';
  const isAmber = subject.threatLevel === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-cyan-700/60 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] text-slate-200 font-mono">
        {/* Header Ribbon */}
        <div className={`px-6 py-3 border-b flex items-center justify-between ${
          isRed ? 'bg-red-950/60 border-red-800' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRed ? 'bg-red-600 text-white animate-pulse' : 'bg-cyan-600/30 text-cyan-300'}`}>
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-cyan-400 font-bold">GOD'S EYE TARGET DOSSIER</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">ID: {subject.id}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isRed
                    ? 'bg-red-600/40 text-red-300 border border-red-500 animate-pulse'
                    : isAmber
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500'
                    : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500'
                }`}>
                  {subject.threatLevel}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                {subject.fullName} <span className="text-cyan-400 text-sm font-normal">[{subject.alias}]</span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Matrix Banner */}
        <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>{subject.currentLocation.locationName}</span>
            <span className="text-slate-500">({subject.currentLocation.speedKmh} km/h @ {subject.currentLocation.headingDegrees}°)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                onRequestAIAssessment(subject);
              }}
              className="px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-600/80 text-cyan-300 hover:bg-cyan-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Threat Synthesis</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                onExportToDocs(subject);
              }}
              className="px-3 py-1.5 rounded bg-blue-950/80 border border-blue-600/80 text-blue-300 hover:bg-blue-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Export to Google Docs</span>
            </button>

            <button
              onClick={() => {
                soundFx.playAlarm();
                onDispatchContainment(subject);
              }}
              className="px-3 py-1.5 rounded bg-red-950 border border-red-600 text-red-300 hover:bg-red-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Dispatch Intercept</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Top Row: Face Scan & Identity Linking */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Optical Neural Face Box */}
            <div className="relative rounded-xl bg-slate-900 border border-cyan-800/60 p-4 flex flex-col items-center text-center">
              <div className="relative w-36 h-36 rounded-lg overflow-hidden border-2 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.3)] mb-3">
                <img
                  src={subject.avatarUrl}
                  alt={subject.fullName}
                  className="w-full h-full object-cover"
                />
                {/* Neural Facial Landmarks Simulation Overlay */}
                <div className="absolute inset-0 border border-cyan-400/60 pointer-events-none">
                  {/* Facial cross points */}
                  <div className="absolute top-10 left-10 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-10 right-10 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-10 left-10 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-10 right-10 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
                  {/* Center reticle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-cyan-400/60 animate-ping" />
                </div>
                <div className="absolute bottom-1 left-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[9px] text-cyan-300 font-bold">
                  MATCH: {subject.biometrics.faceMatchScore}%
                </div>
              </div>

              <div className="text-xs text-slate-300 font-bold">{subject.fullName}</div>
              <div className="text-[11px] text-slate-400">National ID: {subject.nationalIdNumber}</div>
              <div className="text-[10px] text-cyan-400 mt-1 break-all">DID: {subject.did}</div>
            </div>

            {/* Column 2 & 3: Government Database & Biometric Linkage */}
            <div className="md:col-span-2 space-y-3">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Centralized Government Database Link
                  </span>
                  <span className="text-cyan-400 font-bold">{subject.biometrics.govDatabaseRefId}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">GOVERNMENT STATUS</span>
                    <span className={`font-bold ${
                      subject.biometrics.govDatabaseStatus === 'WATCHLIST_RED_NOTICE'
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}>
                      {subject.biometrics.govDatabaseStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">GEOFENCE STATUS</span>
                    <span className="text-amber-300 font-bold">{subject.geofenceStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ASSIGNED NODE RELAY</span>
                    <span className="text-cyan-300">{subject.assignedSecureNodeId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">E2EE SESSION</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> ACTIVE (AES-256)
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  <span className="text-cyan-400 font-bold">OPERATIONAL INTELLIGENCE NOTE:</span> {subject.notes}
                </div>
              </div>

              {/* Multi-Vector Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pt-1">
                <button
                  onClick={() => setActiveTab('biometrics')}
                  className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'biometrics'
                      ? 'bg-slate-900 text-cyan-300 border-t border-x border-cyan-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Biometric Markers
                </button>
                <button
                  onClick={() => setActiveTab('financial')}
                  className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'financial'
                      ? 'bg-slate-900 text-cyan-300 border-t border-x border-cyan-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bankcard & POS Feed ({subject.bankcardTransactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('transit')}
                  className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'transit'
                      ? 'bg-slate-900 text-cyan-300 border-t border-x border-cyan-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Public Transit Matrix ({subject.transitEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab('sovereign')}
                  className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'sovereign'
                      ? 'bg-slate-900 text-cyan-300 border-t border-x border-cyan-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sovereign DID Vault
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content Display */}
          {activeTab === 'biometrics' && (
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-4">
              <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4" />
                CENTRALIZED BIOMETRIC REGISTRY VECTOR SIGNATURES
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">IRIS PATTERN HASH</span>
                  <span className="text-cyan-300 font-mono text-[11px] break-all">{subject.biometrics.irisHash}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">VOICEPRINT HARMONICS</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full"
                        style={{ width: `${subject.biometrics.voiceprintHarmonicScore}%` }}
                      />
                    </div>
                    <span className="text-cyan-400 font-bold">{subject.biometrics.voiceprintHarmonicScore}%</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">GAIT CADENCE ANALYSIS</span>
                  <span className="text-emerald-400 font-bold">{subject.biometrics.gaitCadenceFrequency} Hz</span>
                  <span className="text-[10px] text-slate-500 block">Matched to CCTV Cam #01</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                CENTRAL BANK & POS TRANSACTION SURVEILLANCE FEED
              </h4>
              <div className="space-y-2">
                {subject.bankcardTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
                      tx.isFlagged
                        ? 'bg-red-950/40 border-red-800/80 text-red-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{tx.merchant}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {tx.cardMask} ({tx.network})
                        </span>
                        {tx.isFlagged && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold animate-pulse">
                            ANOMALY FLAGGED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Terminal: {tx.terminalId} • Auth: {tx.authMethod} • {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                      {tx.flagReason && (
                        <div className="text-[11px] text-red-400 font-semibold mt-1">
                          ⚠️ {tx.flagReason}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-white">€{tx.amount.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">SWIFT Synchronized</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transit' && (
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Train className="w-4 h-4" />
                PUBLIC TRANSPORT & TURNSTILE BIOMETRIC INTERCEPT GRID
              </h4>
              <div className="space-y-2">
                {subject.transitEvents.map((tr) => (
                  <div
                    key={tr.id}
                    className={`p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
                      tr.anomalyDetected
                        ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{tr.stationOrGate}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                          {tr.transitType} ({tr.routeId})
                        </span>
                        {tr.biometricGateMatched && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Biometric Gate Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Card ID: {tr.passCardId} • Direction: {tr.direction} • {new Date(tr.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-cyan-400">SECTOR 1A</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sovereign' && (
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                DECENTRALIZED IDENTITY & ZERO-SERVER CRYPTOGRAPHIC KEYRING
              </h4>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">DID Document URI:</span>
                  <span className="text-cyan-400 font-bold">{subject.did}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cryptographic Standard:</span>
                  <span className="text-emerald-400 font-bold">W3C DID v1.0 (Ed25519)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Zero-Knowledge Proof Status:</span>
                  <span className="text-emerald-400 font-bold">ZKP-Range Verified (Self-Sovereign)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
