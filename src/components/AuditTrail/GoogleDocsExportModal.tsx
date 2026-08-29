import React, { useState } from 'react';
import { TrackedSubject, MerkleAuditBlock, ActiveAlertLog } from '../../types';
import { ExportReportData, createGoogleDocWithAudit, downloadMarkdownDossier } from '../../lib/googleDocs';
import { FileText, X, CheckCircle2, ExternalLink, Download, Lock, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { soundFx } from '../../lib/audio';

interface GoogleDocsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: TrackedSubject[];
  blocks: MerkleAuditBlock[];
  alerts: ActiveAlertLog[];
}

export const GoogleDocsExportModal: React.FC<GoogleDocsExportModalProps> = ({
  isOpen,
  onClose,
  subjects,
  blocks,
  alerts,
}) => {
  const [reportTitle, setReportTitle] = useState('AEGIS-EYE // Official Cryptographic Audit & Supervision Dossier');
  const [officerDid, setOfficerDid] = useState('did:aegis:commander-vault-01');
  const [isExporting, setIsExporting] = useState(false);
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string>('');

  if (!isOpen) return null;

  const reportData: ExportReportData = {
    title: reportTitle,
    reportId: `RPT-AEGIS-${Date.now().toString().slice(-8)}`,
    generatedAt: new Date().toISOString(),
    officerDid: officerDid,
    securityClearance: 'TOP SECRET // PROTOCOL-9',
    merkleRoot: blocks[0]?.merkleRoot || '0x99201fba4410928be819234acb10928340192834bca81920394810293847192a',
    blockHeight: blocks[0]?.blockHeight || 14082,
    threatAssessment: `AUTONOMOUS AI CORRELATION SUMMARY: Multi-vector supervision grid has identified geofence anomalies in Sector 1A Rail Corridor. Optical face neural landmarks scored 99.4% confidence match against Interpol Red Notice Registry. End-to-end encrypted packet stream validated across 18 mesh relays with zero tamper events.`,
    trackedSubjectsSummary: subjects.map((s) => ({
      name: `${s.fullName} (${s.alias})`,
      did: s.did,
      threatLevel: s.threatLevel,
      lastLocation: s.currentLocation.locationName,
      biometricScore: s.biometrics.faceMatchScore,
      flaggedTransactions: s.bankcardTransactions.filter((t) => t.isFlagged).length,
      transitSightings: s.transitEvents.length,
    })),
    recentAuditBlocks: blocks.slice(0, 5).map((b) => ({
      blockHeight: b.blockHeight,
      hash: b.hash,
      action: b.action,
      actorNode: b.actorNodeId,
      timestamp: b.timestamp,
    })),
    activeAlerts: alerts.filter((a) => !a.isResolved).map((a) => ({
      title: a.title,
      severity: a.severity,
      location: a.locationDetails,
      timestamp: a.timestamp,
    })),
  };

  const handleExportGoogleDoc = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    soundFx.playClick();

    try {
      // If token is provided or available from OAuth setup
      if (googleAccessToken.trim()) {
        const result = await createGoogleDocWithAudit(googleAccessToken.trim(), reportData);
        setCreatedDocUrl(result.docUrl);
        soundFx.playDecrypt();
      } else {
        // Fallback: Generate local verified dossier and notify token usage
        downloadMarkdownDossier(reportData);
        setCreatedDocUrl('LOCAL_DOWNLOAD_SUCCESS');
        soundFx.playDecrypt();
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMessage(err.message || 'Failed to create Google Doc. Please check your token or download locally.');
      // Auto-fallback to local download
      downloadMarkdownDossier(reportData);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadLocal = () => {
    soundFx.playClick();
    downloadMarkdownDossier(reportData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-blue-600/70 rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.3)] text-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/50">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                EXPORT AUDIT DOSSIER TO GOOGLE DOCS
              </h3>
              <p className="text-xs text-slate-400">
                Official Cryptographic Proof & God's Eye Supervision Brief
              </p>
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Authorizing Officer DID</label>
              <input
                type="text"
                value={officerDid}
                onChange={(e) => setOfficerDid(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Merkle Root Seal</label>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-cyan-300 truncate">
                {reportData.merkleRoot}
              </div>
            </div>
          </div>

          {/* Google Access Token Input (Optional for direct REST API calls) */}
          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">
              Google Workspace Access Token (Optional — Leave blank for instant sovereign file export)
            </label>
            <input
              type="password"
              value={googleAccessToken}
              onChange={(e) => setGoogleAccessToken(e.target.value)}
              placeholder="ya29.a0AfH6SM..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Dossier Preview Summary */}
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
            <div className="text-cyan-400 font-bold">DOSSIER PAYLOAD INCLUDES:</div>
            <div>• Full Merkle Root Hash & Block #{reportData.blockHeight} Verification Seal</div>
            <div>• {subjects.length} Supervised Target Profiles (Biometrics, Bankcard Swipes, Transit Tap-ins)</div>
            <div>• Real-Time Geofence Unauthorized Movement Incidents ({reportData.activeAlerts.length} Active)</div>
          </div>

          {/* Success Notification */}
          {createdDocUrl && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Export Generated Successfully!</span>
              </div>
              {createdDocUrl !== 'LOCAL_DOWNLOAD_SUCCESS' ? (
                <a
                  href={createdDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Docs</span>
                </a>
              ) : (
                <div className="text-[11px] text-slate-300">
                  Downloaded official cryptographic audit dossier file to your device.
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded bg-red-950/80 border border-red-700 text-red-300 text-xs">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleDownloadLocal}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Local Dossier (.md)</span>
          </button>

          <button
            onClick={handleExportGoogleDoc}
            disabled={isExporting}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Exporting to Google Docs...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generate Official Google Doc</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
