// js/main.js

const config = {
    type: Phaser.AUTO,

    // Anything not covered by the game canvas is painted with this, so the
    // letterbox bars are black rather than whatever the page background is.
    backgroundColor: '#000000',

    scale: {
        // FIT preserves the 2:1 aspect ratio and scales to the largest size
        // that fits the window. The internal resolution stays 1400x700, so
        // physics is untouched at any window size.
        //
        // Swap to Phaser.Scale.ENVELOP to fill the window edge to edge with
        // no bars at all — but it crops the long axis, so hostiles and meat
        // can sit in areas you cannot see. FIT is the safer default.
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
            debug: false // flip to true to see the real hitboxes
        }
    }
};

var game = new Phaser.Game(config);

// Arrow keys and space scroll the page by default, which reads as input lag
// and can jolt the canvas out of view on a short window.
window.addEventListener('keydown', (e) => {
    const blocked = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
    if (blocked.includes(e.code)) e.preventDefault();
}, false);
