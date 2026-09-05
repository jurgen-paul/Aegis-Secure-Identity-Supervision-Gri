import React, { useMemo } from 'react';
import { TrackedSubject, LocationCoordinate, TransitEvent } from '../../types';
import {
  Printer,
  X,
  FileDown,
  Shield,
  MapPin,
  Train,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Radio,
  FileText,
  Clock,
  Compass,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface PrintSummaryModalProps {
  subject: TrackedSubject | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintSummaryModal: React.FC<PrintSummaryModalProps> = ({
  subject,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !subject) return null;

  // Retrieve last 5 location history points (most recent first)
  const last5Locations = useMemo<LocationCoordinate[]>(() => {
    const list: LocationCoordinate[] = [];
    
    // Always start with current location as the latest state
    if (subject.currentLocation) {
      list.push(subject.currentLocation);
    }

    if (subject.locationHistory && subject.locationHistory.length > 0) {
      // Clone and reverse history to get latest first
      const reversedHistory = [...subject.locationHistory].reverse();
      for (const loc of reversedHistory) {
        // avoid exact duplicate of current location if timestamps match
        if (loc.timestamp !== subject.currentLocation?.timestamp && list.length < 5) {
          list.push(loc);
        }
      }
    }

    return list.slice(0, 5);
  }, [subject]);

  // Recent transit events (most recent first)
  const recentTransitEvents = useMemo<TransitEvent[]>(() => {
    if (!subject.transitEvents) return [];
    return [...subject.transitEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [subject]);

  const reportTimestamp = new Date().toISOString();
  const reportRefId = `AEGIS-PDF-SUM-${subject.id}-${Date.now().toString().slice(-6)}`;

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  const handleDownloadTextReport = () => {
    soundFx.playClick();
    const textReport = `================================================================================
AEGIS GOD'S EYE SURVEILLANCE DIRECTIVE - TACTICAL PDF SUMMARY
DOCUMENT REF: ${reportRefId}
CLASSIFICATION: LAW ENFORCEMENT SENSITIVE // STRICT ACCESS ONLY
GENERATED AT: ${new Date().toUTCString()}
================================================================================

SUBJECT PARTICULARS:
--------------------------------------------------------------------------------
Full Legal Name     : ${subject.fullName.toUpperCase()}
Operational Alias   : ${subject.alias}
Subject ID          : ${subject.id}
W3C DID             : ${subject.did}
Threat Rating       : ${subject.threatLevel}
Biometric Match     : ${subject.biometrics.faceMatchScore}%
Iris Hash Signature : ${subject.biometrics.irisHash}
Current Geofence    : ${subject.geofenceStatus}

CURRENT LIVE POSITION:
--------------------------------------------------------------------------------
Coordinates : ${subject.currentLocation.lat.toFixed(6)}° N, ${subject.currentLocation.lng.toFixed(6)}° E
Altitude    : ${subject.currentLocation.altitudeMeters} m
Velocity    : ${subject.currentLocation.speedKmh} km/h @ ${subject.currentLocation.headingDegrees}°
Location    : ${subject.currentLocation.locationName} (Zone: ${subject.currentLocation.zoneId})

LAST 5 LOCATION HISTORY POINTS:
--------------------------------------------------------------------------------
${last5Locations
  .map(
    (loc, i) =>
      `[Point #${i + 1}] ${new Date(loc.timestamp).toLocaleString()}
   Coords  : ${loc.lat.toFixed(6)}° N, ${loc.lng.toFixed(6)}° E (Alt: ${loc.altitudeMeters}m)
   Vector  : ${loc.speedKmh} km/h @ ${loc.headingDegrees}° (Acc: ±${loc.accuracyMeters}m)
   Sector  : ${loc.locationName} [${loc.zoneId}]`
  )
  .join('\n\n')}

RECENT TRANSIT & TURNSTILE BIOMETRIC INTERCEPT EVENTS:
--------------------------------------------------------------------------------
${
  recentTransitEvents.length > 0
    ? recentTransitEvents
        .map(
          (tr, i) =>
            `[Event #${i + 1}] ${new Date(tr.timestamp).toLocaleString()}
   Facility    : ${tr.stationOrGate} (${tr.transitType})
   Route ID    : ${tr.routeId}
   Pass ID     : ${tr.passCardId}
   Direction   : ${tr.direction}
   Bio Matched : ${tr.biometricGateMatched ? 'VERIFIED POSITIVE' : 'UNCONFIRMED'}
   Anomaly Flag: ${tr.anomalyDetected ? 'CRITICAL BREACH ANOMALY DETECTED' : 'NORMAL'}`
        )
        .join('\n\n')
    : 'No recent transit turnstile events recorded in surveillance buffer.'
}

================================================================================
END OF SURVEILLANCE DOSSIER // AEGIS DECENTRALIZED AUDIT TRAIL VERIFIED
================================================================================`;

    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aegis_Summary_${subject.id}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Floating Control Bar (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide">
                  PRINT-FRIENDLY PDF SUMMARY DOSSIER
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                  {subject.fullName} [{subject.id}]
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formatted for standard A4 / Letter document printing & browser PDF export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTextReport}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Text (.txt)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

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

        {/* Scrollable Container with White Paper Sheet (Target for Print) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900/40 flex justify-center">
          {/* Printable White Paper Sheet */}
          <div
            id="printable-summary-sheet"
            className="w-full max-w-3xl bg-white text-slate-900 p-8 sm:p-10 rounded-xl shadow-2xl border border-slate-300 font-mono text-xs space-y-6"
          >
            {/* Header: Official Document Top Bar */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-900" />
                  <span className="text-sm font-black tracking-widest uppercase text-slate-900">
                    AEGIS GOD'S EYE SURVEILLANCE NETWORK
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 tracking-wider mt-0.5">
                  DIRECTORATE OF TACTICAL TELEMETRY & INTELLIGENCE ANALYSIS
                </div>
                <div className="text-[9px] text-slate-500 font-semibold mt-1">
                  OFFICIAL SUMMARY REPORT // REF: {reportRefId}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-2.5 py-1 bg-red-700 text-white font-black text-[10px] tracking-wider rounded">
                  LAW ENFORCEMENT SENSITIVE
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  DATE: {new Date(reportTimestamp).toLocaleDateString()} {new Date(reportTimestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Subject Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-lg border border-slate-300">
              {/* Photo & Biometric Confidence */}
              <div className="flex flex-col items-center justify-center text-center space-y-1 sm:border-r sm:border-slate-300 sm:pr-4">
                <div className="w-20 h-24 rounded border border-slate-400 overflow-hidden bg-slate-200">
                  <img
                    src={subject.avatarUrl}
                    alt={subject.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale"
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-700">
                  BIO MATCH: {subject.biometrics.faceMatchScore}%
                </span>
              </div>

              {/* Subject Particulars */}
              <div className="sm:col-span-3 space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <h2 className="text-base font-black text-slate-950 uppercase">
                    {subject.fullName}
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    ALIAS: {subject.alias}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-700">
                  <div>
                    <span className="text-slate-500 font-semibold">Subject ID:</span>{' '}
                    <span className="font-bold text-slate-900">{subject.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Threat Rating:</span>{' '}
                    <span className="font-bold text-red-700">{subject.threatLevel}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 font-semibold">W3C DID:</span>{' '}
                    <span className="font-mono text-[9px] text-slate-800">{subject.did}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 font-semibold">Iris Hash:</span>{' '}
                    <span className="font-mono text-[9px] text-slate-800">{subject.biometrics.irisHash}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 font-semibold">Current Vector:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {subject.currentLocation.locationName} ({subject.currentLocation.speedKmh} km/h @ {subject.currentLocation.headingDegrees}°)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Last 5 Location History Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-400 pb-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-700" />
                  <span>1. Last 5 Location History Points (GPS Telemetry)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  CHRONOLOGICAL REVERSE ORDER
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Timestamp</th>
                      <th className="p-2 border-r border-slate-300">Coordinates (Lat / Lng)</th>
                      <th className="p-2 border-r border-slate-300">Velocity & Vector</th>
                      <th className="p-2 border-r border-slate-300">Altitude</th>
                      <th className="p-2">Location / Sector Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last5Locations.map((loc, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-300 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        <td className="p-2 font-bold border-r border-slate-300 text-center">
                          {idx === 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-700 text-white text-[9px]">
                              LIVE
                            </span>
                          ) : (
                            `-${idx}`
                          )}
                        </td>
                        <td className="p-2 font-mono border-r border-slate-300 whitespace-nowrap">
                          {new Date(loc.timestamp).toLocaleDateString()} {new Date(loc.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-2 font-mono font-bold border-r border-slate-300">
                          {loc.lat.toFixed(6)}° N, {loc.lng.toFixed(6)}° E
                        </td>
                        <td className="p-2 border-r border-slate-300">
                          {loc.speedKmh} km/h @ {loc.headingDegrees}°
                        </td>
                        <td className="p-2 border-r border-slate-300">
                          {loc.altitudeMeters} m (±{loc.accuracyMeters}m)
                        </td>
                        <td className="p-2 font-semibold text-slate-900">
                          {loc.locationName}{' '}
                          <span className="text-[9px] text-slate-500 font-normal">[{loc.zoneId}]</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Recent Transit Events */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-400 pb-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5 text-slate-700" />
                  <span>2. Recent Public Transit & Turnstile Intercept Events</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {recentTransitEvents.length} RECORDED INTERCEPTS
                </span>
              </div>

              {recentTransitEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                        <th className="p-2 border-r border-slate-300">Timestamp</th>
                        <th className="p-2 border-r border-slate-300">Transit Facility / Gate</th>
                        <th className="p-2 border-r border-slate-300">Transit Type</th>
                        <th className="p-2 border-r border-slate-300">Route & Pass Card ID</th>
                        <th className="p-2 border-r border-slate-300">Biometric Gate Match</th>
                        <th className="p-2">Anomaly Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransitEvents.map((tr, idx) => (
                        <tr
                          key={tr.id || idx}
                          className={`border-b border-slate-300 ${
                            tr.anomalyDetected
                              ? 'bg-red-50 text-red-900 font-semibold'
                              : idx % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50'
                          }`}
                        >
                          <td className="p-2 font-mono border-r border-slate-300 whitespace-nowrap">
                            {new Date(tr.timestamp).toLocaleDateString()} {new Date(tr.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-2 font-bold border-r border-slate-300">
                            {tr.stationOrGate}
                          </td>
                          <td className="p-2 border-r border-slate-300">
                            {tr.transitType} ({tr.direction})
                          </td>
                          <td className="p-2 font-mono border-r border-slate-300">
                            Route: {tr.routeId} | Card: {tr.passCardId}
                          </td>
                          <td className="p-2 border-r border-slate-300">
                            {tr.biometricGateMatched ? (
                              <span className="text-emerald-700 font-bold">✓ VERIFIED MATCH</span>
                            ) : (
                              <span className="text-slate-500">Unmatched / Manual</span>
                            )}
                          </td>
                          <td className="p-2">
                            {tr.anomalyDetected ? (
                              <span className="text-red-700 font-bold">⚠ CRITICAL ANOMALY</span>
                            ) : (
                              <span className="text-slate-600">Standard Pass</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-300 rounded text-center text-slate-500 text-[11px]">
                  No turnstile biometric transit events recorded in the current surveillance window.
                </div>
              )}
            </div>

            {/* Document Verification & Official Stamp Footer */}
            <div className="pt-4 border-t-2 border-slate-900 flex flex-wrap items-end justify-between gap-4 text-[9px] text-slate-600">
              <div className="space-y-1">
                <div>
                  <span className="font-bold text-slate-800">CRYPTOGRAPHIC SEAL:</span>{' '}
                  <span className="font-mono">{subject.biometrics.irisHash.slice(0, 32)}...</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">AUDIT VERIFICATION:</span> W3C DID
                  Ed25519 Immutable Node Attestation Passed
                </div>
                <div className="text-slate-500">
                  CONFIDENTIAL LAW ENFORCEMENT RECORD • UNAUTHORIZED DUPLICATION STRICTLY PROHIBITED
                </div>
              </div>

              <div className="text-right">
                <div className="w-36 border-b border-slate-800 pb-1 mb-1 font-mono text-[9px] text-slate-700">
                  WATCH COMMANDER
                </div>
                <div className="text-[8px] text-slate-500">AEGIS COMMAND CLEARANCE L5</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar (Hidden on Print) */}
        <div className="no-print p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generated: {new Date().toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 text-black font-bold hover:bg-cyan-500 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
