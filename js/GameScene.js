// const API_ENDPOINT = 'https://txv9q5zxwj.execute-api.us-east-1.amazonaws.com/prod/quote';
// Define constants are REMOVED here, they are in GameData.js

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.score = 0;
        this.currentArcIndex = 0;
        this.currentStrawHatIndex = 0;
        this.isGameOver = false;

        this.player = null;
        this.enemies = null;
        this.treasures = null;
        this.scoreText = null;
        this.background = null;
        
        this.currentHostileSpeed = BASE_HOSTILE_SPEED;
    }

    create() {
        this.isGameOver = false;
        this.score = 0;
        this.currentArcIndex = 0;
        this.currentStrawHatIndex = 0;
        this.currentHostileSpeed = BASE_HOSTILE_SPEED;
        
        // --- 1. ENVIRONMENT SETUP ---
        // FIX APPLIED: Removed .setDisplaySize
        this.background = this.add.image(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'arc_bg_0')
            .setDepth(-1);
        
        this.physics.world.setBounds(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.enabled = true;

        // --- 2. PLAYER SETUP ---
        this.player = this.physics.add.sprite(0, 0, 'sh1');
        this.player.setCollideWorldBounds(true);
        this.player.setDisplaySize(PLAYER_VISUAL_WIDTH, PLAYER_VISUAL_HEIGHT); 
        this.player.body.setSize(PLAYER_VISUAL_WIDTH, PLAYER_VISUAL_HEIGHT); 
        
        const offsetX = PLAYER_VISUAL_WIDTH / 2;
        const offsetY = PLAYER_VISUAL_HEIGHT / 2;
        this.player.body.setOffset(-offsetX, -offsetY); 
        
        // --- 3. GROUPS & ENEMIES ---
        this.enemies = this.physics.add.group();
        this.treasures = this.physics.add.group();

        this.spawnTreasure(TREASURE_SPEED);
        for (let i = 0; i < INITIAL_ENEMY_COUNT; i++) { 
            this.spawnEnemy(this.currentHostileSpeed);
        }

        // --- 4. COLLISION DETECTION ---
        this.physics.add.overlap(this.player, this.treasures, this.collectTreasure, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
        
        // --- 5. UI AND SCORE ---
        const arcName = ONE_PIECE_ARCS[this.currentArcIndex].name;
        this.scoreText = this.add.text(10, 10, `Score: 0 | Arc: ${arcName}`, 
            { fontSize: '48px', fill: '#FFFFFF' }
        ).setDepth(10); 
    }

    // --- (Rest of the methods: update, handlePlayerMovement, spawnTreasure, spawnEnemy, etc.) ---
    
    update(time, delta) {
        if (this.isGameOver) return; 
        
        this.handlePlayerMovement();
        
        const currentColor = GRAY_TEXT_ARCS.includes(this.currentArcIndex) ? COLORS.DARK_GRAY : COLORS.WHITE;
        this.scoreText.setColor(`#${currentColor.toString(16)}`);
    }

    handlePlayerMovement() {
        let moveVector = new Phaser.Math.Vector2(0, 0);

        if (this.cursors.left.isDown) {
            moveVector.x = -1;
        } else if (this.cursors.right.isDown) {
            moveVector.x = 1;
        }

        if (this.cursors.up.isDown) {
            moveVector.y = -1;
        } else if (this.cursors.down.isDown) {
            moveVector.y = 1;
        }

        if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
            this.player.setVelocity(moveVector.x * PLAYER_SPEED, moveVector.y * PLAYER_SPEED);
        } else {
            this.player.setVelocity(0);
        }
    }
    
    spawnTreasure(speed) {
        this.treasures.clear(true, true); 

        let x = Phaser.Math.Between(50, INTERNAL_WIDTH - 50);
        let y = Phaser.Math.Between(100, INTERNAL_HEIGHT - 50); 

        let treasure = this.treasures.create(x, y, 'treasure');
        
        treasure.setDisplaySize(TREASURE_VISUAL_SIZE, TREASURE_VISUAL_SIZE);
        treasure.body.setSize(TREASURE_VISUAL_SIZE, TREASURE_VISUAL_SIZE); 
        
        const offset = TREASURE_VISUAL_SIZE / 2; 
        treasure.body.setOffset(-offset, -offset);
        
        treasure.setCollideWorldBounds(true);
        treasure.setBounce(1);

        let xVel = speed * Phaser.Math.Between(-1, 1);
        let yVel = speed * Phaser.Math.Between(-1, 1);
        
        if (xVel === 0 && yVel === 0) { xVel = speed; }
        
        treasure.setVelocity(xVel, yVel);
    }

    spawnEnemy(speed) {
        const currentVillainIndex = ONE_PIECE_ARCS[this.currentArcIndex].villain_index;
        const villainKey = `villain${currentVillainIndex + 1}`;
        
        let x = Phaser.Math.Between(50, INTERNAL_WIDTH - 50);
        let y = Phaser.Math.Between(100, INTERNAL_HEIGHT - 50);

        let enemy = this.enemies.create(x, y, villainKey);
        
        enemy.setDisplaySize(ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE);
        enemy.body.setSize(ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE); 
        
        const offset = ENEMY_VISUAL_SIZE / 2;
        enemy.body.setOffset(-offset, -offset);
        
        enemy.setBounce(1);
        enemy.body.setCollideWorldBounds(true, 1, 1, 0);
        
        let xVel = (Phaser.Math.Between(0, 1) === 0 ? -1 : 1) * speed;
        let yVel = (Phaser.Math.Between(0, 1) === 0 ? -1 : 1) * speed;
        enemy.setVelocity(xVel, yVel);
    }
    
    collectTreasure(player, treasure) {
        treasure.disableBody(true, true); 
        this.spawnTreasure(TREASURE_SPEED);
        
        this.score++; 

        if (this.score % CAPTURE_THRESHOLD === 0) {
            // A. Advance Arc
            this.currentArcIndex = (this.currentArcIndex + 1) % ARC_COUNT;
            const nextArc = ONE_PIECE_ARCS[this.currentArcIndex];
            
            // B. Cycle Player Character
            const maxCrewIndex = nextArc.crew_count - 1;
            this.currentStrawHatIndex = (this.currentStrawHatIndex + 1) % (maxCrewIndex + 1);
            const newPlayerKey = `sh${this.currentStrawHatIndex + 1}`;
            this.player.setTexture(newPlayerKey);
            
            // C. Update Background
            const newBackgroundKey = `arc_bg_${this.currentArcIndex}`;
            this.background.setTexture(newBackgroundKey);
            
            // D. Difficulty Scaling & Enemy Management
            const arcMultiplier = this.score / CAPTURE_THRESHOLD;
            this.currentHostileSpeed = BASE_HOSTILE_SPEED + arcMultiplier * HOSTILE_SPEED_INCREMENT;
            
            // Update ALL existing enemy sprites and speeds
            const currentVillainIndex = nextArc.villain_index;
            const villainKey = `villain${currentVillainIndex + 1}`;
            
            this.enemies.children.each((enemy) => {
                const currentVel = enemy.body.velocity.normalize();
                enemy.setVelocity(currentVel.x * this.currentHostileSpeed, currentVel.y * this.currentHostileSpeed);
                enemy.setTexture(villainKey);
            });
            
            // E. Add new enemies if required
            const targetCount = getTargetHostileCount(this.currentArcIndex);
            while (this.enemies.countActive(true) < targetCount) {
                this.spawnEnemy(this.currentHostileSpeed);
            }
        }
        
        const currentArcName = ONE_PIECE_ARCS[this.currentArcIndex].name;
        this.scoreText.setText(`Score: ${this.score} | Arc: ${currentArcName}`);
    }
    
    // FINAL FIX: Removed all local quote fallbacks. Game now relies entirely on the API.
    hitEnemy(player, enemy) {
        if (this.isGameOver) return; 

        this.isGameOver = true;
        this.physics.pause(); 
        player.setTint(0xff0000); 

        // 1. Get the current Villain ID (villain_index is 0-based, DynamoDB ID is 1-based)
        const villainId = ONE_PIECE_ARCS[this.currentArcIndex].villain_index + 1;

        // 2. Call the Serverless API (passing the villainId as a query parameter)
        fetch(`${API_ENDPOINT}?villainId=${villainId}`)
            .then(response => response.json())
            .then(data => {
                // FIX: Assume the API successfully returned a 'quote' property.
                // If the Lambda is working, 'data.quote' will contain a random quote.
                const quote = data.quote; 
                this.displayArcFailureScreen(quote);
            })
            .catch(error => {
                console.error("CRITICAL API FAILURE: Quote could not be retrieved. Error:", error);
                
                // FIX: Use a generic, non-arc-specific message upon API failure.
                const apiFailureMessage = "API OFFLINE: Quote could not be retrieved from the Grand Line Server. Check console for network error.";
                this.displayArcFailureScreen(apiFailureMessage);
            });
    }
    
    displayArcFailureScreen(fetchedQuote) { 
        const lastArcIndex = this.currentArcIndex;
        const lastArc = ONE_PIECE_ARCS[lastArcIndex];
        
        const overlay = this.add.rectangle(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setDepth(11);
        
        const villainId = lastArc.villain_index;
        const villainKey = `villain${villainId + 1}`;
        const villainImage = this.add.image(INTERNAL_WIDTH - 50, 50, villainKey)
            .setOrigin(1, 0)
            .setDepth(12);

        const highestClearedArcIndex = Math.max(-1, lastArcIndex - 1);
        
        const quote = fetchedQuote; // <-- Uses the quote passed from the hitEnemy function
        this.add.text(INTERNAL_WIDTH / 2 - 200, INTERNAL_HEIGHT / 2 - 150, `"${quote}"`, { 
            fontSize: '45px', fill: '#FF0000', wordWrap: { width: 800 } 
        }).setOrigin(0.5).setDepth(12);
        
        let rewardMessage = "You failed to leave East Blue!";
        let rewardColor = '#FFFFFF';
        if (highestClearedArcIndex >= 0) {
            rewardMessage = `REWARD (Cleared Arc ${highestClearedArcIndex + 1}): ${ARC_REWARDS[highestClearedArcIndex]}`;
            rewardColor = `#${COLORS.GOLD.toString(16)}`;
        }
        this.add.text(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 40, rewardMessage, { 
            fontSize: '40px', fill: rewardColor 
        }).setOrigin(0.5).setDepth(12);

        this.add.text(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 50, 
            `Final Score: ${this.score} | Failed Arc: ${lastArc.name}`, 
            { fontSize: '50px', fill: '#FFFFFF' }
        ).setOrigin(0.5).setDepth(12);

        this.add.text(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 150, 
            "Press SPACE to Restart", 
            { fontSize: '50px', fill: '#00FF00' }
        ).setOrigin(0.5).setDepth(12);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('TitleScene'); 
        });
    }
}