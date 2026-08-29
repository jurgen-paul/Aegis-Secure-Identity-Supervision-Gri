import React, { useState, useEffect } from 'react';
import {
  TrackedSubject,
  ActiveAlertLog,
  PoliceStation,
  ThreatDispatchPacket,
  DispatchPriority,
  DispatchChannel,
} from '../../types';
import { POLICE_STATIONS } from '../../lib/mockData';
import {
  getStationsRankedByProximity,
  speakTacticalRadio,
  sendThreatToDispatcher,
} from '../../lib/dispatch';
import { soundFx } from '../../lib/audio';
import {
  X,
  Radio,
  ShieldAlert,
  MapPin,
  Send,
  Volume2,
  VolumeX,
  Clock,
  Car,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Lock,
  Sparkles,
  RefreshCw,
  Navigation,
  ChevronRight,
  Shield,
  PhoneCall,
  Flame,
} from 'lucide-react';

interface EmergencyDispatchModalProps {
  subject: TrackedSubject | null;
  alert?: ActiveAlertLog | null;
  onClose: () => void;
  onDispatchSuccess: (packet: ThreatDispatchPacket) => void;
  dispatchHistory?: ThreatDispatchPacket[];
}

export const EmergencyDispatchModal: React.FC<EmergencyDispatchModalProps> = ({
  subject,
  alert,
  onClose,
  onDispatchSuccess,
  dispatchHistory = [],
}) => {
  if (!subject) return null;

  const [rankedStations, setRankedStations] = useState<PoliceStation[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<DispatchPriority>('PRIORITY_1_CODE_RED');
  const [selectedChannel, setSelectedChannel] = useState<DispatchChannel>('TETRA_C2000_POLICE_NET');
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmitStep, setTransmitStep] = useState<string>('');
  const [dispatchedPacket, setDispatchedPacket] = useState<ThreatDispatchPacket | null>(null);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'history'>('dispatch');
  const [isGeneratingAiTranscript, setIsGeneratingAiTranscript] = useState<boolean>(false);
  const [radioTranscript, setRadioTranscript] = useState<string>('');
  const [containmentChecklist, setContainmentChecklist] = useState<string[]>([
    'Immediate turnstile & platform barrier electromagnetic lock',
    'Deploy 2x tactical response officers to sector vestibule',
    'Lock down public high-speed rail boarding turnstiles',
    'Vector patrol vehicles for physical perimeter cordon',
  ]);
  const [newDirective, setNewDirective] = useState<string>('');

  // Calculate nearby stations ranked by proximity
  useEffect(() => {
    if (subject) {
      const ranked = getStationsRankedByProximity(
        subject.currentLocation,
        POLICE_STATIONS,
        selectedPriority === 'PRIORITY_1_CODE_RED'
      );
      setRankedStations(ranked);
      if (ranked.length > 0 && !selectedStationId) {
        setSelectedStationId(ranked[0].id);
      }
    }
  }, [subject, selectedPriority]);

  const selectedStation =
    rankedStations.find((s) => s.id === selectedStationId) || rankedStations[0] || POLICE_STATIONS[0];

  // Initialize standardized radio transcript
  useEffect(() => {
    if (subject && selectedStation) {
      const code10 = selectedPriority === 'PRIORITY_1_CODE_RED' ? '10-33 EMERGENCY TRAFFIC' : '10-99 HIGH THREAT INTERCEPT';
      const initialScript = `[CAD DISPATCH ALL SECTOR UNITS - ${code10}]
TRANSMIT DIRECT TO: ${selectedStation.name.toUpperCase()} [${selectedStation.callsign}]
SUBJECT: ${subject.fullName.toUpperCase()} (ALIAS: ${subject.alias.toUpperCase()})
LOCATION: ${subject.currentLocation.locationName.toUpperCase()}
GPS: ${subject.currentLocation.lat.toFixed(5)}°N, ${subject.currentLocation.lng.toFixed(5)}°E | SPEED: ${subject.currentLocation.speedKmh} KM/H
BIOMETRIC MATCH: ${subject.biometrics.faceMatchScore}% OPTICAL CONFIDENCE
DIRECTIVE: IMMEDIATELY DEPLOY PERIMETER CORDON AND EXECUTE INTERCEPT.`;
      setRadioTranscript(initialScript);
    }
  }, [subject, selectedStation, selectedPriority]);

  const handleGenerateAiTranscript = async () => {
    if (!subject || !selectedStation) return;
    setIsGeneratingAiTranscript(true);
    soundFx.playClick();

    try {
      const response = await fetch('/api/ai-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName: subject.fullName,
          targetDid: subject.did,
          recentSightings: [subject.currentLocation],
          bankcardEvents: subject.bankcardTransactions.slice(0, 2),
          transitEvents: subject.transitEvents.slice(0, 2),
          biometricScore: subject.biometrics.faceMatchScore,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generated = `[CAD EMERGENCY POLICE RADIO - 10-33 HIGH PRIORITY]
TO: ${selectedStation.name.toUpperCase()} (${selectedStation.callsign})
TARGET: ${subject.fullName.toUpperCase()} [${subject.alias}]
SECTOR: ${subject.currentLocation.locationName.toUpperCase()} (${subject.currentLocation.lat.toFixed(5)}, ${subject.currentLocation.lng.toFixed(5)})
THREAT: ${subject.threatLevel} | CONFIDENCE: ${subject.biometrics.faceMatchScore}%
TACTICAL DIRECTIVE: IMMEDIATE CORDON & TURNSTILE SHUTDOWN.`;
        setRadioTranscript(generated);
      }
    } catch (e) {
      console.warn('AI transcript generation failed:', e);
    } finally {
      setIsGeneratingAiTranscript(false);
    }
  };

  const handlePlayVoice = () => {
    if (isPlayingVoice) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingVoice(false);
    } else {
      setIsPlayingVoice(true);
      speakTacticalRadio(radioTranscript, () => {
        setIsPlayingVoice(false);
      });
    }
  };

  const handleTransmitThreat = async () => {
    if (!subject || !selectedStation || isTransmitting) return;

    setIsTransmitting(true);
    soundFx.playPoliceSiren();

    // Staged realistic CAD transmission pipeline
    setTransmitStep('Initiating Secure TETRA C2000 Radio Handshake...');
    await new Promise((r) => setTimeout(r, 600));

    setTransmitStep(`Transmitting Threat Dossier to ${selectedStation.callsign} CAD Console...`);
    await new Promise((r) => setTimeout(r, 700));

    setTransmitStep('Sealing payload with Sovereign Cryptographic Signature...');
    await new Promise((r) => setTimeout(r, 600));

    try {
      const packet = await sendThreatToDispatcher({
        subject,
        alert: alert || undefined,
        targetStation: selectedStation,
        channel: selectedChannel,
        priority: selectedPriority,
        customDirectives: containmentChecklist,
      });

      setTransmitStep(`Acknowledged by ${packet.acknowledgedByOfficerCallsign}! Dispatching Patrol Units...`);
      soundFx.playDispatchSent();
      await new Promise((r) => setTimeout(r, 600));

      setDispatchedPacket(packet);
      onDispatchSuccess(packet);
    } catch (e) {
      console.error('Dispatch transmission error:', e);
    } finally {
      setIsTransmitting(false);
    }
  };

  const toggleDirective = (index: number) => {
    soundFx.playClick();
    setContainmentChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const addDirective = () => {
    if (!newDirective.trim()) return;
    soundFx.playClick();
    setContainmentChecklist((prev) => [...prev, newDirective.trim()]);
    setNewDirective('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto bg-slate-950 border border-red-700/80 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.35)] text-slate-200 font-mono">
        {/* Top Header Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950/90 via-slate-950 to-slate-900 border-b border-red-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-red-400 font-bold tracking-wider">
                  EMERGENCY CAD DISPATCHER INTERFACE
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-300 font-bold">
                  DIRECT PRECINCT INGEST
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Transmit Threat to Police Station & CAD Net
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('dispatch');
                }}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'dispatch'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active Dispatch
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('history');
                }}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'history'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>CAD Log</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
                  {dispatchHistory.length}
                </span>
              </button>
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
        </div>

        {/* Tab 1: Active Dispatch Transmission */}
        {activeTab === 'dispatch' && (
          <div className="p-6 space-y-6">
            {/* Dispatched Success Receipt Card */}
            {dispatchedPacket && (
              <div className="p-4 rounded-xl bg-emerald-950/50 border-2 border-emerald-500 text-xs space-y-3 animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>EMERGENCY DISPATCH TRANSMISSION CONFIRMED</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-600 text-emerald-200 font-bold">
                    CAD ID: {dispatchedPacket.dispatchId}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-900/60">
                    <span className="text-[10px] text-slate-500 block">TARGET PRECINCT</span>
                    <span className="text-emerald-300 font-bold">{dispatchedPacket.targetStationName}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Callsign: {dispatchedPacket.targetStationCallsign}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-900/60">
                    <span className="text-[10px] text-slate-500 block">ASSIGNED PATROL UNITS</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dispatchedPacket.assignedPatrolUnits.map((u) => (
                        <span key={u} className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-[10px]">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-900/60">
                    <span className="text-[10px] text-slate-500 block">CAD SHA-256 SEAL</span>
                    <span className="text-[10px] text-cyan-400 font-mono break-all block">
                      {dispatchedPacket.sha256Seal.slice(0, 28)}...
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">
                      ✓ Acknowledged by {dispatchedPacket.acknowledgedByOfficerCallsign}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Target & Threat Incident Overview */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={subject.avatarUrl}
                  alt={subject.fullName}
                  className="w-14 h-14 rounded-lg object-cover border-2 border-red-500"
                />
                <div>
                  <span className="text-[10px] text-slate-500 block">THREAT TARGET</span>
                  <div className="text-sm font-bold text-white">{subject.fullName}</div>
                  <div className="text-red-400 font-semibold">[{subject.alias}]</div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">INCIDENT LOCATION</span>
                <div className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{subject.currentLocation.locationName}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Lat {subject.currentLocation.lat.toFixed(5)}, Lng {subject.currentLocation.lng.toFixed(5)}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">BIOMETRIC MATCH & SPEED</span>
                <div className="text-emerald-400 font-bold mt-0.5">
                  {subject.biometrics.faceMatchScore}% Match ({subject.biometrics.govDatabaseStatus})
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Velocity: {subject.currentLocation.speedKmh} km/h @ {subject.currentLocation.headingDegrees}°
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">SEVERITY LEVEL</span>
                <span className="inline-block mt-0.5 px-2.5 py-1 rounded bg-red-600 text-white font-bold text-xs animate-pulse">
                  {subject.threatLevel}
                </span>
                <div className="text-[10px] text-amber-400 mt-0.5">Geofence: {subject.geofenceStatus}</div>
              </div>
            </div>

            {/* Section 1: Nearest Police Station Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  SELECT TARGET POLICE STATION / TACTICAL DISPATCH PRECINCT
                </h3>
                <span className="text-[10px] text-slate-400">Ranked by real-time GPS proximity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rankedStations.map((station, index) => {
                  const isSelected = station.id === selectedStation.id;
                  const isNearest = index === 0;

                  return (
                    <div
                      key={station.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedStationId(station.id);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {isNearest && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 text-[9px] font-bold flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5 text-emerald-400" />
                          CLOSEST PRECINCT
                        </div>
                      )}

                      <div className="text-xs space-y-1.5">
                        <div className="font-bold text-white flex items-center gap-1.5 pr-20">
                          <span>{station.name}</span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          {station.address}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[10px]">
                            {station.callsign}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-bold text-[10px] flex items-center gap-1">
                            <Navigation className="w-2.5 h-2.5" />
                            {station.distanceMeters ? `${station.distanceMeters}m` : 'Calculating...'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            ETA ~{station.etaMinutes || 2} min
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 text-[10px]">
                            {station.availableUnits} Patrol Units Active
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 pt-0.5">
                          Radio: {station.radioFrequency}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Transmission Parameters (Priority & Radio Channel) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">
                  DISPATCH PRIORITY LEVEL
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedPriority('PRIORITY_1_CODE_RED');
                    }}
                    className={`p-2 rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                      selectedPriority === 'PRIORITY_1_CODE_RED'
                        ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-red-400'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    PRIORITY 1 (CODE RED)
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedPriority('PRIORITY_2_TACTICAL_INTERCEPT');
                    }}
                    className={`p-2 rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                      selectedPriority === 'PRIORITY_2_TACTICAL_INTERCEPT'
                        ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)] border border-amber-400'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    PRIORITY 2 (INTERCEPT)
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedPriority('PRIORITY_3_ALERT_BOLO');
                    }}
                    className={`p-2 rounded-lg text-center font-bold text-[10px] transition-all cursor-pointer ${
                      selectedPriority === 'PRIORITY_3_ALERT_BOLO'
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    PRIORITY 3 (BOLO)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">
                  EMERGENCY TRANSMISSION FREQUENCY / PROTOCOL
                </label>
                <select
                  value={selectedChannel}
                  onChange={(e) => {
                    soundFx.playClick();
                    setSelectedChannel(e.target.value as DispatchChannel);
                  }}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="TETRA_C2000_POLICE_NET">TETRA C2000 Secure Police Net (380 MHz)</option>
                  <option value="CAD_DIRECT_TERMINAL_112">112 CAD Dispatch Direct Ingest Interface</option>
                  <option value="MARECHAUSSEE_TACTICAL_ENCRYPTED">Koninklijke Marechaussee Tactical Net</option>
                  <option value="EUROPOL_HIGH_THREAT_WAN">Europol High-Threat International WAN</option>
                </select>
              </div>
            </div>

            {/* Section 3: Live Tactical Police Radio Transcript */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">POLICE RADIO & CAD BROADCAST TRANSCRIPT</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateAiTranscript}
                    disabled={isGeneratingAiTranscript}
                    className="px-2.5 py-1 rounded bg-purple-950 border border-purple-700 text-purple-300 hover:bg-purple-900 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-[11px]"
                  >
                    {isGeneratingAiTranscript ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    )}
                    <span>Synthesize with Gemini AI</span>
                  </button>

                  <button
                    onClick={handlePlayVoice}
                    className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] ${
                      isPlayingVoice
                        ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                        : 'bg-cyan-950 border-cyan-700 text-cyan-300 hover:bg-cyan-900'
                    }`}
                  >
                    {isPlayingVoice ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isPlayingVoice ? 'Stop Audio Voice' : 'Radio PTT Voice Broadcast'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={radioTranscript}
                onChange={(e) => setRadioTranscript(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
              />
            </div>

            {/* Section 4: Containment Directives Checklist */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  INCIDENT CONTAINMENT & CORDON DIRECTIVES
                </span>
                <span className="text-[10px] text-slate-500">{containmentChecklist.length} Directives Attached</span>
              </div>

              <div className="space-y-1.5">
                {containmentChecklist.map((dir, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{dir}</span>
                    </div>
                    <button
                      onClick={() => toggleDirective(idx)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Remove directive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add custom police containment directive..."
                  value={newDirective}
                  onChange={(e) => setNewDirective(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDirective()}
                  className="flex-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  onClick={addDirective}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Action Button: Send Threats Straight to Dispatcher */}
            <div className="space-y-3 pt-2">
              {isTransmitting && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-600 text-center text-xs text-red-300 font-bold animate-pulse flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                  <span>{transmitStep}</span>
                </div>
              )}

              <button
                onClick={handleTransmitThreat}
                disabled={isTransmitting}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
                  isTransmitting
                    ? 'bg-red-900/60 text-slate-400 border border-red-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 via-red-500 to-amber-600 text-white hover:from-red-500 hover:to-amber-500 border border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                }`}
              >
                <Send className="w-5 h-5 text-white" />
                <span>
                  {isTransmitting
                    ? 'TRANSMITTING THREAT PACKET...'
                    : `TRANSMIT THREAT TO ${selectedStation.name.toUpperCase()} (ETA ~${selectedStation.etaMinutes || 2} MIN)`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: CAD Dispatch History */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                COMPUTER-AIDED DISPATCH (CAD) TRANSMISSION AUDIT LOG
              </h3>
              <span className="text-xs text-slate-400">{dispatchHistory.length} Recorded Transmissions</span>
            </div>

            {dispatchHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No active threats have been dispatched in this current session.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {dispatchHistory.map((dp) => (
                  <div
                    key={dp.dispatchId}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-400">{dp.dispatchId}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-bold text-white">{dp.targetStationName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                          {dp.targetStationCallsign}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                        {dp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px]">SUBJECT</span>
                        <span className="font-bold">{dp.subjectName}</span> ({dp.subjectAlias})
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">LOCATION</span>
                        <span>{dp.incidentLocation.locationName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">TIME & ACKNOWLEDGMENT</span>
                        <span>{new Date(dp.timestamp).toLocaleTimeString()} ({dp.acknowledgedByOfficerCallsign})</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-cyan-300">
                      <span className="text-slate-500 block text-[10px] mb-1">RADIO TRANSCRIPT:</span>
                      {dp.tacticalRadioTranscript}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1">
                      <span>Assigned Units: {dp.assignedPatrolUnits.join(', ')}</span>
                      <span className="font-mono">Seal: {dp.sha256Seal.slice(0, 32)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
