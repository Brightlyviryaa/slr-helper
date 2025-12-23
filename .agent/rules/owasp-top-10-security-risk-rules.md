---
trigger: always_on
---

# LLM CODING RULES (STRICT) — OWASP Top 10 Updated 2025

You are a coding assistant for this repository. You MUST follow these rules strictly for every code change (frontend, backend, CI/CD, IaC). If a request conflicts with these rules, you MUST ask for clarification or propose a secure alternative.

## 1)[A01:2025 - Broken Access Control](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/)
Broken access control happens when users can act outside their intended permissions (e.g., IDOR, missing object-level checks, privilege escalation, SSRF-shaped access abuse).

LLM rules (MUST):
- MUST enforce authorization server-side on every request/action; MUST NOT rely on UI-only checks.
- MUST implement object-level authorization (owner/tenant checks) on every read/write.
- MUST default-deny: everything is private unless explicitly marked public.
- MUST apply least privilege (roles/scopes) and separate admin-only operations.
- MUST protect state-changing actions against CSRF when cookie/session auth is used.
- MUST configure CORS narrowly; MUST NOT allow wildcard origins for authenticated endpoints.

## 2)[A02:2025 - Security Misconfiguration](https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/)
Security misconfiguration occurs when insecure defaults, unnecessary features, or inconsistent settings expose the application.

LLM rules (MUST):
- MUST disable debug/verbose error output in production; MUST NOT expose stack traces to end users.
- MUST apply secure HTTP headers consistently (CSP where feasible, HSTS, etc.).
- MUST not expose internal endpoints (admin panels, metrics, health details) without authentication and environment restrictions.
- MUST store secrets in secure secret storage; MUST NOT commit secrets or ship them to the client.
- MUST harden infrastructure defaults (DB, cache, bucket policies, IAM) and remove permissive defaults.

## 3)[A03:2025 - Software Supply Chain Failures](https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/)
Supply chain failures happen when dependencies, build pipelines, package registries, or release artifacts are compromised or untrusted.

LLM rules (MUST):
- MUST pin dependencies (lockfiles) and prefer reproducible builds.
- MUST run dependency scanning in CI and block releases on critical issues unless explicitly waived.
- MUST verify provenance/integrity for artifacts when feasible (checksums/signatures).
- MUST restrict CI/CD credentials (least privilege), rotate secrets, and isolate build secrets.
- MUST maintain an SBOM when required by policy and keep it updated per release.

## 4)[A04:2025 - Cryptographic Failures](https://owasp.org/Top10/2025/A04_2025-Cryptographic_Failures/)
Cryptographic failures occur when data is insufficiently protected in transit/at rest, or when weak/incorrect crypto is used.

LLM rules (MUST):
- MUST enforce TLS for sensitive traffic; MUST NOT send credentials/PII over plaintext.
- MUST use vetted crypto libraries; MUST NOT implement custom crypto primitives.
- MUST hash passwords using a password hashing algorithm (Argon2id/bcrypt/scrypt); MUST NOT use MD5/SHA* for password storage.
- MUST encrypt sensitive data at rest when required and protect keys using KMS/HSM/secret managers.
- MUST implement secret/key rotation and environment separation (dev/staging/prod).

## 5)[A05:2025 - Injection](https://owasp.org/Top10/2025/A05_2025-Injection/)
Injection occurs when untrusted input is interpreted as commands/queries (SQL/NoSQL/OS/LDAP/template injections, XSS, etc.).

LLM rules (MUST):
- MUST use parameterized queries/ORM safe APIs; MUST NOT concatenate user input into queries.
- MUST validate inputs at trust boundaries (schema validation; reject unknown fields).
- MUST escape/encode output by context; MUST avoid dangerous HTML injection sinks.
- MUST NOT pass user input to shells/interpreters; if unavoidable, MUST use strict allowlists.
- MUST prevent path traversal; MUST use safe path joins and allowlisted directories/filenames.

## 6)[A06:2025 - Insecure Design](https://owasp.org/Top10/2025/A06_2025-Insecure_Design/)
Insecure design is about missing security controls by design (weak threat modeling, missing abuse-case handling, flawed trust boundaries).

LLM rules (MUST):
- MUST perform threat modeling for features touching auth, payments, PII, admin, or multi-tenancy.
- MUST implement defense-in-depth (authz + validation + rate limiting + monitoring).
- MUST use secure-by-default patterns (deny-by-default, safe serialization, minimal exposure).
- MUST design tenant boundaries explicitly and verify them server-side.
- MUST define security acceptance criteria and add tests for key abuse cases.

## 7)[A07:2025 - Authentication Failures](https://owasp.org/Top10/2025/A07_2025-Authentication_Failures/)
Authentication failures occur when login/session/token handling is weak, enabling account takeover or session abuse.

LLM rules (MUST):
- MUST use proven authentication libraries/frameworks; MUST NOT hand-roll auth without explicit approval.
- MUST implement brute-force protections (rate limit, lockout, bot controls as needed).
- MUST implement secure session management (rotation, invalidation on logout, short-lived tokens).
- MUST store tokens securely (httpOnly cookies where appropriate); MUST NOT store long-lived secrets in localStorage.
- MUST require MFA for privileged/admin accounts when feasible.

## 8)[A08:2025 - Software or Data Integrity Failures](https://owasp.org/Top10/2025/A08_2025-Software_or_Data_Integrity_Failures/)
Integrity failures occur when code/data updates, events, or deserialization are not verified and can be tampered with.

LLM rules (MUST):
- MUST verify webhook/event integrity (HMAC signatures, timestamps, replay protection).
- MUST avoid unsafe deserialization; MUST validate payloads strictly and reject unexpected shapes.
- MUST protect releases and artifact publishing with strong controls (protected branches, reviews).
- MUST enforce database integrity (constraints, transactional invariants, audit trails when needed).
- MUST restrict who can modify critical configuration and ensure tamper detection where required.

## 9)[A09:2025 - Security Logging and Alerting Failures](https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/)
Logging and alerting failures occur when attacks cannot be detected, investigated, or responded to quickly.

LLM rules (MUST):
- MUST log security-relevant events (auth failures, access denials, privilege changes, admin actions).
- MUST include correlation IDs and safe actor/tenant identifiers for traceability.
- MUST alert on high-signal patterns (repeated failures, suspicious spikes, privilege anomalies).
- MUST NOT log secrets/tokens/passwords/PII; MUST redact sensitive fields.
- MUST centralize logs and protect them from tampering; retain per policy.

## 10)[A10:2025 - Mishandling of Exceptional Conditions](https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/)
Exceptional-condition mishandling occurs when errors, timeouts, partial failures, or edge cases cause unsafe “fail open” behavior or data exposure.

LLM rules (MUST):
- MUST fail closed for security decisions; on error/timeout, deny sensitive actions by default.
- MUST handle exceptions at boundaries (API/routes/workers); MUST NOT leak internal details to clients.
- MUST implement timeouts and bounded retries with backoff; MUST avoid infinite retry loops.
- MUST keep invariants via transactions/compensation where needed; MUST validate null/empty/partial states.
- MUST return safe, typed error responses to clients; log diagnostics server-side with redaction.
