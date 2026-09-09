import React, { useState, useMemo } from 'react';
import {
  IPTrackerRecord,
  IPTrackerSearchParams,
  TrackedSubject,
  PoliceStation,
} from '../../types';
import {
  Search,
  Globe,
  Network,
  MapPin,
  Calendar,
  User,
  ShieldAlert,
  Wifi,
  Server,
  Activity,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  Radio,
  Eye,
  Send,
  ShieldCheck,
  Cpu,
  Laptop,
  Smartphone,
  Navigation,
  Crosshair,
  Zap,
  Flame,
  SlidersHorizontal,
  RefreshCw,
  Info,
  CheckCircle2,
  Lock,
  Compass,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface IPAddressTrackerProps {
  records: IPTrackerRecord[];
  subjects: TrackedSubject[];
  onSelectTrackSubject: (subjectId: string) => void;
  onDispatchPolice: (subjectId: string) => void;
  onRequestAIDossier: (subjectId: string) => void;
}

export const IPAddressTracker: React.FC<IPAddressTrackerProps> = ({
  records,
  subjects,
  onSelectTrackSubject,
  onDispatchPolice,
  onRequestAIDossier,
}) => {
  // Search parameters matching user specification: Name, Date of Birth, City, Village, Country (+ direct IP)
  const [searchParams, setSearchParams] = useState<IPTrackerSearchParams>({
    name: '',
    dateOfBirth: '',
    city: '',
    village: '',
    country: '',
    ipAddress: '',
  });

  const [selectedRecord, setSelectedRecord] = useState<IPTrackerRecord | null>(records[0] || null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [activeFilterTag, setActiveFilterTag] = useState<string>('ALL');

  // Ping simulation state
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'traceroute' | 'telemetry' | 'geolocate'>('details');

  // Multi-attribute demographic & network filtering
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Search by Name (Full Name or Alias)
      if (searchParams.name.trim()) {
        const query = searchParams.name.toLowerCase().trim();
        const matchesName =
          rec.fullName.toLowerCase().includes(query) ||
          rec.alias.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      // 2. Search by Date of Birth
      if (searchParams.dateOfBirth.trim()) {
        const queryDob = searchParams.dateOfBirth.trim();
        if (!rec.dateOfBirth.includes(queryDob)) return false;
      }

      // 3. Search by City
      if (searchParams.city.trim()) {
        const queryCity = searchParams.city.toLowerCase().trim();
        if (!rec.city.toLowerCase().includes(queryCity)) return false;
      }

      // 4. Search by Village / District / Suburb / Town
      if (searchParams.village.trim()) {
        const queryVillage = searchParams.village.toLowerCase().trim();
        if (!rec.villageOrDistrict.toLowerCase().includes(queryVillage)) return false;
      }

      // 5. Search by Country
      if (searchParams.country.trim() && searchParams.country !== 'ALL') {
        const queryCountry = searchParams.country.toLowerCase().trim();
        if (!rec.country.toLowerCase().includes(queryCountry)) return false;
      }

      // 6. Optional direct IP address search
      if (searchParams.ipAddress && searchParams.ipAddress.trim()) {
        const queryIp = searchParams.ipAddress.trim().toLowerCase();
        if (!rec.ipAddress.toLowerCase().includes(queryIp) && !rec.hostname.toLowerCase().includes(queryIp)) {
          return false;
        }
      }

      // Quick filter preset buttons
      if (activeFilterTag === 'CRITICAL' && rec.threatLevel !== 'CRITICAL_CODE_RED') {
        return false;
      }
      if (activeFilterTag === 'VPN_TOR' && !rec.isVpnOrProxy && !rec.isTorExitNode) {
        return false;
      }
      if (activeFilterTag === 'ACTIVE' && rec.status !== 'ACTIVE_TELEMETRY') {
        return false;
      }
      if (activeFilterTag === 'NETHERLANDS' && rec.country !== 'Netherlands') {
        return false;
      }

      return true;
    });
  }, [records, searchParams, activeFilterTag]);

  // Handle copying IP address
  const handleCopyIP = (ip: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Reset all search fields
  const handleResetSearch = () => {
    soundFx.playClick();
    setSearchParams({
      name: '',
      dateOfBirth: '',
      city: '',
      village: '',
      country: '',
      ipAddress: '',
    });
    setActiveFilterTag('ALL');
  };

  // Quick preset sample population
  const handleSelectSample = (sample: Partial<IPTrackerSearchParams>) => {
    soundFx.playClick();
    setSearchParams((prev) => ({
      ...prev,
      ...sample,
    }));
  };

  // Interactive Live Ping simulation
  const handleSimulatePing = (rec: IPTrackerRecord) => {
    soundFx.playRadioChirp();
    setIsPinging(true);
    setPingLogs([
      `INITIATING ICMP ECHO REQUEST TO ${rec.ipAddress} [${rec.hostname}]...`,
      `Resolved target ASN: ${rec.asn} (${rec.isp})`,
    ]);

    setTimeout(() => {
      setPingLogs((prev) => [
        ...prev,
        `64 bytes from ${rec.ipAddress}: icmp_seq=1 ttl=57 time=${rec.latencyMs.toFixed(1)} ms`,
      ]);
    }, 400);

    setTimeout(() => {
      setPingLogs((prev) => [
        ...prev,
        `64 bytes from ${rec.ipAddress}: icmp_seq=2 ttl=57 time=${(rec.latencyMs + 0.4).toFixed(1)} ms`,
      ]);
    }, 800);

    setTimeout(() => {
      setPingLogs((prev) => [
        ...prev,
        `64 bytes from ${rec.ipAddress}: icmp_seq=3 ttl=57 time=${(rec.latencyMs - 0.2).toFixed(1)} ms`,
      ]);
    }, 1200);

    setTimeout(() => {
      setPingLogs((prev) => [
        ...prev,
        `64 bytes from ${rec.ipAddress}: icmp_seq=4 ttl=57 time=${rec.latencyMs.toFixed(1)} ms`,
        `--- ${rec.ipAddress} ping statistics ---`,
        `4 packets transmitted, 4 received, 0% packet loss, mesh round-trip min/avg/max = ${(rec.latencyMs - 0.2).toFixed(1)}/${rec.latencyMs.toFixed(1)}/${(rec.latencyMs + 0.4).toFixed(1)} ms`,
        `STATUS: POSITIVE TELEMETRY CONFIRMED ON ${rec.coordinates.nearestSurveillanceNodeName}`,
      ]);
      setIsPinging(false);
      soundFx.playRadarPing();
    }, 1600);
  };

  const selectedOrFirst = selectedRecord || filteredRecords[0] || null;

  return (
    <div className="space-y-6 font-mono text-slate-200">
      {/* Top Banner & Header */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-700/60 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/60 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Network className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-400 font-bold tracking-wider">AEGIS INTELLIGENCE GRID</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-800 text-cyan-300 font-bold">
                MULTI-VECTOR DEMOGRAPHIC CORRELATION
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
              <span>IP ADDRESS TRACKER & LOCATOR</span>
              <span className="text-xs font-normal text-slate-400">
                [SEARCH BY NAME • DOB • CITY • VILLAGE • COUNTRY]
              </span>
            </h1>
          </div>
        </div>

        {/* Global Status Badges */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400 font-bold">GRID NODES:</span>
            <span className="text-emerald-400 font-bold">{records.length} ACTIVE IPS</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-bold">MATCHES:</span>
            <span className="text-cyan-300 font-bold">{filteredRecords.length} RECORD(S)</span>
          </div>
        </div>
      </div>

      {/* Main Search Panel: By Name, Date of Birth, City, Village, Country */}
      <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>DEMOGRAPHIC SEARCH QUERY MATRIX</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleResetSearch}
              className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* 5-Field Demographics Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. NAME FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. FULL NAME / ALIAS</span>
            </label>
            <div className="relative">
              <input
                id="search-name-input"
                type="text"
                value={searchParams.name}
                onChange={(e) => setSearchParams((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Elena, Tariq, Marcus..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono transition-all outline-none"
              />
              {searchParams.name && (
                <button
                  onClick={() => setSearchParams((prev) => ({ ...prev, name: '' }))}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500">First/last name or operative callsign</span>
          </div>

          {/* 2. DATE OF BIRTH FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. DATE OF BIRTH (DOB)</span>
            </label>
            <div className="relative">
              <input
                id="search-dob-input"
                type="text"
                value={searchParams.dateOfBirth}
                onChange={(e) => setSearchParams((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                placeholder="YYYY-MM-DD (e.g. 1994-06-14)"
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono transition-all outline-none"
              />
              {searchParams.dateOfBirth && (
                <button
                  onClick={() => setSearchParams((prev) => ({ ...prev, dateOfBirth: '' }))}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500">Exact date or birth year (e.g. 1994)</span>
          </div>

          {/* 3. CITY FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. CITY</span>
            </label>
            <div className="relative">
              <input
                id="search-city-input"
                type="text"
                value={searchParams.city}
                onChange={(e) => setSearchParams((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Amsterdam, Newark..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono transition-all outline-none"
              />
              {searchParams.city && (
                <button
                  onClick={() => setSearchParams((prev) => ({ ...prev, city: '' }))}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500">Metropolitan municipality</span>
          </div>

          {/* 4. VILLAGE / DISTRICT / SUBURB FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>4. VILLAGE / DISTRICT</span>
            </label>
            <div className="relative">
              <input
                id="search-village-input"
                type="text"
                value={searchParams.village}
                onChange={(e) => setSearchParams((prev) => ({ ...prev, village: e.target.value }))}
                placeholder="e.g. Nieuwmarkt, Jordaan, El Progreso..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono transition-all outline-none"
              />
              {searchParams.village && (
                <button
                  onClick={() => setSearchParams((prev) => ({ ...prev, village: '' }))}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500">Village, borough, or quarter name</span>
          </div>

          {/* 5. COUNTRY FIELD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>5. COUNTRY</span>
            </label>
            <div className="relative">
              <input
                id="search-country-input"
                type="text"
                value={searchParams.country}
                onChange={(e) => setSearchParams((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="e.g. Netherlands, United States..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono transition-all outline-none"
              />
              {searchParams.country && (
                <button
                  onClick={() => setSearchParams((prev) => ({ ...prev, country: '' }))}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500">Sovereign territory / nation state</span>
          </div>
        </div>

        {/* Secondary Direct IP Input & Preset Quick Chips */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold text-[11px]">QUICK PRESETS:</span>
            <button
              onClick={() =>
                handleSelectSample({
                  name: 'Elena',
                  dateOfBirth: '1994',
                  city: 'Amsterdam',
                  village: 'Nieuwmarkt',
                  country: 'Netherlands',
                })
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Elena (Nieuwmarkt, NL)</span>
            </button>
            <button
              onClick={() =>
                handleSelectSample({
                  name: 'Tariq',
                  dateOfBirth: '1982',
                  city: 'Amsterdam',
                  village: 'Museumkwartier',
                  country: 'Netherlands',
                })
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Dr. Tariq (Museumkwartier, NL)</span>
            </button>
            <button
              onClick={() =>
                handleSelectSample({
                  name: 'Lucas',
                  dateOfBirth: '1998',
                  city: 'Amsterdam',
                  village: 'Jordaan',
                  country: 'Netherlands',
                })
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Lucas (Jordaan, NL)</span>
            </button>
            <button
              onClick={() =>
                handleSelectSample({
                  name: 'Porky',
                  dateOfBirth: '1982',
                  city: 'San Pedro Sula',
                  village: 'El Progreso',
                  country: 'Honduras',
                })
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-red-800 text-red-300 text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>Porky (El Progreso, HN)</span>
            </button>
            <button
              onClick={() =>
                handleSelectSample({
                  name: 'Patel',
                  dateOfBirth: '1990',
                  city: 'Newark',
                  village: 'Hanover',
                  country: 'United States',
                })
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-amber-800 text-amber-300 text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Patel (Hanover, US)</span>
            </button>
            <button
              onClick={() =>
                handleSelectSample({
                  name: 'Castillo',
                  dateOfBirth: '1998',
                  city: 'Guadalajara',
                  village: 'Zapopan',
                  country: 'Mexico',
                })
              }
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-amber-800 text-amber-300 text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Castillo (Zapopan, MX)</span>
            </button>
          </div>

          {/* Direct IP input */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-bold">DIRECT IP:</span>
            <input
              type="text"
              value={searchParams.ipAddress || ''}
              onChange={(e) => setSearchParams((prev) => ({ ...prev, ipAddress: e.target.value }))}
              placeholder="e.g. 185.190.142.88"
              className="w-36 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Tactic Tag Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            <span>STATUS FILTER:</span>
          </span>

          {[
            { id: 'ALL', label: 'All Telemetry Nodes', count: records.length },
            { id: 'CRITICAL', label: 'Code Red / Critical', count: records.filter((r) => r.threatLevel === 'CRITICAL_CODE_RED').length },
            { id: 'VPN_TOR', label: 'VPN / Tor Exit Nodes', count: records.filter((r) => r.isVpnOrProxy || r.isTorExitNode).length },
            { id: 'ACTIVE', label: 'Active Live Stream', count: records.filter((r) => r.status === 'ACTIVE_TELEMETRY').length },
            { id: 'NETHERLANDS', label: 'Netherlands Sector', count: records.filter((r) => r.country === 'Netherlands').length },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                soundFx.playClick();
                setActiveFilterTag(tag.id);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterTag === tag.id
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tag.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeFilterTag === tag.id ? 'bg-cyan-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tag.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Side Record List | Right Side Detailed Dossier & Network Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filtered IP Record Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>DISCOVERED IP TELEMETRY ENDPOINTS ({filteredRecords.length})</span>
            <span className="text-[10px] text-slate-500">CLICK TO INSPECT DOSSIER</span>
          </div>

          <div className="space-y-3 max-h-[42rem] overflow-y-auto pr-1">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="font-bold text-white text-sm">No Matching IP Telemetry Records</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No network endpoints matched your demographic filter parameters (Name: "{searchParams.name}", DOB: "{searchParams.dateOfBirth}", City: "{searchParams.city}", Village: "{searchParams.village}", Country: "{searchParams.country}").
                </p>
                <button
                  onClick={handleResetSearch}
                  className="px-4 py-1.5 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-300 text-xs font-bold hover:bg-cyan-900 transition-all cursor-pointer"
                >
                  Clear All Search Parameters
                </button>
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const isSelected = selectedOrFirst?.id === rec.id;
                const isCritical = rec.threatLevel === 'CRITICAL_CODE_RED';
                const isHigh = rec.threatLevel === 'HIGH';

                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedRecord(rec);
                    }}
                    className={`p-4 rounded-xl border text-xs transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900/95 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Top line: IP address, Threat level badge, Copy */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono text-sm tracking-wide flex items-center gap-1.5">
                          <Network className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span>{rec.ipAddress}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyIP(rec.ipAddress);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700"
                          title="Copy IP Address"
                        >
                          {copiedIp === rec.ipAddress ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono ${
                            isCritical
                              ? 'bg-red-600 text-white animate-pulse'
                              : isHigh
                              ? 'bg-amber-600/30 text-amber-300 border border-amber-600/60'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {rec.threatLevel}
                        </span>
                      </div>
                    </div>

                    {/* Target Demographic Profile Information */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-300">{rec.fullName}</span>
                        <span className="text-[10px] text-slate-400">[{rec.alias}]</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>DOB: <strong className="text-slate-200">{rec.dateOfBirth}</strong> (Age {rec.age})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-500" />
                          <span>{rec.country}</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>
                            Village: <strong className="text-slate-200">{rec.villageOrDistrict}</strong> • City: <strong className="text-slate-200">{rec.city}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Network Details line */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Server className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[200px]">{rec.isp}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {rec.isVpnOrProxy && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-950 border border-purple-700 text-purple-300 font-bold">
                            VPN/PROXY
                          </span>
                        )}
                        {rec.isTorExitNode && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700 text-amber-300 font-bold">
                            TOR EXIT
                          </span>
                        )}
                        <span className="text-emerald-400 font-mono">{rec.latencyMs}ms</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Dossier & Live IP Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedOrFirst ? (
            <div className="p-5 rounded-xl bg-slate-950/95 border border-cyan-600/70 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-xs space-y-5">
              {/* Dossier Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cyan-400 font-bold">TARGET TELEMETRY DOSSIER</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-mono text-slate-400">ID: {selectedOrFirst.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        selectedOrFirst.threatLevel === 'CRITICAL_CODE_RED'
                          ? 'bg-red-600 text-white animate-pulse'
                          : selectedOrFirst.threatLevel === 'HIGH'
                          ? 'bg-amber-600/40 text-amber-300 border border-amber-500'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {selectedOrFirst.threatLevel}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white tracking-wide font-mono flex items-center gap-2">
                    <span>{selectedOrFirst.fullName}</span>
                    <span className="text-cyan-400 text-sm font-normal">[{selectedOrFirst.alias}]</span>
                  </h2>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onSelectTrackSubject(selectedOrFirst.subjectId);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-200 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Track in God's Eye</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playRadioChirp();
                      onDispatchPolice(selectedOrFirst.subjectId);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-600 text-red-200 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span>Dispatch Police CAD</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onRequestAIDossier(selectedOrFirst.subjectId);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Analysis</span>
                  </button>
                </div>
              </div>

              {/* IP Primary Badge Banner */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-600/70 text-cyan-300">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">ACTIVE INTERCEPT IPV4 ADDRESS</div>
                    <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
                      <span>{selectedOrFirst.ipAddress}</span>
                      <button
                        onClick={() => handleCopyIP(selectedOrFirst.ipAddress)}
                        className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIp === selectedOrFirst.ipAddress ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <button
                    onClick={() => handleSimulatePing(selectedOrFirst)}
                    disabled={isPinging}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 font-bold cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : 'text-emerald-400'}`} />
                    <span>{isPinging ? 'Pinging Node...' : 'Run ICMP Ping'}</span>
                  </button>
                </div>
              </div>

              {/* Demographic Profile Matrix Box (User Requested Fields Highlighted) */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>DEMOGRAPHIC IDENTIFIERS & RESIDENTIAL LOCALITY</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">FULL NAME:</span>
                    <span className="text-white font-bold">{selectedOrFirst.fullName}</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">DATE OF BIRTH (DOB):</span>
                    <span className="text-cyan-300 font-bold">{selectedOrFirst.dateOfBirth} (Age {selectedOrFirst.age})</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">COUNTRY:</span>
                    <span className="text-white font-bold">{selectedOrFirst.country}</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">CITY:</span>
                    <span className="text-white font-bold">{selectedOrFirst.city}</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">VILLAGE / DISTRICT / SUBURB:</span>
                    <span className="text-cyan-300 font-bold">{selectedOrFirst.villageOrDistrict}</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block font-bold">REGISTERED ADDRESS:</span>
                    <span className="text-slate-300 truncate block" title={selectedOrFirst.registeredAddress}>
                      {selectedOrFirst.registeredAddress || 'Sector Address On File'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Network Details | Traceroute Hops | Live Telemetry & Ports | Map Geolocation */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2">
                  {[
                    { id: 'details', label: 'Network & ISP Routing', icon: Server },
                    { id: 'traceroute', label: `Traceroute (${selectedOrFirst.routeHops.length} Hops)`, icon: Network },
                    { id: 'telemetry', label: 'Device & Ports', icon: Terminal },
                    { id: 'geolocate', label: 'Geo-Coordinates & Radar', icon: MapPin },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          soundFx.playClick();
                          setActiveTab(t.id as any);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-cyan-950 border border-cyan-500 text-cyan-200 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: Network & ISP Routing */}
                {activeTab === 'details' && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold">INTERNET SERVICE PROVIDER (ISP):</span>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono font-bold">
                          {selectedOrFirst.isp}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold">AUTONOMOUS SYSTEM NUMBER (ASN):</span>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono">
                          {selectedOrFirst.asn} • {selectedOrFirst.organization}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold">REVERSE DNS HOSTNAME:</span>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono truncate">
                          {selectedOrFirst.hostname}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold">CONNECTION MEDIUM:</span>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-300 font-mono flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{selectedOrFirst.connectionType}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold">VPN / PROXY CLASSIFICATION:</span>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          {selectedOrFirst.isVpnOrProxy ? (
                            <span className="text-purple-400 font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-purple-400" />
                              <span>ACTIVE ({selectedOrFirst.vpnService || 'Encrypted Gateway'})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Direct Residential / Business IP</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold">TOR ANONYMIZATION STATUS:</span>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800">
                          {selectedOrFirst.isTorExitNode ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>DETECTED TOR ONION EXIT RELAY</span>
                            </span>
                          ) : (
                            <span className="text-emerald-400">No Tor Exit Signatures</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Traceroute Hops */}
                {activeTab === 'traceroute' && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span className="font-bold text-white">ROUTE INTERCEPT HOPS (AEGIS GATEWAY → TARGET ENDPOINT)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">0% PACKET LOSS</span>
                    </div>

                    <div className="space-y-2">
                      {selectedOrFirst.routeHops.map((hop) => (
                        <div
                          key={hop.hop}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                              {hop.hop}
                            </span>
                            <div>
                              <div className="font-bold text-white">{hop.ip}</div>
                              <div className="text-[10px] text-slate-400">{hop.host}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-emerald-400 font-bold">{hop.latencyMs.toFixed(1)} ms</div>
                            <div className="text-[10px] text-slate-500">{hop.location}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: Device & Ports */}
                {activeTab === 'telemetry' && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                          <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                          <span>DEVICE HARDWARE & OS:</span>
                        </span>
                        <div className="text-white font-bold">{selectedOrFirst.deviceInfo.deviceType}</div>
                        <div className="text-[11px] text-slate-400 font-mono">OS: {selectedOrFirst.deviceInfo.os}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          User-Agent: {selectedOrFirst.deviceInfo.userAgent}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                          <span>OPEN NETWORK PORTS & MAC:</span>
                        </span>
                        <div className="text-slate-300 font-mono text-[11px]">
                          MAC: <strong className="text-white">{selectedOrFirst.associatedMacAddress}</strong>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedOrFirst.openPorts.map((port) => (
                            <span
                              key={port}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[10px] font-bold"
                            >
                              PORT {port}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recent IP Payload Log */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold">RECENT PACKET EXCHANGES ON THIS IP:</span>
                      <div className="space-y-1 text-[11px] font-mono">
                        {selectedOrFirst.recentActivity.map((act, i) => (
                          <div key={i} className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-1">
                            <span className="text-slate-300">{act.action} ({act.protocol})</span>
                            <span className="text-emerald-400">{(act.bytes / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Geo-Coordinates & Radar Pinpoint */}
                {activeTab === 'geolocate' && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold">PHYSICAL COORDINATES:</span>
                        <div className="text-white font-mono font-bold text-sm">
                          {selectedOrFirst.coordinates.lat.toFixed(6)}° N, {selectedOrFirst.coordinates.lng.toFixed(6)}° E
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Altitude: {selectedOrFirst.coordinates.altitudeMeters}m • Accuracy: ±{selectedOrFirst.coordinates.accuracyRadiusMeters}m
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold">SURVEILLANCE MESH ANCHOR:</span>
                        <div className="text-cyan-300 font-bold text-xs truncate">
                          {selectedOrFirst.coordinates.nearestSurveillanceNodeName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Mesh Cell ID: {selectedOrFirst.coordinates.meshCellId}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Tactical Radar Mini Map Canvas */}
                    <div className="relative h-48 rounded-lg bg-slate-950 border border-cyan-800/80 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/30 via-slate-950 to-slate-950" />
                      {/* Concentric Radar Rings */}
                      <div className="absolute w-40 h-40 rounded-full border border-cyan-500/20" />
                      <div className="absolute w-28 h-28 rounded-full border border-cyan-500/30" />
                      <div className="absolute w-14 h-14 rounded-full border border-cyan-500/40" />

                      {/* Radar Sweep Needle */}
                      <div className="absolute w-40 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/50 to-cyan-400 origin-center animate-spin" />

                      {/* Target Pinpoint Marker */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white animate-ping" />
                        <div className="mt-1 px-2 py-0.5 rounded bg-black/80 border border-cyan-500 text-[10px] font-mono font-bold text-white shadow">
                          {selectedOrFirst.ipAddress} [{selectedOrFirst.villageOrDistrict}]
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-2 text-[9px] text-slate-500 font-mono">
                        RADAR SENSOR: {selectedOrFirst.coordinates.nearestSurveillanceNodeName}
                      </div>
                      <div className="absolute top-2 right-2 text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>LIVE CARRIER LOCK</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ping Simulation Terminal Window if triggered */}
              {pingLogs.length > 0 && (
                <div className="p-3 rounded-lg bg-black border border-slate-800 text-[11px] font-mono text-emerald-400 space-y-1 max-h-36 overflow-y-auto">
                  <div className="text-[10px] text-slate-400 border-b border-slate-900 pb-1 flex items-center justify-between">
                    <span>ICMP PING TERMINAL OUTPUT</span>
                    <button
                      onClick={() => setPingLogs([])}
                      className="text-slate-500 hover:text-slate-300 text-[10px] cursor-pointer"
                    >
                      Clear Output
                    </button>
                  </div>
                  {pingLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
              <Eye className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="font-bold text-white">No Record Selected</div>
              <p className="text-xs text-slate-500">Select an IP record from the search list to inspect full demographic dossier and network telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
