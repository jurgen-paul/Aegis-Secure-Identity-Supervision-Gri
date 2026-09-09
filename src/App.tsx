import React, { useState, useEffect } from 'react';
import {
  TrackedSubject,
  SurveillanceNode,
  CCTVCameraFeed,
  MerkleAuditBlock,
  SovereignDID,
  VerifiableCredential,
  AutomatedAlertRule,
  ActiveAlertLog,
  ThreatDispatchPacket,
  MostWantedFugitive,
  IPTrackerRecord,
} from './types';
import {
  INITIAL_TRACKED_SUBJECTS,
  SURVEILLANCE_NODES,
  CCTV_CAMERA_FEEDS,
  INITIAL_MERKLE_BLOCKS,
  INITIAL_SOVEREIGN_DIDS,
  INITIAL_CREDENTIALS,
  INITIAL_ALERT_RULES,
  INITIAL_ACTIVE_ALERTS,
  POLICE_STATIONS,
  INITIAL_DISPATCH_HISTORY,
  MOST_WANTED_LIST,
  INITIAL_IP_TRACKER_RECORDS,
} from './lib/mockData';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { TacticalMap } from './components/GodsEyeViewer/TacticalMap';
import { TargetProfileModal } from './components/GodsEyeViewer/TargetProfileModal';
import { RealTimeSurveillanceFeed } from './components/GodsEyeViewer/RealTimeSurveillanceFeed';
import { FinancialTransitStream } from './components/GodsEyeViewer/FinancialTransitStream';
import { ActiveAlertsPanel } from './components/GodsEyeViewer/ActiveAlertsPanel';
import { EmergencyDispatchModal } from './components/Dispatch/EmergencyDispatchModal';
import { MostWantedList } from './components/MostWanted/MostWantedList';
import { IPAddressTracker } from './components/IPTracker/IPAddressTracker';
import { DIDKeyring } from './components/DecentralizedIdentity/DIDKeyring';
import { VerifiableCredentials } from './components/DecentralizedIdentity/VerifiableCredentials';
import { ZKPVerifier } from './components/DecentralizedIdentity/ZKPVerifier';
import { LiveEncryptedStream } from './components/E2EEncryption/LiveEncryptedStream';
import { MeshNodeStatus } from './components/E2EEncryption/MeshNodeStatus';
import { MerkleExplorer } from './components/AuditTrail/MerkleExplorer';
import { GoogleDocsExportModal } from './components/AuditTrail/GoogleDocsExportModal';
import { ContainmentControl } from './components/AlertProtocols/ContainmentControl';
import { GeminiThreatAnalyzer } from './components/AIIntelligence/GeminiThreatAnalyzer';
import { BiometricActivityLog } from './components/AIIntelligence/BiometricActivityLog';
import { GoogleTasksManager } from './components/GoogleTasks/GoogleTasksManager';
import { SecurityChatbot } from './components/SecurityBot/SecurityChatbot';
import { OpenSSFAssurancePortal } from './components/OpenSSFCompliance/OpenSSFAssurancePortal';
import { soundFx } from './lib/audio';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('gods-eye');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLockdownActive, setIsLockdownActive] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [pendingAlertForFeedback, setPendingAlertForFeedback] = useState<ActiveAlertLog | null>(null);

  // Core Sovereign & Supervision Data State
  const [subjects, setSubjects] = useState<TrackedSubject[]>(INITIAL_TRACKED_SUBJECTS);
  const [nodes, setNodes] = useState<SurveillanceNode[]>(SURVEILLANCE_NODES);
  const [cctvFeeds, setCctvFeeds] = useState<CCTVCameraFeed[]>(CCTV_CAMERA_FEEDS);
  const [merkleBlocks, setMerkleBlocks] = useState<MerkleAuditBlock[]>(INITIAL_MERKLE_BLOCKS);
  const [sovereignDids, setSovereignDids] = useState<SovereignDID[]>(INITIAL_SOVEREIGN_DIDS);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>(INITIAL_CREDENTIALS);
  const [alertRules, setAlertRules] = useState<AutomatedAlertRule[]>(INITIAL_ALERT_RULES);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlertLog[]>(INITIAL_ACTIVE_ALERTS);
  const [dispatchHistory, setDispatchHistory] = useState<ThreatDispatchPacket[]>(INITIAL_DISPATCH_HISTORY);
  const [fugitives, setFugitives] = useState<MostWantedFugitive[]>(MOST_WANTED_LIST);
  const [ipRecords, setIpRecords] = useState<IPTrackerRecord[]>(INITIAL_IP_TRACKER_RECORDS);

  // Modals & Selected Subject
  const [selectedSubject, setSelectedSubject] = useState<TrackedSubject | null>(null);
  const [isDocsExportOpen, setIsDocsExportOpen] = useState<boolean>(false);
  const [dispatchModalTarget, setDispatchModalTarget] = useState<{
    subject: TrackedSubject;
    alert?: ActiveAlertLog;
  } | null>(null);

  // Helper: Get or Synthesize TrackedSubject from Fugitive
  const getSubjectForFugitive = (fugitive: MostWantedFugitive): TrackedSubject => {
    const existing = subjects.find(
      (s) => s.id === fugitive.correlatedTrackedSubjectId || s.fullName.toLowerCase() === fugitive.fullName.toLowerCase()
    );
    if (existing) return existing;

    const newSub: TrackedSubject = {
      id: fugitive.id,
      fullName: fugitive.fullName,
      alias: fugitive.alias,
      did: `did:aegis:${fugitive.id.toLowerCase()}`,
      avatarUrl: fugitive.avatarUrl,
      nationalIdNumber: fugitive.fbiCaseId || fugitive.interpolNoticeNumber || fugitive.mi6Reference || 'WARRANT-INT-99',
      threatLevel: 'CRITICAL_CODE_RED',
      geofenceStatus: 'BREACH_DETECTED',
      currentLocation: {
        lat: fugitive.lastKnownLocation.lat,
        lng: fugitive.lastKnownLocation.lng,
        altitudeMeters: 12.0,
        accuracyMeters: 2.1,
        headingDegrees: 120,
        speedKmh: 35.0,
        locationName: `${fugitive.lastKnownLocation.city} (${fugitive.lastKnownLocation.sectorNote})`,
        zoneId: 'ZONE_WARRANT_INTERCEPT',
        timestamp: new Date().toISOString(),
      },
      locationHistory: [
        {
          lat: fugitive.lastKnownLocation.lat - 0.002,
          lng: fugitive.lastKnownLocation.lng - 0.002,
          altitudeMeters: 10.0,
          accuracyMeters: 3.5,
          headingDegrees: 90,
          speedKmh: 28.0,
          locationName: `${fugitive.lastKnownLocation.city} Ingress Corridor`,
          zoneId: 'ZONE_WARRANT_INTERCEPT',
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
        {
          lat: fugitive.lastKnownLocation.lat,
          lng: fugitive.lastKnownLocation.lng,
          altitudeMeters: 12.0,
          accuracyMeters: 2.1,
          headingDegrees: 120,
          speedKmh: 35.0,
          locationName: `${fugitive.lastKnownLocation.city} (${fugitive.lastKnownLocation.sectorNote})`,
          zoneId: 'ZONE_WARRANT_INTERCEPT',
          timestamp: new Date().toISOString(),
        },
      ],
      bankcardTransactions: [
        {
          id: `TX-FUG-${Date.now().toString().slice(-4)}`,
          cardMask: '•••• 7719',
          network: 'SWIFT_INTERCEPT',
          merchant: `${fugitive.syndicate.split('/')[0]} Anonymous Wire`,
          amount: 50000.0,
          currency: 'USD',
          terminalId: 'POS-SHADOW-NODE-99',
          lat: fugitive.lastKnownLocation.lat,
          lng: fugitive.lastKnownLocation.lng,
          timestamp: new Date(Date.now() - 120000).toISOString(),
          isFlagged: true,
          flagReason: 'Warrant subject illicit asset transaction flag',
          authMethod: 'REMOTE_TOKEN',
        },
      ],
      transitEvents: [
        {
          id: `TR-FUG-${Date.now().toString().slice(-4)}`,
          transitType: 'AIRPORT_GATE',
          stationOrGate: `${fugitive.lastKnownLocation.city} Charter Gate 4`,
          routeId: 'FLIGHT-SHADOW-CHARTER',
          passCardId: 'PASS-COUNTERFEIT-DIP-01',
          lat: fugitive.lastKnownLocation.lat,
          lng: fugitive.lastKnownLocation.lng,
          timestamp: new Date(Date.now() - 180000).toISOString(),
          direction: 'ENTRY',
          biometricGateMatched: true,
          anomalyDetected: true,
        },
      ],
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

    setSubjects((prev) => [newSub, ...prev.filter((p) => p.id !== newSub.id)]);
    return newSub;
  };

  // Real-time telemetry simulation loop (slow subtle position updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setSubjects((prevSubjects) =>
        prevSubjects.map((sub) => {
          if (sub.threatLevel === 'CRITICAL_CODE_RED') {
            // Slight jitter / drift along transit line
            const latDelta = (Math.random() - 0.48) * 0.0003;
            const lngDelta = (Math.random() - 0.48) * 0.0003;
            const newLat = sub.currentLocation.lat + latDelta;
            const newLng = sub.currentLocation.lng + lngDelta;

            const updatedHistory = [
              ...sub.locationHistory.slice(-5),
              {
                ...sub.currentLocation,
                lat: newLat,
                lng: newLng,
                timestamp: new Date().toISOString(),
              },
            ];

            return {
              ...sub,
              currentLocation: {
                ...sub.currentLocation,
                lat: newLat,
                lng: newLng,
                timestamp: new Date().toISOString(),
              },
              locationHistory: updatedHistory,
            };
          }
          return sub;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handler: Simulate Geofence Breach Scenario
  const handleSimulateBreach = () => {
    soundFx.playAlarm();
    setIsLockdownActive(true);

    const breachTarget = subjects[0];
    const newAlert: ActiveAlertLog = {
      id: `ALT-${Date.now().toString().slice(-6)}`,
      ruleId: 'RULE-01-GEOFENCE',
      title: 'CRITICAL GEOFENCE BREACH // CODE RED CONTAINMENT ENGAGED',
      subjectName: breachTarget.fullName,
      subjectId: breachTarget.id,
      severity: 'CRITICAL_CODE_RED',
      timestamp: new Date().toISOString(),
      locationDetails: 'Sector 1A Rail Corridor Crossing Point (Platform 15B)',
      details: 'Optical camera array registered unauthorized perimeter departure into international transit sector.',
      actionTaken: 'Autonomous orbital lock engaged; nodes signaled for containment.',
      isResolved: false,
    };

    setActiveAlerts((prev) => [newAlert, ...prev]);
    setPendingAlertForFeedback(newAlert);
    setIsChatbotOpen(true);

    // Append to immutable Merkle Audit Trail
    const newBlock: MerkleAuditBlock = {
      blockHeight: merkleBlocks[0].blockHeight + 1,
      hash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
      previousHash: merkleBlocks[0].hash,
      merkleRoot: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
      action: 'AUTONOMOUS_CONTAINMENT_DISPATCHED',
      subjectDid: breachTarget.did,
      actorNodeId: 'NODE-RELAY-01-AMS',
      payloadSummary: 'Geofence breach alert triggered automated lock on Platform 15B transit nodes',
      timestamp: new Date().toISOString(),
      signature: `0xed25519:${Math.random().toString(36).substring(2, 18)}`,
      status: 'VERIFIED_ON_CHAIN',
    };

    setMerkleBlocks((prev) => [newBlock, ...prev]);
    setSelectedSubject(breachTarget);
  };

  // Handler: Toggle Global Lockdown
  const handleToggleLockdown = () => {
    soundFx.playAlarm();
    setIsLockdownActive(!isLockdownActive);
  };

  // Handler: Resolve Alert
  const handleResolveAlert = (alertId: string) => {
    soundFx.playClick();
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isResolved: true } : a))
    );
  };

  // Handler: Add Sovereign DID
  const handleAddDID = (newDID: SovereignDID) => {
    setSovereignDids((prev) => [newDID, ...prev]);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // Handler: Open Emergency Dispatch Modal
  const handleOpenDispatchModal = (subject: TrackedSubject, alert?: ActiveAlertLog) => {
    soundFx.playRadioChirp();
    setDispatchModalTarget({ subject, alert });
  };

  // Handler: On Police Dispatch Complete (from Modal or Quick Simulation in ActiveAlertsPanel)
  const handleDispatchComplete = (packet: ThreatDispatchPacket, alert?: ActiveAlertLog) => {
    soundFx.playDispatchSent();
    setDispatchHistory((prev) => [packet, ...prev]);

    // Update alert status if tied to an alert
    if (alert) {
      setActiveAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id
            ? {
                ...a,
                dispatchedToStationId: packet.targetStationId,
                dispatchId: packet.dispatchId,
                actionTaken: `Rapid response dispatched to ${packet.targetStationName} CAD Terminal. Scrambled units: ${packet.assignedPatrolUnits.join(', ')}.`,
              }
            : a
        )
      );
    }

    // Append cryptographic dispatch record to Merkle Audit DAG
    const newBlock: MerkleAuditBlock = {
      blockHeight: merkleBlocks[0].blockHeight + 1,
      hash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
      previousHash: merkleBlocks[0].hash,
      merkleRoot: packet.sha256Seal,
      action: 'AUTONOMOUS_POLICE_DISPATCH_TRANSMITTED',
      subjectDid: packet.subjectDid,
      actorNodeId: 'DISPATCH-CAD-AMS-RELAY',
      payloadSummary: `Transmitted CAD P1 Emergency Broadcast for ${packet.subjectName} to ${packet.targetStationName} (${packet.channel})`,
      timestamp: packet.timestamp,
      signature: packet.sha256Seal,
      status: 'VERIFIED_ON_CHAIN',
    };

    setMerkleBlocks((prev) => [newBlock, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        systemMode={isLockdownActive ? 'LOCKDOWN' : 'ONLINE'}
        activeThreatCount={activeAlerts.filter((a) => !a.isResolved).length}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onOpenDocsExport={() => setIsDocsExportOpen(true)}
        onSimulateBreach={handleSimulateBreach}
        onToggleLockdown={handleToggleLockdown}
        isLockdownActive={isLockdownActive}
        onOpenTasks={() => setActiveTab('google-tasks')}
        onToggleChatbot={() => setIsChatbotOpen(!isChatbotOpen)}
        isChatbotOpen={isChatbotOpen}
        onOpenAssurance={() => setActiveTab('security-assurance')}
      />

      {/* Navigation HUD */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertCount={activeAlerts.filter((a) => !a.isResolved).length}
        fugitiveCount={fugitives.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* VIEW 1: God's Eye Supervision Viewer */}
        {activeTab === 'gods-eye' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Interactive Radar Tactical Map */}
            <TacticalMap
              subjects={subjects}
              nodes={nodes}
              cctvFeeds={cctvFeeds}
              selectedSubject={selectedSubject}
              onSelectSubject={(sub) => setSelectedSubject(sub)}
              isLockdownActive={isLockdownActive}
              policeStations={POLICE_STATIONS}
              onDispatchToPolice={(sub) => handleOpenDispatchModal(sub)}
              alerts={activeAlerts}
            />

            {/* Split Grid: Live CCTV Feed & Bankcard/Transit Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeSurveillanceFeed
                feeds={cctvFeeds}
                subjects={subjects}
                onSelectSubject={(sub) => setSelectedSubject(sub)}
              />

              <FinancialTransitStream
                subjects={subjects}
                onSelectSubject={(sub) => setSelectedSubject(sub)}
              />
            </div>

            {/* Active Incident Containment Queue & Rapid Law Enforcement Dispatch */}
            <ActiveAlertsPanel
              alerts={activeAlerts}
              subjects={subjects}
              onSelectSubject={(sub) => setSelectedSubject(sub)}
              onResolveAlert={handleResolveAlert}
              onDispatchAlert={(sub, alt) => handleOpenDispatchModal(sub, alt)}
              onDispatchComplete={(packet, alt) => handleDispatchComplete(packet, alt)}
              onRequestAlertFeedback={(alt) => {
                setPendingAlertForFeedback(alt);
                setIsChatbotOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW: IP Address Tracker (Search by Name, DOB, City, Village, Country) */}
        {activeTab === 'ip-tracker' && (
          <div className="space-y-6 animate-fadeIn">
            <IPAddressTracker
              records={ipRecords}
              subjects={subjects}
              onSelectTrackSubject={(subjectId) => {
                const targetSub = subjects.find((s) => s.id === subjectId) || subjects[0];
                setSelectedSubject(targetSub);
                setActiveTab('gods-eye');
              }}
              onDispatchPolice={(subjectId) => {
                const targetSub = subjects.find((s) => s.id === subjectId) || subjects[0];
                handleOpenDispatchModal(targetSub);
              }}
              onRequestAIDossier={(subjectId) => {
                const targetSub = subjects.find((s) => s.id === subjectId) || subjects[0];
                setSelectedSubject(targetSub);
                setActiveTab('ai-intel');
              }}
            />
          </div>
        )}

        {/* VIEW 2: Global Most Wanted Fugitives List (FBI, Interpol, MI6, Europol) */}
        {activeTab === 'most-wanted' && (
          <div className="space-y-6 animate-fadeIn">
            <MostWantedList
              fugitives={fugitives}
              subjects={subjects}
              onSelectTrackSubject={(sub) => {
                const targetSub = subjects.find((s) => s.id === sub.id) || sub;
                setSelectedSubject(targetSub);
                setActiveTab('gods-eye');
              }}
              onDispatchFugitive={(fugitive) => {
                const targetSub = getSubjectForFugitive(fugitive);
                handleOpenDispatchModal(targetSub);
              }}
              onRequestAIDossier={(fugitive) => {
                const targetSub = getSubjectForFugitive(fugitive);
                setSelectedSubject(targetSub);
                setActiveTab('ai-intel');
              }}
            />
          </div>
        )}

        {/* VIEW 3: Decentralized Identity (DID) & W3C Keyring */}
        {activeTab === 'did-vault' && (
          <div className="space-y-6 animate-fadeIn">
            <DIDKeyring dids={sovereignDids} onAddDID={handleAddDID} />
            <VerifiableCredentials
              credentials={credentials}
              onAddCredential={(c) => setCredentials((prev) => [c, ...prev])}
            />
            <ZKPVerifier />
          </div>
        )}

        {/* VIEW 3: End-to-End Encryption & Secure Nodes */}
        {activeTab === 'e2ee-mesh' && (
          <div className="space-y-6 animate-fadeIn">
            <LiveEncryptedStream />
            <MeshNodeStatus nodes={nodes} />
          </div>
        )}

        {/* VIEW 4: Immutable Merkle Audit Trail */}
        {activeTab === 'audit-dag' && (
          <div className="space-y-6 animate-fadeIn">
            <MerkleExplorer
              blocks={merkleBlocks}
              onOpenDocsExport={() => setIsDocsExportOpen(true)}
            />
          </div>
        )}

        {/* VIEW 5: Automated Alert Protocols */}
        {activeTab === 'containment' && (
          <div className="space-y-6 animate-fadeIn">
            <ContainmentControl
              rules={alertRules}
              alerts={activeAlerts}
              subjects={subjects}
              isLockdownActive={isLockdownActive}
              onToggleLockdown={handleToggleLockdown}
              onSimulateBreach={handleSimulateBreach}
              onRequestAlertFeedback={(alt) => {
                setPendingAlertForFeedback(alt);
                setIsChatbotOpen(true);
              }}
            />
            <ActiveAlertsPanel
              alerts={activeAlerts}
              subjects={subjects}
              onSelectSubject={(sub) => setSelectedSubject(sub)}
              onResolveAlert={handleResolveAlert}
              onDispatchAlert={(sub, alt) => handleOpenDispatchModal(sub, alt)}
              onDispatchComplete={(packet, alt) => handleDispatchComplete(packet, alt)}
              onRequestAlertFeedback={(alt) => {
                setPendingAlertForFeedback(alt);
                setIsChatbotOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 6: AI Threat Assessment & Biometrics */}
        {activeTab === 'ai-intel' && (
          <div className="space-y-6 animate-fadeIn">
            <GeminiThreatAnalyzer
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSelectSubject={(sub) => setSelectedSubject(sub)}
              onOpenDocsExport={() => setIsDocsExportOpen(true)}
            />
            <BiometricActivityLog
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSelectSubject={(sub) => setSelectedSubject(sub)}
            />
          </div>
        )}

        {/* VIEW 7: Google Tasks Tactical Directives Manager */}
        {activeTab === 'google-tasks' && (
          <div className="space-y-6 animate-fadeIn">
            <GoogleTasksManager
              subjects={subjects}
              activeAlerts={activeAlerts}
              onDispatchPolice={(sub, alt) => handleOpenDispatchModal(sub, alt)}
              onFocusSubject={(sub) => {
                setSelectedSubject(sub);
                setActiveTab('gods-eye');
              }}
            />
          </div>
        )}

        {/* VIEW 8: OpenSSF Security Assurance & Best Practices Portal */}
        {activeTab === 'security-assurance' && (
          <div className="space-y-6 animate-fadeIn">
            <OpenSSFAssurancePortal />
          </div>
        )}
      </main>

      {/* Target Profile 360-Degree Modal */}
      {selectedSubject && (
        <TargetProfileModal
          subject={selectedSubject}
          onClose={() => setSelectedSubject(null)}
          onDispatchContainment={(sub) => {
            handleSimulateBreach();
          }}
          onDispatchToPolice={(sub) => {
            handleOpenDispatchModal(sub);
          }}
          onExportToDocs={(sub) => {
            setIsDocsExportOpen(true);
          }}
          onRequestAIAssessment={(sub) => {
            setSelectedSubject(sub);
            setActiveTab('ai-intel');
          }}
        />
      )}

      {/* Emergency Law Enforcement CAD Dispatch Modal */}
      {dispatchModalTarget && (
        <EmergencyDispatchModal
          isOpen={true}
          onClose={() => setDispatchModalTarget(null)}
          subject={dispatchModalTarget.subject}
          alert={dispatchModalTarget.alert}
          policeStations={POLICE_STATIONS}
          dispatchHistory={dispatchHistory}
          onDispatchSuccess={(packet) => {
            handleDispatchComplete(packet, dispatchModalTarget.alert);
          }}
          onDispatchSent={(packet) => {
            handleDispatchComplete(packet, dispatchModalTarget.alert);
          }}
        />
      )}

      {/* Google Docs Export Modal */}
      <GoogleDocsExportModal
        isOpen={isDocsExportOpen}
        onClose={() => setIsDocsExportOpen(false)}
        subjects={subjects}
        blocks={merkleBlocks}
        alerts={activeAlerts}
      />

      {/* Security AI Chatbot with Voice Talkback & Alert Feedback */}
      <SecurityChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        isLockdownActive={isLockdownActive}
        onToggleLockdown={handleToggleLockdown}
        subjects={subjects}
        activeAlerts={activeAlerts}
        onSelectSubject={(sub) => {
          setSelectedSubject(sub);
          setActiveTab('gods-eye');
        }}
        onOpenTasks={() => {
          setActiveTab('google-tasks');
        }}
        onOpenCadDispatch={(sub, alt) => {
          handleOpenDispatchModal(sub, alt);
        }}
        pendingAlertForFeedback={pendingAlertForFeedback}
        onClearPendingAlertFeedback={() => setPendingAlertForFeedback(null)}
      />
    </div>
  );
}
