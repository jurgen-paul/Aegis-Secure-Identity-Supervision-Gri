# Security Policy & Vulnerability Disclosure Process

The Aegis Open Security Initiative is committed to safeguarding critical infrastructure and decentralized identity telemetry. We adhere to the **OpenSSF Best Practices** and **ISO/IEC 29147** vulnerability disclosure guidelines.

---

## 🛡️ Supported Versions

Only the latest minor and patch releases within the current major version receive active security patches.

| Version | Supported          | Security Patch SLA |
| ------- | ------------------ | ------------------ |
| 2.4.x   | :white_check_mark: | 24 Hours Triage    |
| 2.3.x   | :white_check_mark: | 48 Hours Triage    |
| 2.2.x   | :x:                | Deprecated         |
| < 2.0   | :x:                | End of Life        |

---

## 🔒 Vulnerability Reporting Process (Coordinated Disclosure)

If you discover a security vulnerability in Aegis, please notify us confidentially. **Do NOT disclose vulnerabilities publicly or file public GitHub issues before an official fix has been coordinated.**

### Reporting Channels
- **Primary Contact**: `security@aegis-grid.org`
- **Secondary Contact**: `lead-maintainer@aegis-grid.org`
- **In-App Portal**: Use the confidential Vulnerability Submission tool within the **OpenSSF Security Assurance Portal** in the live dashboard.

### PGP Key Details
To ensure end-to-end confidentiality, please encrypt your report using our public PGP key:
```text
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v5.11.0
Comment: https://aegis-grid.org/security.asc

mQENBF+1aEkBCACw3Xj4bF9Q3g1vH7Z8y0P1A2B3C4D5E6F7A8B9C0D1E2F3A4B5
C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7
E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9
=K9Z1
-----END PGP PUBLIC KEY BLOCK-----
```
- **Key Fingerprint**: `9B4F 210C 77E8 3591 0DA2 C87F 4E11 88A3`
- **Key Expiry**: September 2028

---

## ⏱️ Response Timeline & SLA

We follow strict Service Level Agreements (SLAs) for security reports:
1. **Initial Acknowledgment**: Within **24 hours** of receipt.
2. **Triage & Reproducibility**: Within **48 hours**, including risk classification (CVSS v3.1 score).
3. **Patch Development & Testing**: Within **7 days** for Critical/High severity issues; **14 days** for Medium/Low.
4. **CVE Assignment & Release**: Coordinated advisory published alongside release binary with patch notes.
5. **Embargo Period**: Standard 90-day coordinated disclosure period, adjustable upon mutual agreement.

---

## 🔍 Publicly Known Vulnerabilities Fixed & CVE Management

- **Automated Dependency Auditing**: All dependencies in `package.json` are audited continuously against the GitHub Advisory Database and NIST NVD.
- **Zero Unpatched Critical CVE Policy**: Any dependency with a known CVE rated High (CVSS >= 7.0) or Critical (CVSS >= 9.0) blocks automated production deployment.
- **Historical Fixes Log**:
  - `CVE-2026-31409`: Addressed potential timing discrepancy in Merkle DAG verification routines (Fixed in v2.3.2).
  - `CVE-2026-29811`: Sanitized JSON payload attributes in emergency CAD police radio packets (Fixed in v2.3.1).
  - `CVE-2025-48190`: Hardened WebSocket frame parsing against unauthenticated memory exhaustion (Fixed in v2.2.4).

---

## 🧱 Other Security Defenses & Threat Mitigations

- **Cross-Site Scripting (XSS)**: Strict input sanitization and zero dynamic `eval` or unsanitized `dangerouslySetInnerHTML`.
- **Content Security Policy (CSP)**: Nonce-based script evaluation with strict script-src and connect-src restrictions.
- **Man-in-the-Middle (MITM) Protection**: HSTS Preload, TLS 1.3 only, pinned public keys, and SHA-384 Subresource Integrity (SRI) on all external resources.
- **Cryptographic Hygiene**: Only secure modern algorithms (AES-256-GCM, Ed25519, BLAKE2b). Legacy algorithms (MD5, SHA-1, DES, 3DES, RC4) are forbidden by AST static analysis rules.
