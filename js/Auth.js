// js/Auth.js
//
// Cognito Hosted UI sign-in using the authorization code flow with PKCE.
//
// Why PKCE: a browser app is a "public client" and cannot keep a secret, so
// the plain authorization code flow (which requires a client secret at the
// token endpoint) is unusable here. PKCE replaces the secret with a
// per-login proof: we generate a random verifier, send only its SHA-256
// hash to start the flow, then present the original verifier to redeem the
// code. Only the browser that began the login can finish it.
//
// Requires HTTPS. crypto.subtle is unavailable on file:// and plain http,
// so test against the CloudFront URL, not a local file.

const AUTH_CONFIG = {
    domain: 'https://us-east-1rwfuj9auw.auth.us-east-1.amazoncognito.com',

    // The PUBLIC app client (no client secret). Not the original one.
    clientId: '2d3e2qk208m4a0fmmdfdmepcgc',

    redirectUri: 'https://d1507a6b6kt0lr.cloudfront.net',
    scopes: 'openid email'
};

const Auth = (() => {

    const VERIFIER_KEY = 'glr_pkce_verifier';
    const TOKENS_KEY = 'glr_tokens';

    // ----------------------------------------------------------------
    // PKCE helpers
    // ----------------------------------------------------------------

    function base64UrlEncode(bytes) {
        let binary = '';
        bytes.forEach(b => { binary += String.fromCharCode(b); });
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    function randomVerifier() {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        return base64UrlEncode(bytes);
    }

    async function challengeFor(verifier) {
        const digest = await crypto.subtle.digest(
            'SHA-256', new TextEncoder().encode(verifier));
        return base64UrlEncode(new Uint8Array(digest));
    }

    // ----------------------------------------------------------------
    // Token storage
    // ----------------------------------------------------------------
    // sessionStorage rather than localStorage: tokens die with the tab,
    // which limits the window for theft on a shared machine. The tradeoff
    // is that a new tab requires signing in again (usually silent, since
    // the Cognito session cookie is still valid).

    function saveTokens(data) {
        const tokens = {
            idToken: data.id_token,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + (data.expires_in * 1000)
        };
        sessionStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
        return tokens;
    }

    function loadTokens() {
        try {
            const raw = sessionStorage.getItem(TOKENS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function clearTokens() {
        sessionStorage.removeItem(TOKENS_KEY);
        sessionStorage.removeItem(VERIFIER_KEY);
    }

    // Decode the ID token payload for display purposes only.
    // NOTE: this does NOT verify the signature. Never trust these values
    // for anything that matters — the API re-validates the token properly
    // and reads the identity from the verified claims server-side.
    function decodePayload(token) {
        try {
            const part = token.split('.')[1]
                .replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(part));
        } catch (e) {
            return {};
        }
    }

    // ----------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------

    async function login() {
        const verifier = randomVerifier();
        sessionStorage.setItem(VERIFIER_KEY, verifier);

        const challenge = await challengeFor(verifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: AUTH_CONFIG.clientId,
            redirect_uri: AUTH_CONFIG.redirectUri,
            scope: AUTH_CONFIG.scopes,
            code_challenge_method: 'S256',
            code_challenge: challenge
        });

        window.location.href = `${AUTH_CONFIG.domain}/oauth2/authorize?${params}`;
    }

    function logout() {
        clearTokens();
        const params = new URLSearchParams({
            client_id: AUTH_CONFIG.clientId,
            logout_uri: AUTH_CONFIG.redirectUri
        });
        window.location.href = `${AUTH_CONFIG.domain}/logout?${params}`;
    }

    async function exchangeCode(code) {
        const verifier = sessionStorage.getItem(VERIFIER_KEY);
        if (!verifier) throw new Error('Missing PKCE verifier');

        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: AUTH_CONFIG.clientId,
            code: code,
            redirect_uri: AUTH_CONFIG.redirectUri,
            code_verifier: verifier
        });

        const res = await fetch(`${AUTH_CONFIG.domain}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (!res.ok) {
            throw new Error(`Token exchange failed: ${res.status}`);
        }

        sessionStorage.removeItem(VERIFIER_KEY);
        return saveTokens(await res.json());
    }

    async function refresh() {
        const tokens = loadTokens();
        if (!tokens || !tokens.refreshToken) return null;

        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: AUTH_CONFIG.clientId,
            refresh_token: tokens.refreshToken
        });

        const res = await fetch(`${AUTH_CONFIG.domain}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (!res.ok) {
            clearTokens();
            return null;
        }

        const data = await res.json();
        // A refresh response has no refresh_token; keep the existing one.
        data.refresh_token = tokens.refreshToken;
        return saveTokens(data);
    }

    // Call once on page load, before starting the game.
    // Returns true if the user ends up signed in.
    async function init() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
            try {
                await exchangeCode(code);
            } catch (err) {
                console.error('Sign-in failed:', err);
                clearTokens();
            }
            // Strip ?code= from the address bar so a refresh does not try
            // to redeem an already-used code.
            window.history.replaceState({}, document.title,
                window.location.pathname);
        }

        let tokens = loadTokens();

        // Refresh a little early so a token cannot expire mid-request.
        if (tokens && Date.now() > tokens.expiresAt - 60000) {
            tokens = await refresh();
        }

        return !!tokens;
    }

    function isSignedIn() {
        const tokens = loadTokens();
        return !!tokens && Date.now() < tokens.expiresAt;
    }

    // Always await this before an API call rather than reading storage
    // directly — it refreshes a token that is about to expire.
    async function getIdToken() {
        let tokens = loadTokens();
        if (!tokens) return null;

        if (Date.now() > tokens.expiresAt - 60000) {
            tokens = await refresh();
        }
        return tokens ? tokens.idToken : null;
    }

    function getUsername() {
        const tokens = loadTokens();
        if (!tokens) return null;
        const claims = decodePayload(tokens.idToken);
        return claims['cognito:username'] || claims.email || 'Pirate';
    }

    return { init, login, logout, isSignedIn, getIdToken, getUsername };
})();
