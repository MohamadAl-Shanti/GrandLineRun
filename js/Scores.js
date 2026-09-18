// js/Scores.js
//
// Thin client for the scores API. Keeps fetch/token plumbing out of the
// Phaser scenes so they only deal with plain data.

const SCORES_ENDPOINT = 'https://fyk36bz02m.execute-api.us-east-1.amazonaws.com/prod/scores';
const LEADERBOARD_ENDPOINT = 'https://fyk36bz02m.execute-api.us-east-1.amazonaws.com/prod/leaderboard';

const Scores = (() => {

    // Submits a score. The server decides whether it is a new personal best
    // and only writes if so, so the client never has to compare anything.
    //
    // Note the raw token as the Authorization value, NOT "Bearer <token>".
    // API Gateway's Cognito authorizer expects the bare JWT, unlike most
    // OAuth APIs.
    async function submit(score) {
        const token = await Auth.getIdToken();
        if (!token) {
            return { ok: false, reason: 'signed-out' };
        }

        try {
            const res = await fetch(SCORES_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ score: score })
            });

            if (res.status === 401) return { ok: false, reason: 'expired' };
            if (!res.ok) return { ok: false, reason: `http-${res.status}` };

            const data = await res.json();
            return { ok: true, newHighScore: !!data.newHighScore, score: data.score };

        } catch (err) {
            console.warn('Score submission failed:', err);
            return { ok: false, reason: 'network' };
        }
    }

    // Open endpoint, no token needed, so rankings are visible to anyone.
    async function leaderboard() {
        try {
            const res = await fetch(LEADERBOARD_ENDPOINT);
            if (!res.ok) return null;
            const data = await res.json();
            return data.leaderboard || [];
        } catch (err) {
            console.warn('Leaderboard fetch failed:', err);
            return null;
        }
    }

    return { submit, leaderboard };
})();
