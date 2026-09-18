// js/GameScene.js
// Requires Phaser 3.60+ (uses body.setBoundsRectangle and fixedStep).

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.isGameOver = false;
        this.score = 0;
        this.currentArcIndex = 0;
        this.currentStrawHatIndex = 0;
        this.currentHostileSpeed = BASE_HOSTILE_SPEED;

        // Physics is paused on death; a restart must clear that.
        this.physics.resume();
        this.physics.world.setBounds(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);

        // --- 1. ENVIRONMENT ---------------------------------------------
        this.background = this.add.image(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2, 'arc_bg_0')
            .setDepth(-1);
        this.stretchToScreen(this.background);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // --- 2. PLAYER ---------------------------------------------------
        this.player = this.physics.add.sprite(
            PLAYER_VISUAL_WIDTH / 2, PLAYER_VISUAL_HEIGHT / 2, 'sh1'
        ).setDepth(5);

        this.fitSprite(this.player,
            PLAYER_VISUAL_WIDTH, PLAYER_VISUAL_HEIGHT, PLAYER_HITBOX_SCALE);

        this.player.setCollideWorldBounds(true);
        this.applyVisualBounds(this.player,
            PLAYER_VISUAL_WIDTH, PLAYER_VISUAL_HEIGHT, PLAYER_HITBOX_SCALE);

        // --- 3. GROUPS & SPAWNS ------------------------------------------
        this.enemies = this.physics.add.group();
        this.treasures = this.physics.add.group();

        this.spawnTreasure();
        for (let i = 0; i < INITIAL_ENEMY_COUNT; i++) {
            this.spawnEnemy(this.currentHostileSpeed);
        }

        // --- 4. COLLISIONS -----------------------------------------------
        this.physics.add.overlap(this.player, this.treasures, this.collectTreasure, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

        // --- 5. UI --------------------------------------------------------
        this.scoreText = this.makeText(10, 10, '', 60, '#FFFFFF').setDepth(10);
        this.refreshScoreText();

        // --- 6. HITBOX OVERLAY --------------------------------------------
        this.hitboxGfx = this.add.graphics().setDepth(6);
        this.showHitboxes = SHOW_HITBOXES;

        this.input.keyboard.on('keydown-H', () => {
            this.showHitboxes = !this.showHitboxes;
        });
    }

    update() {
        if (!this.isGameOver) {
            this.handlePlayerMovement();
        }
        this.drawHitboxes();
    }

    // ====================================================================
    // HITBOX OVERLAY
    // ====================================================================

    drawHitboxes() {
        const g = this.hitboxGfx;
        g.clear();
        if (!this.showHitboxes) return;

        const box = (body, color) => {
            if (!body) return;
            g.fillStyle(color, 0.15);
            g.fillRect(body.x, body.y, body.width, body.height);
            g.lineStyle(2, color, 0.9);
            g.strokeRect(body.x, body.y, body.width, body.height);
        };

        box(this.player.body, 0x00FF88);
        this.enemies.getChildren().forEach(e => box(e.body, 0xFF3355));
        this.treasures.getChildren().forEach(t => {
            if (t.active) box(t.body, 0xFFD700);
        });
    }

    // ====================================================================
    // SIZING HELPERS
    // ====================================================================

    fitSprite(sprite, visualW, visualH, hitScale) {
        sprite.setDisplaySize(visualW, visualH);
        const fw = sprite.frame.realWidth;
        const fh = sprite.frame.realHeight;
        sprite.body.setSize(fw * hitScale, fh * hitScale, true);
    }

    setSkin(sprite, textureKey, visualW, visualH, hitScale) {
        sprite.setTexture(textureKey);
        this.fitSprite(sprite, visualW, visualH, hitScale);
    }

    applyVisualBounds(sprite, visualW, visualH, hitScale) {
        const padX = (visualW - visualW * hitScale) / 2;
        const padY = (visualH - visualH * hitScale) / 2;
        if (padX === 0 && padY === 0) return;

        sprite.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
            -padX, -padY,
            INTERNAL_WIDTH + padX * 2,
            INTERNAL_HEIGHT + padY * 2));
    }

    stretchToScreen(image) {
        image.setDisplaySize(INTERNAL_WIDTH, INTERNAL_HEIGHT);
    }

    makeText(x, y, msg, size, color, wrapWidth) {
        const style = {
            fontFamily: '"Comic Sans MS", "Trebuchet MS", Verdana, sans-serif',
            fontSize: `${size}px`,
            fontStyle: 'bold',
            color: color,
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#141414', blur: 0, fill: true }
        };
        if (wrapWidth) style.wordWrap = { width: wrapWidth };
        return this.add.text(x, y, msg, style);
    }

    // ====================================================================
    // MOVEMENT
    // ====================================================================

    handlePlayerMovement() {
        let dx = 0;
        let dy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
        if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
        if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

        if (NORMALIZE_DIAGONAL && dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        this.player.setVelocity(dx * PLAYER_SPEED, dy * PLAYER_SPEED);
    }

    // ====================================================================
    // SPAWNING
    // ====================================================================

    findSpawnPoint(visualW, visualH, minDistance) {
        const halfW = visualW / 2;
        const halfH = visualH / 2;

        for (let attempt = 0; attempt < 100; attempt++) {
            const x = Phaser.Math.Between(halfW, INTERNAL_WIDTH - halfW);
            const y = Phaser.Math.Between(halfH, INTERNAL_HEIGHT - halfH);

            if (!minDistance) return { x, y };

            const d = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
            if (d >= minDistance) return { x, y };
        }

        const corners = [
            { x: halfW, y: halfH },
            { x: INTERNAL_WIDTH - halfW, y: halfH },
            { x: halfW, y: INTERNAL_HEIGHT - halfH },
            { x: INTERNAL_WIDTH - halfW, y: INTERNAL_HEIGHT - halfH }
        ];
        let best = corners[0];
        let bestDist = -1;
        for (const c of corners) {
            const d = Phaser.Math.Distance.Between(c.x, c.y, this.player.x, this.player.y);
            if (d > bestDist) { bestDist = d; best = c; }
        }
        return best;
    }

    randomSign() {
        return Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    }

    spawnTreasure() {
        this.treasures.clear(true, true);

        const pos = this.findSpawnPoint(
            TREASURE_VISUAL_SIZE, TREASURE_VISUAL_SIZE, MIN_TREASURE_DISTANCE);
        const treasure = this.treasures.create(pos.x, pos.y, 'treasure');

        this.fitSprite(treasure,
            TREASURE_VISUAL_SIZE, TREASURE_VISUAL_SIZE, TREASURE_HITBOX_SCALE);

        treasure.setCollideWorldBounds(true);
        treasure.setBounce(1);
        this.applyVisualBounds(treasure,
            TREASURE_VISUAL_SIZE, TREASURE_VISUAL_SIZE, TREASURE_HITBOX_SCALE);
        treasure.setDepth(3);

        treasure.setVelocity(
            this.randomSign() * TREASURE_SPEED,
            this.randomSign() * TREASURE_SPEED);
    }

    spawnEnemy(speed) {
        const villainIndex = ONE_PIECE_ARCS[this.currentArcIndex].villain_index;
        const villainKey = `villain${villainIndex + 1}`;

        const pos = this.findSpawnPoint(
            ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE, MIN_SAFE_DISTANCE);
        const enemy = this.enemies.create(pos.x, pos.y, villainKey);

        this.fitSprite(enemy,
            ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE, HOSTILE_HITBOX_SCALE);

        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        this.applyVisualBounds(enemy,
            ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE, HOSTILE_HITBOX_SCALE);
        enemy.setDepth(4);

        enemy.setVelocity(this.randomSign() * speed, this.randomSign() * speed);
    }

    // ====================================================================
    // GAME EVENTS
    // ====================================================================

    collectTreasure(player, treasure) {
        if (this.isGameOver || !treasure.active) return;

        treasure.disableBody(true, true);
        this.score++;

        if (this.score % CAPTURE_THRESHOLD === 0) {
            this.advanceArc();
        }

        this.spawnTreasure();
        this.refreshScoreText();
    }

    advanceArc() {
        this.currentArcIndex = (this.currentArcIndex + 1) % ARC_COUNT;
        const nextArc = ONE_PIECE_ARCS[this.currentArcIndex];

        this.currentStrawHatIndex = (this.currentStrawHatIndex + 1) % nextArc.crew_count;
        this.setSkin(this.player, `sh${this.currentStrawHatIndex + 1}`,
            PLAYER_VISUAL_WIDTH, PLAYER_VISUAL_HEIGHT, PLAYER_HITBOX_SCALE);

        this.background.setTexture(`arc_bg_${this.currentArcIndex}`);
        this.stretchToScreen(this.background);

        const arcMultiplier = this.score / CAPTURE_THRESHOLD;
        this.currentHostileSpeed = BASE_HOSTILE_SPEED + arcMultiplier * HOSTILE_SPEED_INCREMENT;

        const villainKey = `villain${nextArc.villain_index + 1}`;

        this.enemies.getChildren().forEach((enemy) => {
            if (!enemy.body) return;
            const sx = Math.sign(enemy.body.velocity.x) || 1;
            const sy = Math.sign(enemy.body.velocity.y) || 1;
            enemy.setVelocity(sx * this.currentHostileSpeed, sy * this.currentHostileSpeed);
            this.setSkin(enemy, villainKey,
                ENEMY_VISUAL_SIZE, ENEMY_VISUAL_SIZE, HOSTILE_HITBOX_SCALE);
        });

        const targetCount = getTargetHostileCount(this.currentArcIndex);
        while (this.enemies.countActive(true) < targetCount) {
            this.spawnEnemy(this.currentHostileSpeed);
        }
    }

    refreshScoreText() {
        const arcName = ONE_PIECE_ARCS[this.currentArcIndex].name;
        const color = GRAY_TEXT_ARCS.includes(this.currentArcIndex)
            ? COLORS.DARK_GRAY : COLORS.WHITE;
        this.scoreText.setText(`Score: ${this.score} | Arc: ${arcName}`);
        this.scoreText.setColor('#' + color.toString(16).padStart(6, '0'));
    }

    hitEnemy(player, enemy) {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.physics.pause();
        player.setTint(0xff0000);

        // Draw the failure screen immediately from the local quote, then let
        // both network calls fill in asynchronously. Neither blocks the UI.
        const localQuote = ONE_PIECE_ARCS[this.currentArcIndex].quote;
        this.displayArcFailureScreen(localQuote);

        this.fetchVillainQuote();
        this.submitScore();
    }

    fetchVillainQuote() {
        const villainId = ONE_PIECE_ARCS[this.currentArcIndex].villain_index + 1;

        fetch(`${API_ENDPOINT}?VillainId=${villainId}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.quote && this.quoteText && this.quoteText.active) {
                    this.quoteText.setText(`"${data.quote}"`);
                }
            })
            .catch(error => {
                console.warn('Quote API unavailable, using local quote.', error);
            });
    }

    // The server decides whether this beat the player's record; the client
    // just reports the score and displays the verdict.
    async submitScore() {
        const result = await Scores.submit(this.score);

        // The player may have restarted before the response arrived.
        if (!this.highScoreText || !this.highScoreText.active) return;

        if (!result.ok) {
            const message = result.reason === 'expired'
                ? 'Session expired - score not saved'
                : 'Score could not be saved';
            this.highScoreText.setText(message).setColor('#FF9900');
            return;
        }

        if (result.newHighScore) {
            this.highScoreText.setText('NEW PERSONAL BEST!').setColor('#FFD700');
            this.tweens.add({
                targets: this.highScoreText,
                scale: { from: 1, to: 1.15 },
                duration: 400,
                yoyo: true,
                repeat: 2
            });
        } else {
            this.highScoreText.setText('Score saved').setColor('#00FF88');
        }
    }

    displayArcFailureScreen(quote) {
        const lastArc = ONE_PIECE_ARCS[this.currentArcIndex];

        this.add.rectangle(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setDepth(11);

        const villainImage = this.add.image(
            INTERNAL_WIDTH - 50, 50, `villain${lastArc.villain_index + 1}`
        ).setOrigin(1, 0).setDepth(12);
        villainImage.setDisplaySize(VILLAIN_FAIL_SIZE, VILLAIN_FAIL_SIZE);

        this.quoteText = this.makeText(
            INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 190,
            `"${quote}"`, 42, '#FF4136', 900
        ).setOrigin(0.5).setAlign('center').setDepth(12);

        const highestCleared = this.currentArcIndex - 1;
        const rewardMessage = highestCleared >= 0
            ? `REWARD (Cleared Arc ${highestCleared + 1}): ${ARC_REWARDS[highestCleared]}`
            : 'You failed to leave East Blue!';
        const rewardColor = highestCleared >= 0
            ? '#' + COLORS.GOLD.toString(16).padStart(6, '0')
            : '#FFFFFF';

        this.makeText(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 60,
            rewardMessage, 38, rewardColor, 1100)
            .setOrigin(0.5).setAlign('center').setDepth(12);

        this.makeText(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 30,
            `Final Score: ${this.score} | Failed Arc: ${lastArc.name}`, 44, '#FFFFFF')
            .setOrigin(0.5).setDepth(12);

        // Placeholder, replaced by submitScore() when the API answers.
        this.highScoreText = this.makeText(
            INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 100,
            'Saving score...', 32, '#CCCCCC'
        ).setOrigin(0.5).setDepth(12);

        this.makeText(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 180,
            'Press SPACE to Restart', 44, '#2ECC40')
            .setOrigin(0.5).setDepth(12);

        this.time.delayedCall(400, () => {
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('TitleScene');
            });
        });
    }
}