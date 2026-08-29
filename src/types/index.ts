export type ThreatLevel = 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL_CODE_RED';

export type GeofenceStatus = 'WITHIN_PERIMETER' | 'APPROACHING_BOUNDARY' | 'BREACH_DETECTED' | 'RESTRICTED_ZONE';

export interface LocationCoordinate {
  lat: number;
  lng: number;
  altitudeMeters: number;
  accuracyMeters: number;
  headingDegrees: number;
  speedKmh: number;
  locationName: string;
  zoneId: string;
  timestamp: string;
}

export interface BankcardTransaction {
  id: string;
  cardMask: string; // e.g. "•••• 8821"
  network: 'VISA_SECURE' | 'MASTERCARD_CHIP' | 'AEGIS_SOVEREIGN_PAY' | 'SWIFT_INTERCEPT';
  merchant: string;
  amount: number;
  currency: string;
  terminalId: string;
  lat: number;
  lng: number;
  timestamp: string;
  isFlagged: boolean;
  flagReason?: string;
  authMethod: 'CHIP_PIN' | 'CONTACTLESS_NFC' | 'BIOMETRIC_TOUCH' | 'REMOTE_TOKEN';
}

export interface TransitEvent {
  id: string;
  transitType: 'METRO_GATE' | 'HIGH_SPEED_RAIL' | 'AIRPORT_GATE' | 'BUS_RAPID' | 'ALPR_VEHICLE_SCAN';
  stationOrGate: string;
  routeId: string;
  passCardId: string;
  lat: number;
  lng: number;
  timestamp: string;
  direction: 'ENTRY' | 'EXIT' | 'TRANSIT_CHECKPOINT';
  biometricGateMatched: boolean;
  anomalyDetected: boolean;
}

export interface BiometricMarker {
  irisHash: string;
  voiceprintHarmonicScore: number;
  gaitCadenceFrequency: number;
  faceEmbeddingVector: number[];
  faceMatchScore: number; // e.g. 98.4%
  dnaMarkerReference: string;
  lastScannedAt: string;
  govDatabaseRefId: string;
  govDatabaseStatus: 'VERIFIED_CITIZEN' | 'WATCHLIST_RED_NOTICE' | 'CLASSIFIED_OPERATIVE' | 'SOVEREIGN_EXEMPT';
}

export interface TrackedSubject {
  id: string;
  fullName: string;
  alias: string;
  did: string;
  avatarUrl: string;
  nationalIdNumber: string;
  threatLevel: ThreatLevel;
  geofenceStatus: GeofenceStatus;
  currentLocation: LocationCoordinate;
  locationHistory: LocationCoordinate[];
  bankcardTransactions: BankcardTransaction[];
  transitEvents: TransitEvent[];
  biometrics: BiometricMarker;
  assignedSecureNodeId: string;
  e2eeSessionActive: boolean;
  lastTelemetryPing: string;
  notes: string;
  isLockedOn: boolean;
}

export interface SurveillanceNode {
  id: string;
  nodeName: string;
  type: 'CCTV_FACIAL_SCANNER' | 'RADAR_ARRAY' | 'TELEMETRY_RELAY' | 'GEOFENCE_BEACON' | 'BANK_GATEWAY' | 'TRANSIT_SENSOR';
  lat: number;
  lng: number;
  coverageRadiusMeters: number;
  status: 'ACTIVE' | 'ENCRYPTED_STREAMING' | 'MAINTENANCE' | 'ALERT_LOCK';
  quantumShieldEnabled: boolean;
  packetThroughputKbps: number;
  connectedClients: number;
  activeDetections: number;
}

export interface CCTVCameraFeed {
  id: string;
  cameraName: string;
  sector: string;
  lat: number;
  lng: number;
  resolution: string;
  fps: number;
  feedType: 'THERMAL_OPTICAL' | 'NEURAL_LANDMARK' | 'NIGHT_VISION_IR' | 'SYNTHETIC_CCTV';
  activeTargets: {
    subjectId: string;
    subjectName: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    matchConfidence: number;
    trackingId: string;
  }[];
}

export interface EncryptedPacket {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  payloadType: 'TELEMETRY_BEACON' | 'BIOMETRIC_FRAME' | 'TRANSACTION_LOG' | 'ALERT_DISPATCH' | 'DID_VERIFICATION';
  ivHex: string;
  authTagHex: string;
  ciphertextHex: string;
  plaintextSample?: string;
  algorithm: 'AES-256-GCM' | 'KYBER-768-HYBRID' | 'ED25519-SIGNED';
  timestamp: string;
  signature: string;
  verified: boolean;
}

export interface MerkleAuditBlock {
  blockHeight: number;
  hash: string;
  previousHash: string;
  merkleRoot: string;
  action: string;
  subjectDid: string;
  actorNodeId: string;
  payloadSummary: string;
  timestamp: string;
  signature: string;
  status: 'VERIFIED_ON_CHAIN' | 'VALIDATED_LOCAL_DAG';
}

export interface SovereignDID {
  did: string;
  alias: string;
  publicKeyHex: string;
  keyType: 'Ed25519' | 'ECDSA-secp256k1' | 'AES-GCM-256';
  createdDate: string;
  isPrimary: boolean;
  credentialsCount: number;
  seedPhrasePreview: string;
  guardians: string[];
}

export interface VerifiableCredential {
  id: string;
  type: string;
  issuerDid: string;
  subjectDid: string;
  issuanceDate: string;
  expirationDate: string;
  claims: Record<string, string | number | boolean>;
  zkpProofAvailable: boolean;
  zkpPredicate?: string;
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
  proofSignature: string;
}

export interface AutomatedAlertRule {
  id: string;
  name: string;
  condition: string;
  severity: ThreatLevel;
  isActive: boolean;
  autoLockdown: boolean;
  notifyNodes: string[];
  triggerCount: number;
  lastTriggered?: string;
}

export interface ActiveAlertLog {
  id: string;
  ruleId: string;
  title: string;
  subjectName: string;
  subjectId: string;
  severity: ThreatLevel;
  timestamp: string;
  locationDetails: string;
  details: string;
  actionTaken: string;
  isResolved: boolean;
}
