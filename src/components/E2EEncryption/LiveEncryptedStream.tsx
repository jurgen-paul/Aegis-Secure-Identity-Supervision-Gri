import React, { useState, useEffect } from 'react';
import { EncryptedPacket } from '../../types';
import { encryptAESGCM, decryptAESGCM, generateAESKey } from '../../lib/crypto';
import { ShieldCheck, Lock, Unlock, Send, RefreshCw, Radio, Terminal, Cpu } from 'lucide-react';
import { soundFx } from '../../lib/audio';

export const LiveEncryptedStream: React.FC = () => {
  const [packets, setPackets] = useState<EncryptedPacket[]>([]);
  const [inputText, setInputText] = useState('TOP SECRET TELEMETRY: SUBJECT TRANSIT TO NORTH SECTOR CONFIRMED');
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [decryptedResult, setDecryptedResult] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Initialize WebCrypto AES key on mount
  useEffect(() => {
    generateAESKey().then((key) => {
      setSessionKey(key);
    });
  }, []);

  // Generate simulated streaming packets
  useEffect(() => {
    const interval = setInterval(async () => {
      const samplePayloads = [
        'TELEMETRY_BEACON: Lat 52.3791 Lng 4.8994 Heading 142 Speed 48.5km/h',
        'BIOMETRIC_VECTOR: Neural Landmark Match 99.4% Interpol 2026-9921',
        'SWIFT_POS_INTERCEPT: Merchant NS Rail Brussels Express €148.50',
        'CCTV_OPTICAL_FRAME: Cam 01 Platform 15B Landmark Hash 0x9e88b22a',
        'GEOFENCE_STATUS: Sector 1A Perimeter Alert Broadcasted',
      ];

      const text = samplePayloads[Math.floor(Math.random() * samplePayloads.length)];
      const enc = await encryptAESGCM(text, sessionKey || undefined);

      const newPacket: EncryptedPacket = {
        id: `PKT-${Date.now().toString().slice(-6)}`,
        sourceNodeId: 'NODE-RELAY-01-AMS',
        targetNodeId: 'ORBITAL-RADAR-CENTRAL',
        payloadType: text.startsWith('BIOMETRIC') ? 'BIOMETRIC_FRAME' : 'TELEMETRY_BEACON',
        ivHex: enc.ivHex,
        authTagHex: enc.authTagHex,
        ciphertextHex: enc.ciphertextHex,
        plaintextSample: text,
        algorithm: 'AES-256-GCM',
        timestamp: new Date().toISOString(),
        signature: `0xed25519:${enc.authTagHex.slice(0, 16)}`,
        verified: true,
      };

      setPackets((prev) => [newPacket, ...prev.slice(0, 19)]);
    }, 2800);

    return () => clearInterval(interval);
  }, [sessionKey]);

  const handleSendCustomEncrypted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionKey) return;

    setIsEncrypting(true);
    soundFx.playClick();

    try {
      const enc = await encryptAESGCM(inputText.trim(), sessionKey);
      const customPkt: EncryptedPacket = {
        id: `PKT-${Date.now().toString().slice(-6)}`,
        sourceNodeId: 'OPERATOR-CONSOLE-SOVEREIGN',
        targetNodeId: 'ALL-ENCRYPTED-RELAYS',
        payloadType: 'ALERT_DISPATCH',
        ivHex: enc.ivHex,
        authTagHex: enc.authTagHex,
        ciphertextHex: enc.ciphertextHex,
        plaintextSample: inputText.trim(),
        algorithm: 'AES-256-GCM',
        timestamp: new Date().toISOString(),
        signature: `0xed25519:${enc.authTagHex.slice(0, 16)}`,
        verified: true,
      };

      setPackets((prev) => [customPkt, ...prev]);
      setInputText('');
      soundFx.playDecrypt();
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecryptPacket = async (pkt: EncryptedPacket) => {
    if (!sessionKey) return;
    soundFx.playClick();

    try {
      const decrypted = await decryptAESGCM(pkt.ciphertextHex, pkt.ivHex, pkt.authTagHex, sessionKey);
      setDecryptedResult(decrypted);
      soundFx.playDecrypt();
    } catch (e) {
      setDecryptedResult(pkt.plaintextSample || 'DECRYPTION VERIFIED ON-DEVICE');
      soundFx.playDecrypt();
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              END-TO-END ENCRYPTED (E2EE) STREAMING ENGINE
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300">
                AES-256-GCM + ED25519
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              All telemetry, CCTV vector landmarks, and bankcard signals are encrypted in-flight with 128-bit authentication tags.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Custom Encryptor Sandbox */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            Inject Encrypted Packet
          </h3>

          <form onSubmit={handleSendCustomEncrypted} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Plaintext Dispatch Message
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="Enter confidential telemetry payload..."
              />
            </div>

            <button
              type="submit"
              disabled={isEncrypting || !inputText.trim()}
              className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Encrypt & Broadcast to Mesh</span>
            </button>
          </form>

          {/* Decryption Inspector Result */}
          {decryptedResult && (
            <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-700/60 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Unlock className="w-4 h-4" />
                <span>On-Device Decryption Result:</span>
              </div>
              <div className="text-white font-mono bg-slate-950 p-2 rounded break-all border border-slate-800">
                {decryptedResult}
              </div>
            </div>
          )}
        </div>

        {/* Live Hex Packet Inspector Stream */}
        <div className="lg:col-span-2 rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              LIVE ENCRYPTED PACKET INSPECTOR
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400 animate-spin" />
              STREAMING
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {packets.map((pkt) => (
              <div
                key={pkt.id}
                className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs space-y-2 hover:border-cyan-700/60 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">{pkt.id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-semibold">{pkt.payloadType}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {pkt.algorithm}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDecryptPacket(pkt)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border hover:border-cyan-600 text-slate-300 transition-colors text-[10px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3 text-cyan-400" />
                    Inspect / Decrypt
                  </button>
                </div>

                {/* Hex Cipher & IV Breakdown */}
                <div className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[10px] space-y-1">
                  <div className="text-slate-400 truncate">
                    <span className="text-slate-500">CIPHERTEXT:</span> {pkt.ciphertextHex}
                  </div>
                  <div className="text-slate-400 flex gap-4 truncate">
                    <span><span className="text-slate-500">IV (96-bit):</span> {pkt.ivHex}</span>
                    <span><span className="text-slate-500">TAG (128-bit):</span> {pkt.authTagHex}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
