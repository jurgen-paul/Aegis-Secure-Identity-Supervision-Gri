import { LocationCoordinate, PoliceStation, ThreatDispatchPacket, DispatchPriority, DispatchChannel, ThreatLevel, TrackedSubject, ActiveAlertLog } from '../types';
import { POLICE_STATIONS } from './mockData';
import { sha256 } from './crypto';
import { soundFx } from './audio';

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Computes drive/tactical response ETA in minutes based on distance.
 */
export function calculateResponseEtaMinutes(distanceMeters: number, isPriority1: boolean = true): number {
  // Emergency vehicle response average speed in urban core: ~45 km/h (Priority 1) or ~30 km/h (Priority 2/3)
  const speedMetersPerMin = isPriority1 ? (45 * 1000) / 60 : (30 * 1000) / 60;
  const driveMinutes = distanceMeters / speedMetersPerMin;
  const turnoutTimeMinutes = 1.0; // Rapid response scramble time
  const total = Math.max(1, Math.round(driveMinutes + turnoutTimeMinutes));
  return total;
}

/**
 * Returns police stations enriched with distance and ETA from an incident point.
 */
export function getStationsRankedByProximity(
  location: LocationCoordinate,
  stations: PoliceStation[] = POLICE_STATIONS,
  isPriority1: boolean = true
): PoliceStation[] {
  return stations
    .map((station) => {
      const distanceMeters = calculateDistanceMeters(
        location.lat,
        location.lng,
        station.lat,
        station.lng
      );
      const etaMinutes = calculateResponseEtaMinutes(distanceMeters, isPriority1);
      return {
        ...station,
        distanceMeters,
        etaMinutes,
      };
    })
    .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
}

/**
 * Finds the single closest police station / response unit.
 */
export function findNearestPoliceStation(
  location: LocationCoordinate,
  stations: PoliceStation[] = POLICE_STATIONS
): PoliceStation {
  const ranked = getStationsRankedByProximity(location, stations);
  return ranked[0] || stations[0];
}

/**
 * Synthesizes an emergency APCO-10 tactical radio voice transmission using Web Speech API.
 */
export function speakTacticalRadio(transcript: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  soundFx.playRadioChirp();

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  setTimeout(() => {
    const cleanText = transcript
      .replace(/\[.*?\]/g, '')
      .replace(/10-(\d+)/g, 'ten $1')
      .replace(/%/g, ' percent')
      .replace(/Lat (\d+\.\d+), Lng (\d+\.\d+)/g, 'coordinates $1 North $2 East');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    // Pick crisp robotic or standard voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      soundFx.playRadioChirp();
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, 250);
}

export interface SendThreatDispatchArgs {
  subject: TrackedSubject;
  alert?: ActiveAlertLog;
  targetStation: PoliceStation;
  channel: DispatchChannel;
  priority: DispatchPriority;
  customDirectives?: string[];
  authorizedOfficerDid?: string;
}

/**
 * Sends the threat packet to the server dispatcher endpoint (or falls back gracefully).
 */
export async function sendThreatToDispatcher(
  args: SendThreatDispatchArgs
): Promise<ThreatDispatchPacket> {
  const {
    subject,
    alert,
    targetStation,
    channel,
    priority,
    customDirectives,
    authorizedOfficerDid = 'did:aegis:officer-hague-sec01',
  } = args;

  const defaultDirectives = [
    `Establish rapid perimeter containment at ${subject.currentLocation.locationName}`,
    `Lock down automated turnstiles & transit gates within 300m radius`,
    `Vector patrol cruisers to intercept heading ${subject.currentLocation.headingDegrees}°`,
    `Biometric optical confirmation threshold: ${subject.biometrics.faceMatchScore}%`,
  ];

  const payload = {
    subjectId: subject.id,
    subjectName: subject.fullName,
    subjectAlias: subject.alias,
    subjectDid: subject.did,
    nationalId: subject.nationalIdNumber,
    threatLevel: subject.threatLevel,
    location: subject.currentLocation,
    biometrics: subject.biometrics,
    alertTitle: alert?.title || `AUTOMATED EMERGENCY THREAT TRANSMISSION - ${subject.threatLevel}`,
    alertDetails: alert?.details || subject.notes,
    targetStationId: targetStation.id,
    targetStationName: targetStation.name,
    targetStationCallsign: targetStation.callsign,
    channel,
    priority,
    containmentDirectives: customDirectives && customDirectives.length > 0 ? customDirectives : defaultDirectives,
    authorizedOfficerDid,
  };

  try {
    const response = await fetch('/api/dispatch/send-threat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.packet) {
        return data.packet;
      }
    }
  } catch (err) {
    console.warn('Dispatch API transmission fallback:', err);
  }

  // Client-side secure fallback synthesis if offline
  const dispatchId = `CAD-DISP-${Date.now().toString().slice(-6)}`;
  const radioTranscript = `[CAD DISPATCH ALL UNITS - 10-33 EMERGENCY TRAFFIC]
TRANSMITTING TO: ${targetStation.name} [CALLSIGN: ${targetStation.callsign}]
PRIORITY: ${priority}
SUBJECT: ${subject.fullName} (ALIAS: ${subject.alias})
DID: ${subject.did}
LOCATION: ${subject.currentLocation.locationName} (LAT: ${subject.currentLocation.lat.toFixed(5)}, LNG: ${subject.currentLocation.lng.toFixed(5)})
VELOCITY: ${subject.currentLocation.speedKmh} KM/H HEADING ${subject.currentLocation.headingDegrees}°
BIOMETRIC CONFIDENCE: ${subject.biometrics.faceMatchScore}%
DIRECTIVE: DEPLOY CORDON INTERCEPT IMMEDIATELY.`;

  const rawString = `${dispatchId}|${subject.id}|${targetStation.id}|${Date.now()}`;
  const sha256Seal = await sha256(rawString);

  const fallbackPacket: ThreatDispatchPacket = {
    dispatchId,
    targetStationId: targetStation.id,
    targetStationName: targetStation.name,
    targetStationCallsign: targetStation.callsign,
    channel,
    priority,
    subjectId: subject.id,
    subjectName: subject.fullName,
    subjectAlias: subject.alias,
    subjectDid: subject.did,
    nationalId: subject.nationalIdNumber,
    threatLevel: subject.threatLevel,
    incidentLocation: subject.currentLocation,
    biometricMatchScore: subject.biometrics.faceMatchScore,
    cctvSector: subject.assignedSecureNodeId,
    tacticalRadioTranscript: radioTranscript,
    containmentDirectives: payload.containmentDirectives,
    authorizedOfficerDid,
    timestamp: new Date().toISOString(),
    status: 'UNITS_DISPATCHED',
    acknowledgedByOfficerCallsign: `${targetStation.callsign}-DISPATCH`,
    sha256Seal: `0x${sha256Seal}`,
    estimatedResponseTimeSeconds: (targetStation.etaMinutes || 2) * 60,
    assignedPatrolUnits: [
      `${targetStation.callsign}-PATROL-01`,
      `${targetStation.callsign}-RAPID-02`,
    ],
  };

  return fallbackPacket;
}
