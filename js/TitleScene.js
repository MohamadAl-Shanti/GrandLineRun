// js/TitleScene.js

class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload() {
        this.load.image('title_background', 'assets/background.jpg');
        this.load.image('treasure', 'assets/target.png');

        this.add.text(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'Loading...',
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
        this.add.image(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'title_background')
            .setDisplaySize(INTERNAL_WIDTH, INTERNAL_HEIGHT)
            .setDepth(-1);

        // Darkens the art so text stays readable over any background.
        this.add.rectangle(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT, 0x000000, 0.35)
            .setOrigin(0, 0)
            .setDepth(0);

        this.makeText(INTERNAL_WIDTH / 2 - 180, 150,
            'GRAND LINE RUN', 96, '#FFFFFF').setOrigin(0.5);

        if (Auth.isSignedIn()) {
            this.showSignedIn();
        } else {
            this.showSignInPrompt();
        }

        this.renderLeaderboard();
    }

    // ----------------------------------------------------------------
    // Signed out: nothing starts the game until they authenticate.
    // ----------------------------------------------------------------
    showSignInPrompt() {
        this.makeText(INTERNAL_WIDTH / 2 - 180, 300,
            'SIGN IN TO SET SAIL', 46, '#FFD700').setOrigin(0.5);

        this.makeText(INTERNAL_WIDTH / 2 - 180, 370,
            'Press SPACE or click to sign in', 30, '#FFFFFF').setOrigin(0.5);

        this.makeText(INTERNAL_WIDTH / 2 - 180, 430,
            'An account is needed to record your score', 22, '#CCCCCC')
            .setOrigin(0.5);

        const goToLogin = () => {
            if (this.redirecting) return;   // guard against double-fire
            this.redirecting = true;
            Auth.login();
        };

        this.input.keyboard.once('keydown-SPACE', goToLogin);
        this.input.once('pointerdown', goToLogin);
    }

    // ----------------------------------------------------------------
    // Signed in: normal start, plus who you are and how to sign out.
    // ----------------------------------------------------------------
    showSignedIn() {
        this.makeText(INTERNAL_WIDTH / 2 - 180, 290,
            `Welcome, ${Auth.getUsername()}`, 34, '#00FF88').setOrigin(0.5);

        this.makeText(INTERNAL_WIDTH / 2 - 180, 360,
            'PRESS SPACE TO SET SAIL!', 42, '#FFFFFF').setOrigin(0.5);

        this.makeText(INTERNAL_WIDTH / 2 - 180, 430,
            'Press L to sign out', 22, '#CCCCCC').setOrigin(0.5);

        // A short delay stops a SPACE held down from the failure screen
        // launching a new run instantly.
        this.time.delayedCall(300, () => {
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('GameScene');
            });
        });

        this.input.keyboard.once('keydown-L', () => {
            Auth.logout();
        });
    }

    // ----------------------------------------------------------------
    // Leaderboard panel, right-hand side. Open endpoint, so it renders
    // whether or not the visitor is signed in.
    // ----------------------------------------------------------------
    async renderLeaderboard() {
        const panelX = INTERNAL_WIDTH - 330;

        this.makeText(panelX, 90, 'TOP PIRATES', 34, '#FFD700').setOrigin(0.5);

        const status = this.makeText(panelX, 150, 'Loading...', 22, '#CCCCCC')
            .setOrigin(0.5);

        const entries = await Scores.leaderboard();

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
            const isMe = entry.username === me;
            const color = isMe ? '#00FF88' : '#FFFFFF';
            const y = 145 + (i * 42);

            this.makeText(panelX - 140, y,
                `${entry.rank}.`, 24, color).setOrigin(0, 0.5);

            // Long usernames would otherwise run into the score column.
            const name = entry.username.length > 14
                ? entry.username.slice(0, 13) + '\u2026'
                : entry.username;

            this.makeText(panelX - 100, y, name, 24, color).setOrigin(0, 0.5);
            this.makeText(panelX + 140, y,
                String(entry.score), 24, color).setOrigin(1, 0.5);
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