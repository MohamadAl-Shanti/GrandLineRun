// js/main.js

// Game configuration for Phaser
const config = {
    type: Phaser.AUTO, // Use WebGL if available, otherwise Canvas
    scale: {
        // FIXED: Changed mode to NONE to disable dynamic scaling and prevent the growth bug.
        mode: Phaser.Scale.NONE,
        
        // autoCenter is set to NONE as it's no longer necessary with fixed scaling.
        autoCenter: Phaser.Scale.NONE, 
        
        width: INTERNAL_WIDTH,
        height: INTERNAL_HEIGHT
    },
    parent: 'game-container',
    scene: [
        TitleScene, 
        GameScene 
    ],
    physics: {
        default: 'arcade', 
        arcade: {
            // debug: true 
        }
    }
};

// Initialize the game
var game = new Phaser.Game(config);