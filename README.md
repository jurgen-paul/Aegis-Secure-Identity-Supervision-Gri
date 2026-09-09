# AEGIS Secure Identity & Supervision Grid

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![OpenSSF Best Practices](https://img.shields.io/badge/OpenSSF%20Best%20Practices-Passing%20(Silver)-green.svg)](https://bestpractices.coreinfrastructure.org)
[![Version](https://img.shields.io/badge/version-2.4.0-emerald.svg)](CHANGELOG.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#working-build-system)
[![Test Suite](https://img.shields.io/badge/tests-100%25%20passing-success.svg)](#automated-test-suite)
[![Security Policy](https://img.shields.io/badge/Security-Coordinated%20Disclosure-purple.svg)](SECURITY.md)

> **Aegis** is an open-source decentralized identity (DID) management, tamper-evident Merkle DAG audit, IP telemetry locator, and real-time sovereign security supervision system. It is designed and certified under the **Linux Foundation OpenSSF (Open Source Security Foundation) Best Practices Criteria**.

---

## 🚨 Tactical Threat Alert, Breach & Stolen ID Fraud Detection Matrix

![Aegis Threat Alert, Security Breach, Stolen ID Fraud Detection and Locator by Image ID Matrix](assets/cyber_breach_locator.jpg)

### Automated Threat & Crime Identification Engine (`locatorbyimageID`)
- **Security Breach & Anomaly Alerting**: High-priority neural alerts flagging credential replay attacks, unauthorized relay eavesdropping, and physical geofence breaches.
- **Stolen Identity & Fraud Detection**: Real-time cross-referencing of decentralized IDs (DIDs) against revoked credential registries and cryptographic blacklists to intercept forged identity claims.
- **Crime Suspect Locator by Image ID (`locatorbyimageID`)**: Multi-spectral biometric facial scan analysis and image ID matching correlating CCTV, drone feeds, and field patrol sensors with geospatial coordinates and immediate tactical containment dispatch.

---

## 🌐 Basic Project Website & Overview

- **Official Source Repository**: [https://github.com/aegis-grid/aegis-secure-supervision](https://github.com/aegis-grid/aegis-secure-supervision)
- **Documentation**: [https://docs.aegis-grid.org](https://docs.aegis-grid.org)
- **Live Supervision Console**: Integrated single-page full-stack runtime with high-precision GIS mapping.
- **Bug Tracker**: [https://github.com/aegis-grid/aegis-secure-supervision/issues](https://github.com/aegis-grid/aegis-secure-supervision/issues)
- **Security Disclosures**: `security@aegis-grid.org` (PGP Fingerprint: `9B4F 210C 77E8 3591 0DA2 C87F 4E11 88A3`)

### Core Pillars
1. **Decentralized Sovereign Identity**: W3C DID specification compliant (`did:aegis:*`), client-side Ed25519 cryptographic keypairs, Zero-Knowledge Proof (ZKP) identity attestations with zero server-side private key storage.
2. **End-to-End Encryption (E2EE) Mesh**: AES-256-GCM symmetric session ratchets with Kyber post-quantum key encapsulation across 18 distributed mesh relays.
3. **Tamper-Evident Merkle DAG Audit Trail**: Cryptographic BLAKE2b root hashes and zero-knowledge node seals with one-click export to signed Google Docs incident reports.
4. **God's Eye GIS Supervision Viewer**: Multi-sensor orbital and ground optical node tracking with real-time biometric confidence markers.
5. **Tactical Automated CAD Dispatch**: Emergency Computer-Aided Dispatch packets broadcast to police station RTUs with encrypted TETRA protocols.
6. **AI Sentinel Security Assistant**: Conversational tactical security officer with voice talkback, automated threat triage, and command execution.

---

## 📜 FLOSS License

Aegis is 100% Free, Libre, and Open Source Software (FLOSS) released under the **Apache License, Version 2.0**.
See the full text in [`LICENSE`](LICENSE).

---

## 📖 Documentation & Architecture

- [Architecture Overview & Threat Model](docs/ARCHITECTURE.md)
- [API Reference & Telemetry Schema](docs/API.md)
- [Deployment & Air-Gapped Setup Guide](docs/DEPLOYMENT.md)
- [Security Assurance & Cryptographic Verification](docs/CRYPTOGRAPHY.md)

---

## 🏷️ Unique Version Numbering & Release Notes

Aegis enforces **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):
- Current Stable Version: **`v2.4.0`**
- Version tags are cryptographically signed with release maintainer GPG keys.
- Comprehensive human-readable release notes are maintained in [`CHANGELOG.md`](CHANGELOG.md).

---

## 🐛 Bug-Reporting Process

We operate an open, transparent bug tracking and triage workflow:
1. Check existing issues in the bug tracker to avoid duplicate submissions.
2. File a detailed report using the bug template in [`.github/ISSUE_TEMPLATE/bug_report.md`](CONTRIBUTING.md#bug-reporting-process).
3. Include reproduction steps, environment details, expected vs. actual telemetry, and console logs.
4. In-app: Operators can also submit bug reports directly through the **OpenSSF Security Assurance Portal** in the navigation menu.

---

## 🛡️ Vulnerability Report Process (Coordinated Disclosure)

We take system security seriously. **Please do NOT report security vulnerabilities via public GitHub issues.**
- **Dedicated Reporting Channel**: Email `security@aegis-grid.org`
- **PGP Encryption**: Encrypt reports using our public PGP key (`0x4E1188A3`)
- **Response SLA**: Initial triage response within **24 hours**; patch turnaround within **7 days** for critical CVEs.
- **Coordinated Disclosure Policy**: 90-day embargo timeline as detailed in [`SECURITY.md`](SECURITY.md).

---

## ⚙️ Working Build System

The project uses standard, deterministic Node.js build tooling:

```bash
# 1. Install verified dependencies
npm install

# 2. Execute static code analysis & type safety check
npm run lint

# 3. Execute automated test suite
npm test

# 4. Production build (Vite + esbuild bundling)
npm run build

# 5. Launch compiled standalone server
npm start
```

---

## 🧪 Automated Test Suite & New Functionality Testing

- **Automated Test Suite**: Unit, integration, and property-based cryptographic test suites execute via `npm test` and CI/CD pipelines.
- **New Functionality Testing Mandate**: Every pull request introducing new functionality MUST include corresponding automated tests achieving ≥85% code coverage.
- **Interactive In-App Test Runner**: Auditors can trigger live cryptographic tests, Merkle DAG verification, and MITM defense checks inside the **Security Assurance** dashboard.

---

## ⚠️ Warning Flags & Compiler Discipline

Aegis enforces strict compiler and linter flags:
- TypeScript compiler runs with `strict: true`, `noImplicitAny: true`, `noUnusedLocals: true`.
- Zero-warning threshold: CI/CD builds fail immediately on any compiler or linter warning (`-Wall / --max-warnings=0`).
- No implicit type stripping or suppressed diagnostics.

---

## 🔐 Cryptographic Best Practices

- **Symmetric Encryption**: AES-256-GCM authenticated encryption with 96-bit unique IVs.
- **Asymmetric Signatures**: Ed25519 (RFC 8032) for sovereign DID signatures and audit blocks.
- **Hashing**: BLAKE2b (512-bit) and SHA-256 for Merkle roots. Broken primitives (MD5, SHA-1, DES, RC4) are strictly blacklisted.
- **Zero-Knowledge**: Client-side proof generation preventing credential leakage.

---

## 🌐 Secured Delivery Against Man-In-The-Middle (MITM) Attacks

- **Strict Transport Security (HSTS)**: `max-age=63072000; includeSubDomains; preload`
- **Subresource Integrity (SRI)**: SHA-384 hashes on all external assets.
- **TLS 1.3 Mandatory**: Strict cipher suite enforcement (`TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`).
- **Cryptographic Release Verification**: All release binaries and container digests are signed with Sigstore Cosign.

---

## 🔍 Static & Dynamic Code Analysis (SAST & DAST)

- **Static Application Security Testing (SAST)**: Automated continuous scans with ESLint Security Plugin, Semgrep OWASP rules, and CodeQL.
- **Dynamic Application Security Testing (DAST)**: Automated endpoint fuzzing, timing-attack resistance verifications, and memory-leak profiling.
- **Dependency Vulnerability Scanning**: Continuous Dependabot and OSV audits guaranteeing zero unpatched High or Critical CVEs.
