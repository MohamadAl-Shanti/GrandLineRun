// js/TitleScene.js

// The title screen is a two-column layout: a main column on the left for
// the title and prompts, and a fixed-width leaderboard panel on the right.
// Everything in the main column centres on MAIN_CX rather than on the
// canvas centre, so it stays visually balanced against the panel instead
// of being nudged left by an arbitrary offset.
const PANEL_WIDTH = 400;
const MAIN_CX = (INTERNAL_WIDTH - PANEL_WIDTH) / 2;   // 500
const PANEL_CX = INTERNAL_WIDTH - (PANEL_WIDTH / 2);  // 1200

class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload() {
        this.load.image('title_background', 'assets/background.jpg');
        this.load.image('treasure', 'assets/target.png');

        // Held as a property so create() can remove it once loading ends.
        this.loadingText = this.add.text(
            INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'Loading...',
            { fontSize: '32px', color: '#FFFFFF' }).setOrigin(0.5);

        ONE_PIECE_ARCS.forEach((arc, index) => {
            this.load.image(`arc_bg_${index}`, `assets/${arc.arc_file}`);
        });

        for (let i = 1; i <= STRAW_HAT_COUNT; i++) {
            this.load.image(`sh${i}`, `assets/sh${i}.png`);
        }

        for (let i = 1; i <= VILLAIN_COUNT; i++) {
            this.load.image(`villain${i}`, `assets/villain${i}.png`);
        }
    }

    create() {
        if (this.loadingText) {
            this.loadingText.destroy();
            this.loadingText = null;
        }

        // create() runs again on every return to this scene, so per-entry
        // state has to be reset or stale flags leak through.
        this.canStart = false;
        this.redirecting = false;
        this.startKey = null;

        this.add.image(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'title_background')
            .setDisplaySize(INTERNAL_WIDTH, INTERNAL_HEIGHT)
            .setDepth(-1);

        // Dim the busy artwork so text stays legible.
        this.add.rectangle(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT, 0x000000, 0.45)
            .setOrigin(0, 0)
            .setDepth(0);

        // Darker strip behind the leaderboard so the columns read as
        // separate regions.
        this.add.rectangle(INTERNAL_WIDTH - PANEL_WIDTH, 0,
            PANEL_WIDTH, INTERNAL_HEIGHT, 0x000000, 0.45)
            .setOrigin(0, 0)
            .setDepth(0);

        this.makeText(MAIN_CX, 150, 'GRAND LINE RUN', 88, '#FFFFFF')
            .setOrigin(0.5);

        if (Auth.isSignedIn()) {
            this.showSignedIn();
        } else {
            this.showSignInPrompt();
        }

        this.renderLeaderboard();
    }

    // Polling the key each frame rather than listening for a one-shot
    // keydown. An event listener can be consumed by a stale handler or miss
    // a press landing during a scene transition; JustDown reads the key's
    // current state and cannot be swallowed.
    update() {
        if (!this.startKey) return;

        if (Phaser.Input.Keyboard.JustDown(this.startKey)) {
            if (Auth.isSignedIn()) {
                if (this.canStart) this.scene.start('GameScene');
            } else {
                this.goToLogin();
            }
        }
    }

    goToLogin() {
        if (this.redirecting) return;
        this.redirecting = true;
        Auth.login();
    }

    // ----------------------------------------------------------------
    // Signed out: no path to the game until they authenticate.
    // ----------------------------------------------------------------
    showSignInPrompt() {
        this.makeText(MAIN_CX, 330, 'SIGN IN TO SET SAIL', 48, '#FFD700')
            .setOrigin(0.5);

        this.makeText(MAIN_CX, 410, 'Press SPACE or click to sign in', 30, '#FFFFFF')
            .setOrigin(0.5);

        this.makeText(MAIN_CX, 470, 'An account is needed to record your score',
            22, '#CCCCCC').setOrigin(0.5);

        this.startKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.on('pointerdown', () => this.goToLogin());
    }

    // ----------------------------------------------------------------
    // Signed in: normal start, plus identity and a way out.
    // ----------------------------------------------------------------
    showSignedIn() {
        this.makeText(MAIN_CX, 300, `Welcome, ${Auth.getUsername()}`, 34, '#00FF88')
            .setOrigin(0.5);

        this.makeText(MAIN_CX, 390, 'PRESS SPACE TO SET SAIL!', 46, '#FFFFFF')
            .setOrigin(0.5);

        this.makeText(MAIN_CX, 470, 'Press L to sign out', 22, '#CCCCCC')
            .setOrigin(0.5);

        this.startKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Brief lockout so a SPACE held from the failure screen does not
        // launch a new run the instant this scene appears.
        this.time.delayedCall(300, () => { this.canStart = true; });

        this.input.keyboard.once('keydown-L', () => Auth.logout());

        this.input.on('pointerdown', () => {
            if (this.canStart) this.scene.start('GameScene');
        });
    }

    // ----------------------------------------------------------------
    // Leaderboard panel. Open endpoint, so it renders for signed-out
    // visitors too.
    // ----------------------------------------------------------------
    async renderLeaderboard() {
        // Column positions within the panel, as offsets from its centre.
        const rankX = PANEL_CX - 150;
        const nameX = PANEL_CX - 105;
        const scoreX = PANEL_CX + 150;
        const firstRowY = 175;
        const rowHeight = 44;

        this.makeText(PANEL_CX, 95, 'TOP PIRATES', 36, '#FFD700').setOrigin(0.5);

        const status = this.makeText(PANEL_CX, 175, 'Loading...', 22, '#CCCCCC')
            .setOrigin(0.5);

        const entries = await Scores.leaderboard();

        // The player may have started a run while this was in flight.
        if (!this.scene.isActive()) return;

        if (entries === null) {
            status.setText('Leaderboard unavailable');
            return;
        }
        if (entries.length === 0) {
            status.setText('No scores yet. Be the first.');
            return;
        }

        status.destroy();

        const me = Auth.isSignedIn() ? Auth.getUsername() : null;

        entries.slice(0, 10).forEach((entry, i) => {
            const color = entry.username === me ? '#00FF88' : '#FFFFFF';
            const y = firstRowY + (i * rowHeight);

            this.makeText(rankX, y, `${entry.rank}.`, 24, color)
                .setOrigin(0, 0.5);

            // Long names would otherwise collide with the score column.
            const name = entry.username.length > 13
                ? entry.username.slice(0, 12) + '\u2026'
                : entry.username;

            this.makeText(nameX, y, name, 24, color).setOrigin(0, 0.5);
            this.makeText(scoreX, y, String(entry.score), 24, color)
                .setOrigin(1, 0.5);
        });
    }

    makeText(x, y, msg, size, color) {
        return this.add.text(x, y, msg, {
            fontFamily: '"Comic Sans MS", "Trebuchet MS", Verdana, sans-serif',
            fontSize: `${size}px`,
            fontStyle: 'bold',
            color: color,
            stroke: '#000000',
            strokeThickness: 5,
            shadow: { offsetX: 3, offsetY: 3, color: '#141414', blur: 0, fill: true }
        }).setDepth(2);
    }
}