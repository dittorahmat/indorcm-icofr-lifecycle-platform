## Context

IndoGRC Pro currently runs on a monolithic repository with hardcoded branding ("IndoGRC Pro") and a single-signature license check. To support whitelabel partners (like `dsintegra`) who want to customize and extend the application while protecting core proprietary logic, we need to split the application into a wrapper UI layer and an obfuscated core layer. We also need to implement a hybrid licensing system that handles direct sales and partner double-signed sales in offline, air-gapped environments.

## Goals / Non-Goals

**Goals:**
- Implement offline double-signature validation compatible with 2-part direct sales keys.
- Create dynamic routing and sidebar loading mechanisms to isolate custom code inside `/src/extensions`.
- Design an automated build script to compile and obfuscate core packages before distribution.
- Establish a CI/CD pipeline to push release artifacts to `dsintegra/grc-platform-whitelabel`.

**Non-Goals:**
- Building the full Partner Web Portal (this belongs to the separate private repository `grc-license-coordinator`).
- Making non-UI backend models fully customizable by partners without our core engine.

## Decisions

- **Decision 1: Dynamic Hybrid Verification in `license.ts`**
  - *Rationale:* By inspecting the number of dot-separated parts in the license key, we can support both direct sales and whitelabeling with zero code divergence.
  - *Alternatives:* Maintaining separate code branches for direct vs. whitelabel builds, which was rejected due to extreme merge conflict overhead.
- **Decision 2: Extension Registry Pattern**
  - *Rationale:* Isolates partner-specific pages and routes in a single dedicated folder `/src/extensions` which can be mounted as a Git submodule, preventing modifications to core files.
  - *Alternatives:* Allowing partners to edit core UI pages directly, which was rejected due to risk of code conflicts during core regulatory updates.
- **Decision 3: Code Obfuscation in Release Pipeline**
  - *Rationale:* Since partners have source code access, compiling the core engine to obfuscated JS is necessary to protect HAKI and license enforcement checks.
  - *Alternatives:* Leaving the source code fully open, which was rejected as it makes license bypass trivial.

## Risks / Trade-offs

- **[Risk: License Code Tampering]** -> *Mitigation:* The licensing validation is compiled and obfuscated inside the core folder using `javascript-obfuscator`, making reverse-engineering or modification extremely difficult.
- **[Risk: No Internet on On-Premise Servers]** -> *Mitigation:* Verification uses Ed25519 asymmetric cryptography, which works 100% offline without any network requests to our servers.
