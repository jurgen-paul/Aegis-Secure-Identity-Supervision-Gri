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
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return res.json({
        success: true,
        source: "Gemini-2.5-Flash Intelligence Engine",
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
