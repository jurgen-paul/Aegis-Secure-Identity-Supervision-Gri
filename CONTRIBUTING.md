# Contributing to AEGIS & Quality Guidelines

Thank you for contributing to the Aegis Open Security Initiative. As an infrastructure security platform, we maintain strict software assurance standards aligned with **OpenSSF Best Practices Criteria**.

---

## 🐛 Bug-Reporting Process

We encourage early reporting of unexpected behavior, performance regressions, or UI glitches.

### How to Submit a Bug Report
1. **Search Existing Issues**: Review open issues at [https://github.com/aegis-grid/aegis-secure-supervision/issues](https://github.com/aegis-grid/aegis-secure-supervision/issues) to avoid duplicates.
2. **Use the Bug Report Template**: Include the following required details:
   - **Environment**: OS, Browser version, Node.js version.
   - **Steps to Reproduce**: Minimal step-by-step instructions.
   - **Expected vs. Actual Telemetry**: Clear description of what failed.
   - **Console / Network Logs**: Relevant stack traces without sensitive tokens.
3. **In-App Direct Submission**: You can also use the integrated Bug Reporting modal under the **Security Assurance** tab in the Aegis console.

> **Note**: For security vulnerabilities, please refer to [`SECURITY.md`](SECURITY.md) instead of public issue trackers.

---

## 🧪 New Functionality Testing Policy

To guarantee zero regressions in critical security services:
1. **Automated Test Coverage**: Every pull request introducing new functionality MUST include automated test cases covering both success and edge-case failure paths.
2. **Coverage Threshold**: PRs must maintain or improve the existing ≥85% code coverage baseline across:
   - Cryptographic primitives (keypair generation, signature verification, symmetric encryption)
   - Decentralized identity credential parsing and ZKP proofs
   - Network telemetry parsing and geofence boundary calculations
   - Merkle DAG integrity validation
3. **Continuous Integration**: The automated test suite (`npm test`) runs automatically on every commit.

---

## ⚠️ Warning Flags & Compiler Discipline

- All code must compile cleanly under TypeScript with strict checks:
  - `strict: true`
  - `noImplicitAny: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
- Linter execution (`npm run lint`) must complete with **zero errors and zero warnings**.
- No commit will be merged with disabled compiler warnings.

---

## 🛡️ Secure Development Knowledge & Coding Standards

Contributors are expected to follow secure coding standards based on **OWASP ASVS (Application Security Verification Standard)**:
- **Zero Raw DOM Injection**: Do not use `dangerouslySetInnerHTML` or `eval()`.
- **Cryptographic Correctness**: Use the centralized `/src/lib/crypto.ts` engine. Never implement custom ad-hoc ciphers.
- **Input Validation & Sanitization**: Sanitize all external inputs (e.g. IP queries, telemetry packets, DID documents) before rendering or processing.
- **Principle of Least Privilege**: Server-side endpoints must never expose sensitive credentials or keys to the client runtime.
