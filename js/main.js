// js/main.js

const config = {
    type: Phaser.AUTO,

    backgroundColor: '#000000',

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: INTERNAL_WIDTH,
        height: INTERNAL_HEIGHT,
        expandParent: true
    },

    render: {
        antialias: true,
        roundPixels: false
    },

    input: {
        keyboard: {
            target: window
        }
    },

    scene: [
        TitleScene,
        GameScene
    ],

    physics: {
        default: 'arcade',
        arcade: {
            // Pin the simulation to a 60Hz fixed step so a 144Hz monitor and
            // a 60Hz monitor play identically.
            fps: 60,
            fixedStep: true,
            timeScale: 1,
            debug: false // flip to true to see Phaser's own hitbox overlay
        }
    }
};

// Auth.init() must finish BEFORE Phaser boots. Coming back from the Cognito
// login page the URL carries ?code=..., and init() exchanges it for tokens.
// If the title scene rendered first it would decide the user is signed out
// and show the sign-in prompt to someone who just signed in.
(async () => {
    try {
        await Auth.init();
    } catch (err) {
        console.error('Auth init failed, continuing signed out:', err);
    }
    window.game = new Phaser.Game(config);
})();

// Arrow keys and space scroll the page by default, which reads as input lag
// and can jolt the canvas out of view on a short window.