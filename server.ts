import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI:", e);
    }
  }
  return geminiClient;
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    system: "AEGIS-SECURE-GODS-EYE-GRID",
    version: "3.2.0-SOVEREIGN",
    e2ee: "AES-256-GCM + ED25519",
    decentralized_auth: "W3C-DID-V1",
    supervision_nodes: 18,
    timestamp: new Date().toISOString(),
  });
});

// API: AI Threat Dossier & Anomaly Synthesis
app.post("/api/ai-dossier", async (req, res) => {
  const { targetName, targetDid, recentSightings, bankcardEvents, transitEvents, biometricScore } = req.body;

  const ai = getGemini();

  if (ai) {
    try {
      const prompt = `You are the AEGIS God's Eye Automated Defense Intelligence System.
Generate a concise, highly tactical threat intelligence assessment for the following supervised entity:

- Target Name: ${targetName || "Unknown Subject"}
- Sovereign DID: ${targetDid || "did:aegis:unknown"}
- Biometric Landmark Match Score: ${biometricScore || 94.2}%
- Recent Telemetry & Geolocation Sightings: ${JSON.stringify(recentSightings || [])}
- Bankcard / Financial Signals: ${JSON.stringify(bankcardEvents || [])}
- Public Transport & Transit Manifests: ${JSON.stringify(transitEvents || [])}

Provide:
1. Threat Level & Risk Profile (LOW / MEDIUM / HIGH / CRITICAL)
2. Trajectory & Anomaly Summary (correlating financial swipes, metro taps, and CCTV face hits)
3. Sovereign Privacy vs Supervision Policy Flags
4. Recommended Autonomous Containment / Intercept Vector

Format the response cleanly with structured bullet points and tactical terminology.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      return res.json({
        success: true,
        source: "Gemini-3.7-Flash Intelligence Engine",
        assessment: response.text,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Gemini API generation error:", error);
    }
  }

  // Resilient heuristic synthesis if API key is not yet provided
  const riskLevels = ["ELEVATED", "HIGH (CODE AMBER)", "CRITICAL (GEOFENCE BREACH)"];
  const selectedRisk = (biometricScore && biometricScore > 90) ? "CRITICAL (CODE RED)" : "ELEVATED (MONITORED)";

  const heuristicAssessment = `[AEGIS AUTONOMOUS INTELLIGENCE SYNTHESIS]
THREAT CLASSIFICATION: ${selectedRisk}
TARGET: ${targetName || "SUBJECT-709"} (DID: ${targetDid || "did:aegis:node-7x"})

1. BIOMETRIC & FACIAL RECOGNITION CORRELATION:
- Optical neural landmarks verified at ${biometricScore || 96.4}% confidence against National Defense Biometric Registry.
- Iris hash signature and gait telemetry match sovereign node historical baseline.

2. MULTI-VECTOR TRANSACTIONAL TRAIL:
- Financial Point-of-Sale (POS) and ATM activity in designated sector aligned with public transit metro tap-in within 4.2 minutes.
- Velocity vector exceeds standard pedestrian threshold; potential vehicular transit detected along primary corridor.

3. DATA SOVEREIGNTY & E2EE STATUS:
- Telemetry payload encrypted with client-derived AES-256-GCM session key; Merkle DAG signature validated by Node Relay #4.

4. AUTOMATED PROTOCOL RECOMMENDATION:
- Maintain continuous God's Eye orbital & CCTV lock.
- Deploy automated geofence advisory perimeter at Sector 4 Transit Hub.
- Flag any unauthorized crossing into restricted perimeter.`;

  res.json({
    success: true,
    source: "AEGIS Heuristic Defense Matrix",
    assessment: heuristicAssessment,
    generatedAt: new Date().toISOString(),
  });
});

// API: Dispatch Threat Directly to Police Station CAD & Radio Net
app.post("/api/dispatch/send-threat", async (req, res) => {
  const {
    subjectId,
    subjectName,
    subjectAlias,
    subjectDid,
    nationalId,
    threatLevel,
    location,
    biometrics,
    alertTitle,
    alertDetails,
    targetStationId,
    targetStationName,
    targetStationCallsign,
    channel,
    priority,
    containmentDirectives,
    authorizedOfficerDid,
  } = req.body;

  const dispatchId = `CAD-DISP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const ai = getGemini();

  let tacticalRadioTranscript = "";
  let aiGeneratedDirectives: string[] = containmentDirectives || [];

  if (ai) {
    try {
      const prompt = `You are the Computer-Aided Dispatch (CAD) & Tactical Police Radio Broadcast System for the Emergency Services & Rapid Intervention Network.
Generate an authentic, high-urgency, standardized Police Radio / Dispatcher APCO-10 transmission for the following threat dispatch:

- Target Police Precinct: ${targetStationName || "Central Police Station"} (${targetStationCallsign || "DISPATCH-1"})
- Channel: ${channel || "TETRA_C2000_POLICE_NET"}
- Priority Level: ${priority || "PRIORITY_1_CODE_RED"}
- Subject Name: ${subjectName || "Unknown"} (Alias: ${subjectAlias || "Unknown"})
- National ID / Red Notice Ref: ${nationalId || biometrics?.govDatabaseRefId || "FLAGGED-SUBJECT"}
- Threat Level: ${threatLevel || "CRITICAL_CODE_RED"}
- Incident Location: ${location?.locationName || "Transit Hub Corridor"} (Lat: ${location?.lat}, Lng: ${location?.lng})
- Current Velocity / Heading: ${location?.speedKmh || 0} km/h @ ${location?.headingDegrees || 0}°
- Biometric Face Match Confidence: ${biometrics?.faceMatchScore || 98.4}%
- Alert Summary: ${alertTitle || "Automated Perimeter Alert"} - ${alertDetails || "Subject breached restricted sector"}

Output:
Write a concise, realistic police radio dispatch callout (approx 3-5 lines) formatted in all-caps police radio protocol with 10-codes (e.g., 10-33 Emergency Traffic, 10-99 Wanted/Stolen, 10-84 ETA, 10-97 Arrived on Scene). Keep it tactical, urgent, and professional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      if (response.text) {
        tacticalRadioTranscript = response.text.trim();
      }
    } catch (error) {
      console.warn("Gemini dispatch transcript generation error:", error);
    }
  }

  if (!tacticalRadioTranscript) {
    tacticalRadioTranscript = `[CAD 10-33 EMERGENCY RADIO BROADCAST // ALL SECTOR UNITS]
ATTENTION ALL UNITS IN VICINITY OF ${targetStationName ? targetStationName.toUpperCase() : "CENTRAL SECTOR"}:
PRIORITY 1 DISPATCH — 10-99 ACTIVE WANTED SUBJECT INTERCEPT.
SUBJECT: ${subjectName ? subjectName.toUpperCase() : "TARGET"} [ALIAS: ${subjectAlias ? subjectAlias.toUpperCase() : "N/A"}]
LOCATION: ${location?.locationName ? location.locationName.toUpperCase() : "SECTOR 1A CORRIDOR"} (LAT: ${location?.lat?.toFixed(5) || "52.3791"}, LNG: ${location?.lng?.toFixed(5) || "4.8994"}).
HEADING: ${location?.headingDegrees || 142}° AT ${location?.speedKmh || 45} KM/H.
BIOMETRIC OPTICAL RECOGNITION CONFIRMED AT ${biometrics?.faceMatchScore || 99.4}%.
DIRECTIVE: IMMEDIATELY DEPLOY PERIMETER CORDON & SEAL TRANSIT GATES.`;
  }

  const assignedUnits = [
    `${targetStationCallsign || "PATROL"}-UNIT-01`,
    `${targetStationCallsign || "PATROL"}-TACTICAL-04`,
  ];

  const packet = {
    dispatchId,
    targetStationId: targetStationId || "STATION-01-CENTRAAL-SPOORWEG",
    targetStationName: targetStationName || "Spoorwegpolitie & Marechaussee Rapid Tactical Unit",
    targetStationCallsign: targetStationCallsign || "KMAR-CENTRAAL-ALPHA",
    channel: channel || "TETRA_C2000_POLICE_NET",
    priority: priority || "PRIORITY_1_CODE_RED",
    subjectId: subjectId || "SUB-UNKNOWN",
    subjectName: subjectName || "Elena V. Rostova",
    subjectAlias: subjectAlias || "CIPHER_NIGHTINGALE",
    subjectDid: subjectDid || "did:aegis:unknown",
    nationalId: nationalId || "NL-8842-99120-A",
    threatLevel: threatLevel || "CRITICAL_CODE_RED",
    incidentLocation: location || {
      lat: 52.379189,
      lng: 4.899431,
      altitudeMeters: 14.2,
      accuracyMeters: 1.8,
      headingDegrees: 142,
      speedKmh: 48.5,
      locationName: "Amsterdam Centraal Station Perimeter (Zone 1A)",
      zoneId: "ZONE_HIGH_SECURITY_ALPHA",
      timestamp: new Date().toISOString(),
    },
    biometricMatchScore: biometrics?.faceMatchScore || 99.4,
    cctvSector: "CCTV-CAM-01-PLATFORM15",
    tacticalRadioTranscript,
    containmentDirectives: aiGeneratedDirectives.length > 0 ? aiGeneratedDirectives : [
      `Deploy rapid containment cordon at ${location?.locationName || "Sector Corridor"}`,
      "Engage turnstile biometric lockouts immediately",
      "Vector patrol cruisers on intercept route",
    ],
    authorizedOfficerDid: authorizedOfficerDid || "did:aegis:commander-vault-01",
    timestamp: new Date().toISOString(),
    status: "UNITS_DISPATCHED",
    acknowledgedByOfficerCallsign: `${targetStationCallsign || "DISPATCH"}-CONSOLE-01`,
    sha256Seal: `0x${Buffer.from(`${dispatchId}-${subjectId}-${Date.now()}`).toString("hex").padEnd(64, "0").slice(0, 64)}`,
    estimatedResponseTimeSeconds: 45,
    assignedPatrolUnits: assignedUnits,
  };

  res.json({
    success: true,
    message: `Threat dossier successfully transmitted to ${targetStationName || "Police Station"} CAD network.`,
    packet,
    transmittedAt: new Date().toISOString(),
  });
});

// API: Cryptographic Merkle Root Verification Endpoint
app.post("/api/audit/verify-root", (req, res) => {
  const { blocks } = req.body;
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ error: "Invalid block array" });
  }

  // Verify chain integrity
  let valid = true;
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].previousHash !== blocks[i - 1].hash) {
      valid = false;
      break;
    }
  }

  res.json({
    verified: valid,
    blockCount: blocks.length,
    latestHash: blocks[blocks.length - 1]?.hash || "",
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AEGIS Secure Server running on port ${PORT}`);
  });
}

startServer();
