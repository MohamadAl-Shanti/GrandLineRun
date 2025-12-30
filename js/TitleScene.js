class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload() {
        console.log("Loading All Game Assets...");
        
        // --- 1. Load Main Assets ---
        this.load.image('title_background', 'assets/background.jpg');
        this.load.image('treasure', 'assets/target.png'); 

        let loadingText = this.add.text(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'Loading...', { fontSize: '32px', fill: '#FFF' }).setOrigin(0.5);
        
        // --- 2. Load ALL Arc Backgrounds (arc1.jpg to arc12.jpg) ---
        ONE_PIECE_ARCS.forEach((arc, index) => {
            this.load.image(`arc_bg_${index}`, `assets/${arc.arc_file}`);
        });

        // --- 3. Load ALL Player Sprites (sh1.png to sh12.png) ---
        for (let i = 1; i <= STRAW_HAT_COUNT; i++) {
            this.load.image(`sh${i}`, `assets/sh${i}.png`);
        }
        
        // --- 4. Load ALL Villain Sprites (villain1.png to villain12.png) ---
        for (let i = 1; i <= VILLAIN_COUNT; i++) {
            this.load.image(`villain${i}`, `assets/villain${i}.png`); 
        }
    }

    create() {
        console.log("Assets Loaded. Entering Title Scene.");
        
        // FIX APPLIED: Removed manual scaling
        this.add.image(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'title_background');
        
        this.add.text(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 100, 'GRAND LINE RUN', { fontSize: '150px', fill: '#FF9900' }).setOrigin(0.5);
        this.add.text(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 100, 'PRESS SPACE TO SET SAIL!', { fontSize: '50px', fill: '#FFFF00' }).setOrigin(0.5);
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}