# Proposal: Fix Better Auth Client IP and Routing on Cloudflare

## Problem Statement
The application is experiencing authentication issues when deployed to Cloudflare Workers:
1.  **Client IP Detection Failure**: Better Auth logs warnings because it cannot determine the client's IP address, which is required for rate limiting.
2.  **404 Errors on Auth Routes**: Requests to `/api/auth/sign-in/email` return a 404 status code, likely due to a mismatch between the configured `baseURL` and the actual request host, or missing proxy trust configuration.

These issues do not occur on `localhost` but are critical for production stability and security.

## Proposed Solution
Update the `betterAuth` configuration in `worker/auth.ts` to be more environment-aware:
1.  **Configure `advanced.ipAddress.ipAddressHeaders`**: Explicitly include `cf-connecting-ip` for Cloudflare and `x-forwarded-for` for standard proxy environments (on-premise).
2.  **Enable `advanced.trustedProxyHeaders`**: Allow Better Auth to trust headers from Cloudflare's edge, helping it resolve the correct host and protocol.
3.  **Ensure `baseURL` consistency**: Remind the user to set `BETTER_AUTH_URL` in the Cloudflare dashboard to match the production worker URL.

## Scope
-   **Modified Files**: `worker/auth.ts`
-   **Infrastructure**: Update environment variables in Cloudflare Dashboard.

## Risks & Considerations
-   **Compatibility**: The changes are non-breaking for `localhost` and standard on-premise deployments as they use standard fallback mechanisms.
-   **Security**: Enabling `trustedProxyHeaders` is safe as Cloudflare is a trusted proxy in this deployment model.

## Success Criteria
-   The "Rate limiting skipped" warning disappears from Cloudflare logs.
-   Users can successfully sign in on the Cloudflare deployment.
-   Authentication continues to work correctly on `localhost`.
