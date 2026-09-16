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
        // Stretch to the full internal canvas, same as every in-game
        // background. Without this the title art sits at its native
        // resolution and leaves bars around the edges.
        this.add.image(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'title_background')
            .setDisplaySize(INTERNAL_WIDTH, INTERNAL_HEIGHT)
            .setDepth(-1);

        this.makeText(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 100,
            'GRAND LINE RUN', 110, '#FFFFFF').setOrigin(0.5);

        this.makeText(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 110,
            'PRESS SPACE TO SET SAIL!', 42, '#FFFFFF').setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }

    makeText(x, y, msg, size, color) {
        return this.add.text(x, y, msg, {
            fontFamily: '"Comic Sans MS", "Trebuchet MS", Verdana, sans-serif',
            fontSize: `${size}px`,
            fontStyle: 'bold',
            color: color,
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#141414', blur: 0, fill: true }
        });
    }
}
