import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: window.location.origin, // Assuming the worker is on the same origin orproxied
    plugins: [
        organizationClient()
    ]
})
