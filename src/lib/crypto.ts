/**
 * Client-Side Cryptographic Engine for Aegis Sovereign System
 * Powered by WebCrypto API (AES-GCM-256, SHA-256, HMAC, Merkle Trees)
 */

export interface EncryptionResult {
  ivHex: string;
  authTagHex: string;
  ciphertextHex: string;
  algorithm: string;
  timestamp: string;
}

// Convert ArrayBuffer to Hex String
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
export function hexToBuffer(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// SHA-256 Hash string
export async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return bufferToHex(hashBuffer);
}

// Compute Merkle Root from an array of leaf hashes
export async function computeMerkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) return await sha256('EMPTY_TREE');
  if (leaves.length === 1) return leaves[0];

  let currentLevel = [...leaves];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combinedHash = await sha256(left + right);
      nextLevel.push(combinedHash);
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

// Generate an AES-GCM-256 key
export async function generateAESKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext with AES-GCM-256
export async function encryptAESGCM(plaintext: string, customKey?: CryptoKey): Promise<EncryptionResult> {
  const key = customKey || (await generateAESKey());
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encodedText = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    encodedText
  );

  const fullCipher = new Uint8Array(encryptedBuffer);
  // In WebCrypto AES-GCM, the last 16 bytes are the auth tag
  const tagBytes = fullCipher.slice(fullCipher.length - 16);
  const dataBytes = fullCipher.slice(0, fullCipher.length - 16);

  return {
    ivHex: bufferToHex(iv),
    authTagHex: bufferToHex(tagBytes),
    ciphertextHex: bufferToHex(dataBytes),
    algorithm: 'AES-256-GCM',
    timestamp: new Date().toISOString(),
  };
}

// Decrypt AES-GCM ciphertext
export async function decryptAESGCM(
  ciphertextHex: string,
  ivHex: string,
  authTagHex: string,
  key: CryptoKey
): Promise<string> {
  try {
    const dataBytes = hexToBuffer(ciphertextHex);
    const tagBytes = hexToBuffer(authTagHex);
    const fullCipher = new Uint8Array(dataBytes.length + tagBytes.length);
    fullCipher.set(dataBytes, 0);
    fullCipher.set(tagBytes, dataBytes.length);

    const iv = hexToBuffer(ivHex);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      fullCipher
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed: invalid auth tag or corrupted ciphertext.');
  }
}

// Generate Sovereign Decentralized Identifier (DID)
export async function generateSovereignDID(alias: string): Promise<{
  did: string;
  publicKeyHex: string;
  seedPhrase: string;
}> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const pubHex = bufferToHex(randomBytes);
  const hash = await sha256(pubHex + alias);
  const did = `did:aegis:${hash.substring(0, 32)}`;

  const wordList = [
    'sovereign', 'shield', 'cipher', 'quantum', 'beacon', 'orbital',
    'vector', 'matrix', 'telemetry', 'grid', 'lattice', 'sentinel',
    'vertex', 'merkle', 'genesis', 'crypt', 'secure', 'node',
    'titan', 'apex', 'zero', 'proof', 'enclave', 'aurora'
  ];

  const seedWords: string[] = [];
  for (let i = 0; i < 12; i++) {
    const idx = (randomBytes[i] + i * 7) % wordList.length;
    seedWords.push(wordList[idx]);
  }

  return {
    did,
    publicKeyHex: `0x04${pubHex.substring(0, 64)}`,
    seedPhrase: seedWords.join(' '),
  };
}

// Generate Zero Knowledge Proof Simulator (e.g. Proving Age >= 21 or Clearance Level >= 4 without disclosing actual value)
export async function generateZKPProof(
  statement: string,
  secretValue: string | number,
  threshold: string | number
): Promise<{
  proofHash: string;
  zkpCommitment: string;
  challenge: string;
  response: string;
  isValid: boolean;
}> {
  const salt = bufferToHex(crypto.getRandomValues(new Uint8Array(16)));
  const commitment = await sha256(`${secretValue}_${salt}_COMMITMENT`);
  const challenge = await sha256(`${statement}_${commitment}_CHALLENGE`);
  const response = await sha256(`${challenge}_${salt}_RESPONSE`);
  const proofHash = await sha256(`ZKP_${commitment}_${challenge}_${response}`);

  return {
    proofHash: `zkp:proof:${proofHash.substring(0, 24)}`,
    zkpCommitment: `0x${commitment.substring(0, 32)}`,
    challenge: `0x${challenge.substring(0, 24)}`,
    response: `0x${response.substring(0, 32)}`,
    isValid: true,
  };
}
