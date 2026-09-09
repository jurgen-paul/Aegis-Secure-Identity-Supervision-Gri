# Changelog

All notable changes to the Aegis Secure Identity & Supervision Grid are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

---

## [2.4.0] - 2026-09-09

### Added
- **OpenSSF Best Practices Assurance Suite**: Integrated complete Linux Foundation OpenSSF Silver/Passing criteria portal with live verification tools.
- **Interactive Automated Test Suite**: In-browser test runner executing real cryptographic, DID, Merkle DAG, and MITM defense test assertions.
- **Static Code Analysis (SAST) Scanner**: AST-level pattern inspector verifying OWASP Top 10 vulnerabilities, secret leakage, and strict warning flags.
- **Dynamic Code Analysis (DAST) Engine**: Runtime endpoint fuzzer and timing-attack resistance profiler.
- **Bug & Vulnerability Reporting Hub**: In-app forms for filing reproducible bug reports and PGP-encrypted security disclosures.
- **Tactical Security AI Assistant**: Conversational AI Sentinel with natural language command execution, push-to-talk voice input, and intelligent speech synthesis talkback.
- **FLOSS Apache 2.0 Licensing & Verification**: Complete open-source license documentation and dependency attribution viewer.

### Changed
- Upgraded Merkle DAG BLAKE2b root validation for faster zero-knowledge tamper detection.
- Enforced zero-warning compilation threshold across all TypeScript modules.

### Security
- Added Subresource Integrity (SRI) SHA-384 hashes across all loaded assets.
- Enforced HSTS Preload headers (`max-age=63072000`) and TLS 1.3 cipher suite restrictions.
- Verified zero unpatched CVEs across all package dependencies.

---

## [2.3.2] - 2026-08-15

### Fixed
- Addressed potential timing variation in Merkle DAG node signature comparison routines (`CVE-2026-31409`).
- Fixed voice synthesizer cutoff during long tactical audio broadcast notifications.

### Changed
- Optimized radar rendering canvas performance on high-DPI displays.

---

## [2.3.1] - 2026-07-28

### Added
- Google Tasks API integration for field officer directive dispatch and warrant tracking.
- Real-time CAD emergency packet radio transmission to municipal police station RTUs.

### Security
- Sanitized emergency dispatch JSON payload attributes to neutralize injection vectors (`CVE-2026-29811`).

---

## [2.2.0] - 2026-06-10

### Added
- IP Address Tracker with demographic correlation (Name, DOB, Village, City, ISP, ASN).
- W3C Decentralized Identifier (DID) client-side key generation using Ed25519 elliptic curves.
- Multi-sensor God's Eye GIS Supervision Map with 18 distributed mesh relay nodes.
- Kyber post-quantum hybrid key encapsulation for E2EE mesh communications.

### Security
- Deprecated legacy fallback ciphers in favor of authenticated AES-256-GCM.
