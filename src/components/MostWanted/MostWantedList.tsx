import React, { useState, useMemo } from 'react';
import {
  MostWantedFugitive,
  AgencyType,
  NoticeType,
  TrackedSubject,
  PoliceStation,
  ActiveAlertLog,
} from '../../types';
import {
  ShieldAlert,
  Search,
  Flame,
  Globe,
  Crown,
  Building2,
  Crosshair,
  Car,
  FileText,
  AlertTriangle,
  Cpu,
  Fingerprint,
  Radio,
  ExternalLink,
  MapPin,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Eye,
  Lock,
  Download,
  Share2,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface MostWantedListProps {
  fugitives: MostWantedFugitive[];
  subjects: TrackedSubject[];
  onSelectTrackSubject: (subject: TrackedSubject) => void;
  onDispatchFugitive: (fugitive: MostWantedFugitive) => void;
  onRequestAIDossier: (fugitive: MostWantedFugitive) => void;
}

export const MostWantedList: React.FC<MostWantedListProps> = ({
  fugitives,
  subjects,
  onSelectTrackSubject,
  onDispatchFugitive,
  onRequestAIDossier,
}) => {
  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDanger, setSelectedDanger] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'BOUNTY' | 'DANGER' | 'MATCH' | 'NAME'>('BOUNTY');
  const [inspectFugitive, setInspectFugitive] = useState<MostWantedFugitive | null>(null);
  const [warrantCopiedId, setWarrantCopiedId] = useState<string | null>(null);

  // Agency Counts
  const agencyCounts = useMemo(() => {
    return {
      ALL: fugitives.length,
      FBI: fugitives.filter((f) => f.agency === 'FBI').length,
      INTERPOL: fugitives.filter((f) => f.agency === 'INTERPOL').length,
      MI6: fugitives.filter((f) => f.agency === 'MI6').length,
      EUROPOL: fugitives.filter((f) => f.agency === 'EUROPOL').length,
    };
  }, [fugitives]);

  // Filtering & Sorting
  const filteredFugitives = useMemo(() => {
    return fugitives
      .filter((f) => {
        // Agency filter
        if (selectedAgency !== 'ALL' && f.agency !== selectedAgency) return false;

        // Danger filter
        if (selectedDanger !== 'ALL' && f.dangerRating !== selectedDanger) return false;

        // Search query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = f.fullName.toLowerCase().includes(q);
          const matchAlias = f.alias.toLowerCase().includes(q) || f.aliases.some((a) => a.toLowerCase().includes(q));
          const matchSyndicate = f.syndicate.toLowerCase().includes(q);
          const matchCountry = f.lastKnownLocation.country.toLowerCase().includes(q) || f.nationality.toLowerCase().includes(q);
          const matchCharges = f.charges.some((c) => c.toLowerCase().includes(q));
          const matchWarrant =
            (f.fbiCaseId && f.fbiCaseId.toLowerCase().includes(q)) ||
            (f.interpolNoticeNumber && f.interpolNoticeNumber.toLowerCase().includes(q)) ||
            (f.mi6Reference && f.mi6Reference.toLowerCase().includes(q));

          return matchName || matchAlias || matchSyndicate || matchCountry || matchCharges || matchWarrant;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'BOUNTY') {
          // Extract numeric digits from bounty
          const getBountyValue = (str: string) => {
            const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
            return isNaN(num) ? 0 : num;
          };
          return getBountyValue(b.bountyReward) - getBountyValue(a.bountyReward);
        }
        if (sortBy === 'DANGER') {
          const dangerScore: Record<string, number> = { EXTREME: 3, CRITICAL: 2, HIGH: 1 };
          return (dangerScore[b.dangerRating] || 0) - (dangerScore[a.dangerRating] || 0);
        }
        if (sortBy === 'MATCH') {
          return b.biometrics.faceMatchScore - a.biometrics.faceMatchScore;
        }
        return a.fullName.localeCompare(b.fullName);
      });
  }, [fugitives, selectedAgency, selectedDanger, searchQuery, sortBy]);

  // Agency Badge Renderer
  const renderAgencyBadge = (agency: AgencyType) => {
    switch (agency) {
      case 'FBI':
        return (
          <span className="px-2 py-0.5 rounded bg-blue-950/90 border border-blue-600 text-blue-300 font-bold text-[10px] flex items-center gap-1 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
            <Building2 className="w-3 h-3 text-blue-400" />
            <span>FBI TOP TEN</span>
          </span>
        );
      case 'INTERPOL':
        return (
          <span className="px-2 py-0.5 rounded bg-red-950/90 border border-red-500 text-red-300 font-bold text-[10px] flex items-center gap-1 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse">
            <Globe className="w-3 h-3 text-red-400" />
            <span>INTERPOL RED NOTICE</span>
          </span>
        );
      case 'MI6':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500 text-amber-300 font-bold text-[10px] flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>MI6 / SIS ALPHA</span>
          </span>
        );
      case 'EUROPOL':
        return (
          <span className="px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-500 text-indigo-300 font-bold text-[10px] flex items-center gap-1 shadow-[0_0_8px_rgba(99,102,241,0.3)]">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>EUROPOL WANTED</span>
          </span>
        );
    }
  };

  const handleCopyWarrant = (fugitive: MostWantedFugitive) => {
    soundFx.playClick();
    const warrantText = `=====================================================
OFFICIAL LAW ENFORCEMENT NOTICE - INTERNATIONAL WARRANT
AGENCY: ${fugitive.agency} | NOTICE: ${fugitive.noticeType}
SUBJECT: ${fugitive.fullName.toUpperCase()} (ALIAS: ${fugitive.alias})
WARRANT REF: ${fugitive.fbiCaseId || fugitive.interpolNoticeNumber || fugitive.mi6Reference || fugitive.europolRef}
BOUNTY REWARD: ${fugitive.bountyReward}
CHARGES:
${fugitive.charges.map((c) => `- ${c}`).join('\n')}
LAST KNOWN SECTOR: ${fugitive.lastKnownLocation.city}, ${fugitive.lastKnownLocation.country}
GPS COORDINATES: ${fugitive.lastKnownLocation.lat}° N, ${fugitive.lastKnownLocation.lng}° E
PHYSICAL DESCRIPTOR: Height: ${fugitive.physicalDescription.height}, Weight: ${fugitive.physicalDescription.weight}
BIOMETRIC IRIS HASH: ${fugitive.biometrics.irisHash}
CAUTION: ${fugitive.physicalDescription.cautionNotes}
=====================================================`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(warrantText);
      setWarrantCopiedId(fugitive.id);
      setTimeout(() => setWarrantCopiedId(null), 3000);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-red-600/10 via-red-950/20 to-transparent pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-600 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                  GLOBAL MOST WANTED FUGITIVES INTELLIGENCE
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-bold animate-pulse">
                  LEVEL 1 HIGH THREAT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cross-jurisdictional surveillance registry correlating FBI Top Ten, INTERPOL Red Notices, MI6 Secret Intelligence Watchlists, and Europol targets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>{fugitives.length} Verified Targets in DB</span>
            </div>
          </div>
        </div>

        {/* Agency Navigation Filter Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => {
              soundFx.playClick();
              setSelectedAgency('ALL');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedAgency === 'ALL'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>All Agencies</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {agencyCounts.ALL}
            </span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setSelectedAgency('FBI');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedAgency === 'FBI'
                ? 'bg-blue-950 text-blue-300 border border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>FBI Top 10</span>
            <span className="px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800 text-[10px] text-blue-300">
              {agencyCounts.FBI}
            </span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setSelectedAgency('INTERPOL');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedAgency === 'INTERPOL'
                ? 'bg-red-950 text-red-300 border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-red-400" />
            <span>INTERPOL Red Notices</span>
            <span className="px-1.5 py-0.2 rounded bg-red-950 border border-red-800 text-[10px] text-red-300">
              {agencyCounts.INTERPOL}
            </span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setSelectedAgency('MI6');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedAgency === 'MI6'
                ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>MI6 / SIS Priority</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-800 text-[10px] text-amber-300">
              {agencyCounts.MI6}
            </span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setSelectedAgency('EUROPOL');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedAgency === 'EUROPOL'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Europol Wanted</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-[10px] text-indigo-300">
              {agencyCounts.EUROPOL}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search HUD Controls */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, alias, syndicate, warrant reference, charges..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Threat Level Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Threat:</span>
          <select
            value={selectedDanger}
            onChange={(e) => setSelectedDanger(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            <option value="ALL">All Danger Levels</option>
            <option value="EXTREME">EXTREME (Lethal Force Authorized)</option>
            <option value="CRITICAL">CRITICAL (High Yield Risk)</option>
            <option value="HIGH">HIGH (Armed & Flight Risk)</option>
          </select>
        </div>

        {/* Sort Field */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            <option value="BOUNTY">Bounty Reward (Highest First)</option>
            <option value="DANGER">Threat Severity</option>
            <option value="MATCH">Optical Biometric Score</option>
            <option value="NAME">Subject Name</option>
          </select>
        </div>
      </div>

      {/* Fugitive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFugitives.map((fugitive) => {
          const correlatedSubject = subjects.find(
            (s) => s.id === fugitive.correlatedTrackedSubjectId || s.fullName.toLowerCase() === fugitive.fullName.toLowerCase()
          );

          return (
            <div
              key={fugitive.id}
              className="rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col overflow-hidden shadow-lg group relative"
            >
              {/* Top Red Notice Header Strip */}
              <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderAgencyBadge(fugitive.agency)}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {fugitive.fbiCaseId || fugitive.interpolNoticeNumber || fugitive.mi6Reference || fugitive.europolRef}
                  </span>
                </div>

                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    fugitive.dangerRating === 'EXTREME'
                      ? 'bg-red-600/30 border border-red-500 text-red-300 animate-pulse'
                      : fugitive.dangerRating === 'CRITICAL'
                      ? 'bg-amber-600/30 border border-amber-500 text-amber-300'
                      : 'bg-yellow-600/20 border border-yellow-500 text-yellow-300'
                  }`}
                >
                  {fugitive.dangerRating}
                </span>
              </div>

              {/* Subject Portrait & High-Value Bounty Banner */}
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex gap-3.5">
                  {/* Portrait with Biometric Scanning Reticle */}
                  <div className="relative w-24 h-28 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-900 group-hover:border-cyan-500/80 transition-colors">
                    <img
                      src={fugitive.avatarUrl}
                      alt={fugitive.fullName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all"
                    />

                    {/* Biometric Target Overlay */}
                    <div className="absolute inset-0 border border-cyan-500/30 pointer-events-none">
                      <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
                    </div>

                    <div className="absolute bottom-1 left-1 right-1 bg-black/80 backdrop-blur-sm rounded px-1 py-0.5 text-[9px] text-emerald-400 font-mono text-center">
                      MATCH: {fugitive.biometrics.faceMatchScore}%
                    </div>
                  </div>

                  {/* Name, Alias & Nationality */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {fugitive.fullName}
                    </h3>

                    <div className="text-xs text-cyan-400 font-bold truncate">
                      [{fugitive.alias}]
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <span>{fugitive.nationality}</span> • <span>Age {fugitive.age}</span>
                    </div>

                    {/* Bounty Banner */}
                    <div className="pt-1">
                      <div className="px-2 py-1 rounded bg-amber-950/80 border border-amber-500/80 text-amber-300 font-bold text-xs flex items-center justify-between shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        <span className="text-[9px] text-amber-400/80 font-normal uppercase">BOUNTY:</span>
                        <span className="text-amber-200 font-mono">{fugitive.bountyReward}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Criminal Syndicate Tag */}
                <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 space-y-1">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Affiliated Syndicate / Org:</div>
                  <div className="text-slate-200 font-medium leading-tight">{fugitive.syndicate}</div>
                </div>

                {/* Primary Charges Tags */}
                <div className="space-y-1 flex-1">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Principal Charges & Warrants:</div>
                  <div className="flex flex-wrap gap-1">
                    {fugitive.charges.slice(0, 3).map((charge, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {charge}
                      </span>
                    ))}
                    {fugitive.charges.length > 3 && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                        +{fugitive.charges.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Last Known Coordinates & Geo-Sector */}
                <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-900 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-cyan-400 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{fugitive.lastKnownLocation.city}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {fugitive.lastKnownLocation.lat.toFixed(2)}°N, {fugitive.lastKnownLocation.lng.toFixed(2)}°E
                  </span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Track on God's Eye */}
                  <button
                    onClick={() => {
                      soundFx.playLockOn();
                      if (correlatedSubject) {
                        onSelectTrackSubject(correlatedSubject);
                      } else {
                        // Synthesize tracked subject to jump to on map
                        const tempSub: TrackedSubject = {
                          id: fugitive.id,
                          fullName: fugitive.fullName,
                          alias: fugitive.alias,
                          did: `did:aegis:${fugitive.id.toLowerCase()}`,
                          avatarUrl: fugitive.avatarUrl,
                          nationalIdNumber: fugitive.fbiCaseId || fugitive.interpolNoticeNumber || 'WARRANT-INT-99',
                          threatLevel: 'CRITICAL_CODE_RED',
                          geofenceStatus: 'BREACH_DETECTED',
                          currentLocation: {
                            lat: fugitive.lastKnownLocation.lat,
                            lng: fugitive.lastKnownLocation.lng,
                            altitudeMeters: 12.0,
                            accuracyMeters: 2.1,
                            headingDegrees: 120,
                            speedKmh: 35.0,
                            locationName: fugitive.lastKnownLocation.sectorNote,
                            zoneId: 'ZONE_WARRANT_INTERCEPT',
                            timestamp: new Date().toISOString(),
                          },
                          locationHistory: [],
                          bankcardTransactions: [],
                          transitEvents: [],
                          biometrics: {
                            irisHash: fugitive.biometrics.irisHash,
                            faceMatchScore: fugitive.biometrics.faceMatchScore,
                            voiceprintHarmonicScore: fugitive.biometrics.voiceprintHarmonicScore,
                            gaitCadenceFrequency: 1.82,
                            faceEmbeddingVector: [0.12, 0.45, 0.88, 0.32],
                            dnaMarkerReference: fugitive.biometrics.dnaMarkerReference,
                            lastScannedAt: new Date().toISOString(),
                            govDatabaseRefId: fugitive.id,
                            govDatabaseStatus: 'WATCHLIST_RED_NOTICE',
                          },
                          assignedSecureNodeId: 'NODE-E2EE-01',
                          e2eeSessionActive: true,
                          lastTelemetryPing: new Date().toISOString(),
                          notes: fugitive.summary,
                          isLockedOn: true,
                        };
                        onSelectTrackSubject(tempSub);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-300 hover:bg-cyan-900 hover:text-white transition-colors text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Track on Map</span>
                  </button>

                  {/* Dispatch Police CAD */}
                  <button
                    onClick={() => {
                      soundFx.playRadioChirp();
                      onDispatchFugitive(fugitive);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-red-600 border border-red-400 text-white hover:bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Dispatch CAD</span>
                  </button>
                </div>

                {/* Secondary Row: AI Dossier & Full Inspect */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onRequestAIDossier(fugitive);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>AI Threat Intel</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyWarrant(fugitive)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1"
                      title="Copy official law enforcement warrant notice"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{warrantCopiedId === fugitive.id ? 'Copied!' : 'Warrant'}</span>
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setInspectFugitive(fugitive);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-200 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Full Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Fugitive Full Dossier Modal */}
      {inspectFugitive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-slate-950 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] font-mono animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {renderAgencyBadge(inspectFugitive.agency)}
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {inspectFugitive.fullName.toUpperCase()} [{inspectFugitive.alias}]
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    WARRANT REFERENCE: {inspectFugitive.fbiCaseId || inspectFugitive.interpolNoticeNumber || inspectFugitive.mi6Reference || inspectFugitive.europolRef}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectFugitive(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Profile & Photo Grid */}
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="relative w-36 h-44 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-900 shadow-md">
                  <img
                    src={inspectFugitive.avatarUrl}
                    alt={inspectFugitive.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[9px]">
                    {inspectFugitive.dangerRating}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 rounded px-1.5 py-0.5 text-center text-[10px] text-emerald-400">
                    MATCH: {inspectFugitive.biometrics.faceMatchScore}%
                  </div>
                </div>

                <div className="space-y-2.5 flex-1">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Official Bounty Reward:</div>
                      <div className="text-lg font-bold text-amber-200">{inspectFugitive.bountyReward}</div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded bg-amber-600 text-black font-bold uppercase">
                      Payable Upon Capture
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Nationality</span>
                      <span className="text-slate-200 font-semibold">{inspectFugitive.nationality}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Age / Gender</span>
                      <span className="text-slate-200 font-semibold">{inspectFugitive.age} yrs • Female/Male</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Height / Weight</span>
                      <span className="text-slate-200 font-semibold">
                        {inspectFugitive.physicalDescription.height} • {inspectFugitive.physicalDescription.weight}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Eyes / Hair</span>
                      <span className="text-slate-200 font-semibold">
                        {inspectFugitive.physicalDescription.eyes} • {inspectFugitive.physicalDescription.hair}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Intelligence Summary */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Executive Intelligence Summary & Modus Operandi</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{inspectFugitive.summary}</p>
              </div>

              {/* Criminal Syndicate & Charges */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Criminal Enterprise & Full Indictment:</div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-cyan-300 font-semibold">Syndicate: {inspectFugitive.syndicate}</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {inspectFugitive.charges.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Biometrics & Forensic Hashes */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Biometric Forensic Vectors</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[9px] uppercase">Iris Hash Signature:</span>
                    <span className="text-emerald-400 font-mono text-[10px] break-all">
                      {inspectFugitive.biometrics.irisHash}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[9px] uppercase">DNA Reference ID:</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {inspectFugitive.biometrics.dnaMarkerReference}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scars, Marks & Cautions */}
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/60 space-y-2 text-red-200">
                <div className="text-[10px] font-bold uppercase text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Tactical Caution & Scars / Marks</span>
                </div>
                <p className="font-semibold">{inspectFugitive.physicalDescription.cautionNotes}</p>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-500">Distinguishing Features: </span>
                  {inspectFugitive.physicalDescription.scarsAndMarks.join(', ')}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleCopyWarrant(inspectFugitive)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{warrantCopiedId === inspectFugitive.id ? 'Copied to Clipboard!' : 'Copy Interpol Warrant'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInspectFugitive(null);
                    onRequestAIDossier(inspectFugitive);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-950 border border-purple-600 text-purple-300 hover:bg-purple-900 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>AI Threat Analysis</span>
                </button>

                <button
                  onClick={() => {
                    setInspectFugitive(null);
                    onDispatchFugitive(inspectFugitive);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-red-600 border border-red-400 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Dispatch Rapid Police Intercept</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
