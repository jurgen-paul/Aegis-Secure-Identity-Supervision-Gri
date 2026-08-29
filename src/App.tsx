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
} from './lib/mockData';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { TacticalMap } from './components/GodsEyeViewer/TacticalMap';
import { TargetProfileModal } from './components/GodsEyeViewer/TargetProfileModal';
import { RealTimeSurveillanceFeed } from './components/GodsEyeViewer/RealTimeSurveillanceFeed';
import { FinancialTransitStream } from './components/GodsEyeViewer/FinancialTransitStream';
import { ActiveAlertsPanel } from './components/GodsEyeViewer/ActiveAlertsPanel';
import { DIDKeyring } from './components/DecentralizedIdentity/DIDKeyring';
import { VerifiableCredentials } from './components/DecentralizedIdentity/VerifiableCredentials';
import { ZKPVerifier } from './components/DecentralizedIdentity/ZKPVerifier';
import { LiveEncryptedStream } from './components/E2EEncryption/LiveEncryptedStream';
import { MeshNodeStatus } from './components/E2EEncryption/MeshNodeStatus';
import { MerkleExplorer } from './components/AuditTrail/MerkleExplorer';
import { GoogleDocsExportModal } from './components/AuditTrail/GoogleDocsExportModal';
import { ContainmentControl } from './components/AlertProtocols/ContainmentControl';
import { GeminiThreatAnalyzer } from './components/AIIntelligence/GeminiThreatAnalyzer';
import { soundFx } from './lib/audio';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('gods-eye');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLockdownActive, setIsLockdownActive] = useState<boolean>(false);

  // Core Sovereign & Supervision Data State
  const [subjects, setSubjects] = useState<TrackedSubject[]>(INITIAL_TRACKED_SUBJECTS);
  const [nodes, setNodes] = useState<SurveillanceNode[]>(SURVEILLANCE_NODES);
  const [cctvFeeds, setCctvFeeds] = useState<CCTVCameraFeed[]>(CCTV_CAMERA_FEEDS);
  const [merkleBlocks, setMerkleBlocks] = useState<MerkleAuditBlock[]>(INITIAL_MERKLE_BLOCKS);
  const [sovereignDids, setSovereignDids] = useState<SovereignDID[]>(INITIAL_SOVEREIGN_DIDS);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>(INITIAL_CREDENTIALS);
  const [alertRules, setAlertRules] = useState<AutomatedAlertRule[]>(INITIAL_ALERT_RULES);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlertLog[]>(INITIAL_ACTIVE_ALERTS);

  // Modals & Selected Subject
  const [selectedSubject, setSelectedSubject] = useState<TrackedSubject | null>(null);
  const [isDocsExportOpen, setIsDocsExportOpen] = useState<boolean>(false);

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
      />

      {/* Navigation HUD */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertCount={activeAlerts.filter((a) => !a.isResolved).length}
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

            {/* Active Incident Containment Queue */}
            <ActiveAlertsPanel
              alerts={activeAlerts}
              subjects={subjects}
              onSelectSubject={(sub) => setSelectedSubject(sub)}
              onResolveAlert={handleResolveAlert}
            />
          </div>
        )}

        {/* VIEW 2: Decentralized Identity (DID) & W3C Keyring */}
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
            />
            <ActiveAlertsPanel
              alerts={activeAlerts}
              subjects={subjects}
              onSelectSubject={(sub) => setSelectedSubject(sub)}
              onResolveAlert={handleResolveAlert}
            />
          </div>
        )}

        {/* VIEW 6: AI Threat Assessment */}
        {activeTab === 'ai-intel' && (
          <div className="space-y-6 animate-fadeIn">
            <GeminiThreatAnalyzer
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSelectSubject={(sub) => setSelectedSubject(sub)}
              onOpenDocsExport={() => setIsDocsExportOpen(true)}
            />
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
          onExportToDocs={(sub) => {
            setIsDocsExportOpen(true);
          }}
          onRequestAIAssessment={(sub) => {
            setSelectedSubject(sub);
            setActiveTab('ai-intel');
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
    </div>
  );
}
