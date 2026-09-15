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
    }

    update() {
        if (this.isGameOver) return;
        this.handlePlayerMovement();
    }

    // ====================================================================
    // SIZING HELPERS
    // ====================================================================

    // Sets the displayed size and gives the sprite a hitbox that is exactly
    // `hitScale` of that size, centred on the art.
    //
    // The body size is given as a fraction of the FRAME, never in screen
    // pixels. Phaser computes body.width = sourceWidth * scaleX internally,
    // so frameWidth * hitScale always resolves to displayWidth * hitScale —
    // correct for every texture regardless of its source resolution, and
    // correct even on the frame where the sprite was just created or
    // re-skinned (when the body's cached scale can still be stale).
    fitSprite(sprite, visualW, visualH, hitScale) {
        sprite.setDisplaySize(visualW, visualH);

        const fw = sprite.frame.realWidth;
        const fh = sprite.frame.realHeight;

        sprite.body.setSize(fw * hitScale, fh * hitScale, true);
    }

    // Swap a texture without losing the display size or the hitbox.
    // setTexture keeps the scale but swaps the frame underneath it, so both
    // have to be re-applied or the sprite silently changes size.
    setSkin(sprite, textureKey, visualW, visualH, hitScale) {
        sprite.setTexture(textureKey);
        this.fitSprite(sprite, visualW, visualH, hitScale);
    }

    // When the hitbox is smaller than the art, clamping the BODY to the
    // screen lets the art hang off the edge. Expanding the bounds by the
    // difference makes the sprite stop flush with the edge instead. At
    // hitScale 1.0 the padding is zero and the default world bounds are used.
    applyVisualBounds(sprite, visualW, visualH, hitScale) {
        const padX = (visualW - visualW * hitScale) / 2;
        const padY = (visualH - visualH * hitScale) / 2;
        if (padX === 0 && padY === 0) return;

        sprite.body.setBoundsRectangle(new Phaser.Geom.Rectangle(
            -padX, -padY,
            INTERNAL_WIDTH + padX * 2,
            INTERNAL_HEIGHT + padY * 2));
    }

    // Backgrounds are stretched to the full internal canvas, which is what
    // pygame's transform.scale did. Must be re-applied after every
    // setTexture for the same reason as setSkin.
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

        // Additive, not else-if: pressing both directions cancels out, the
        // same as pygame's separate `if` statements.
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

        // Cornered player — fall back to the farthest corner.
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

        // Always diagonal, as in pygame.
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

        // Preserve direction, reset magnitude per axis. Normalizing here (as
        // the original did) left veteran enemies at 0.707x the per-axis speed
        // of freshly spawned ones, so the fleet desynced a little each arc.
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

        // Draw the failure screen immediately from the local quote, then
        // upgrade it if the API answers. Blocking the screen on the fetch
        // meant a slow network left the player staring at a frozen game.
        const localQuote = ONE_PIECE_ARCS[this.currentArcIndex].quote;
        this.displayArcFailureScreen(localQuote);

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
            INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 170,
            `"${quote}"`, 42, '#FF4136', 900
        ).setOrigin(0.5).setAlign('center').setDepth(12);

        const highestCleared = this.currentArcIndex - 1;
        const rewardMessage = highestCleared >= 0
            ? `REWARD (Cleared Arc ${highestCleared + 1}): ${ARC_REWARDS[highestCleared]}`
            : 'You failed to leave East Blue!';
        const rewardColor = highestCleared >= 0
            ? '#' + COLORS.GOLD.toString(16).padStart(6, '0')
            : '#FFFFFF';

        this.makeText(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 - 40,
            rewardMessage, 38, rewardColor, 1100)
            .setOrigin(0.5).setAlign('center').setDepth(12);

        this.makeText(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 50,
            `Final Score: ${this.score} | Failed Arc: ${lastArc.name}`, 44, '#FFFFFF')
            .setOrigin(0.5).setDepth(12);

        this.makeText(INTERNAL_WIDTH / 2, INTERNAL_HEIGHT / 2 + 150,
            'Press SPACE to Restart', 44, '#2ECC40')
            .setOrigin(0.5).setDepth(12);

        // Short delay so a SPACE still held from a previous screen doesn't
        // skip straight past the results.
        this.time.delayedCall(400, () => {
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.start('TitleScene');
            });
        });
    }
}
