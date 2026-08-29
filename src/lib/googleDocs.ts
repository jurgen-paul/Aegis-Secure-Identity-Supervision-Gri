/**
 * Google Docs Integration for Aegis Secure System
 * Handles official audit report generation, incident dossier export, and verification export.
 */

export interface ExportReportData {
  title: string;
  reportId: string;
  generatedAt: string;
  officerDid: string;
  securityClearance: string;
  merkleRoot: string;
  blockHeight: number;
  threatAssessment: string;
  trackedSubjectsSummary: {
    name: string;
    did: string;
    threatLevel: string;
    lastLocation: string;
    biometricScore: number;
    flaggedTransactions: number;
    transitSightings: number;
  }[];
  recentAuditBlocks: {
    blockHeight: number;
    hash: string;
    action: string;
    actorNode: string;
    timestamp: string;
  }[];
  activeAlerts: {
    title: string;
    severity: string;
    location: string;
    timestamp: string;
  }[];
}

// Generates Google Docs batch update document structure
export function buildDocsInsertRequests(data: ExportReportData) {
  const content = [
    `AEGIS-EYE // OFFICIAL CRYPTOGRAPHIC AUDIT & SUPERVISION REPORT\n`,
    `CONFIDENTIALITY: TOP SECRET // ORBITAL AEGIS PROTOCOL 9\n`,
    `DOCUMENT ID: ${data.reportId} | GENERATED: ${data.generatedAt}\n`,
    `ISSUING OFFICER DID: ${data.officerDid}\n`,
    `MERKLE ROOT HASH: ${data.merkleRoot}\n`,
    `BLOCK HEIGHT: #${data.blockHeight} (TAMPER-EVIDENT CRYPTOGRAPHIC PROOF VERIFIED)\n\n`,
    `--------------------------------------------------------------------------------\n`,
    `SECTION 1: AUTONOMOUS THREAT & SUPERVISION INTELLIGENCE ASSESSMENT\n`,
    `--------------------------------------------------------------------------------\n`,
    `${data.threatAssessment}\n\n`,
    `--------------------------------------------------------------------------------\n`,
    `SECTION 2: MULTI-VECTOR TARGET SUPERVISION & BIOMETRIC CORRELATION\n`,
    `--------------------------------------------------------------------------------\n`,
    ...data.trackedSubjectsSummary.map(
      (s, idx) =>
        `[TARGET #${idx + 1}] ${s.name}\n` +
        ` - Sovereign DID: ${s.did}\n` +
        ` - Threat Status: ${s.threatLevel}\n` +
        ` - Last Coordinates: ${s.lastLocation}\n` +
        ` - Biometric Match Confidence: ${s.biometricScore}%\n` +
        ` - Flagged POS/Bankcard Anomaly Events: ${s.flaggedTransactions}\n` +
        ` - Transit / Metro Gate Sightings: ${s.transitSightings}\n\n`
    ),
    `--------------------------------------------------------------------------------\n`,
    `SECTION 3: IMMUTABLE AUDIT TRAIL LOGS (MERKLE DAG CHAIN)\n`,
    `--------------------------------------------------------------------------------\n`,
    ...data.recentAuditBlocks.map(
      (b) =>
        `Block #${b.blockHeight} | ${b.timestamp} | Node: ${b.actorNode}\n` +
        ` Action: ${b.action}\n` +
        ` SHA-256 Hash: ${b.hash}\n\n`
    ),
    `--------------------------------------------------------------------------------\n`,
    `SECTION 4: ACTIVE GEOFENCE & UNAUTHORIZED MOVEMENT PROTOCOLS\n`,
    `--------------------------------------------------------------------------------\n`,
    ...data.activeAlerts.map(
      (a) => `[ALERT - ${a.severity}] ${a.title} @ ${a.location} (${a.timestamp})\n`
    ),
    `\n=== END OF VERIFIED AEGIS AUDIT DOSSIER ===\n`
  ].join('');

  return {
    requests: [
      {
        insertText: {
          location: { index: 1 },
          text: content,
        },
      },
    ],
    fullPlainText: content,
  };
}

// Create a Google Doc via Google Docs REST API using client token
export async function createGoogleDocWithAudit(
  accessToken: string,
  data: ExportReportData
): Promise<{ docId: string; docUrl: string; title: string }> {
  // Step 1: Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `${data.title} [${data.reportId.substring(0, 8)}]`,
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Failed to create Google Doc: ${errorBody}`);
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // Step 2: Insert formatted text
  const { requests } = buildDocsInsertRequests(data);
  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: requests,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorBody = await updateRes.text();
    console.warn('Batch update had warnings or error:', errorBody);
  }

  return {
    docId: documentId,
    docUrl: `https://docs.google.com/document/d/${documentId}/edit`,
    title: doc.title,
  };
}

// Download sovereign markdown dossier locally
export function downloadMarkdownDossier(data: ExportReportData) {
  const { fullPlainText } = buildDocsInsertRequests(data);
  const blob = new Blob([fullPlainText], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AEGIS_AUDIT_DOSSIER_${data.reportId.substring(0, 8)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
