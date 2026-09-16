// js/GameData.js

const API_ENDPOINT = 'https://fyk36bz02m.execute-api.us-east-1.amazonaws.com/prod/villainquotes';

// --- Game Dimensions ---
const INTERNAL_WIDTH = 1400;
const INTERNAL_HEIGHT = 700;

// --- Gameplay ---
const STRAW_HAT_COUNT = 12;
const VILLAIN_COUNT = 12;
const ARC_COUNT = 12;
const CAPTURE_THRESHOLD = 3;
const MAX_HOSTILE_COUNT = 6;

// --- Visual sizes -------------------------------------------------------
const SPRITE_SIZE = 135;
const PLAYER_VISUAL_WIDTH = SPRITE_SIZE;
const PLAYER_VISUAL_HEIGHT = SPRITE_SIZE;
const ENEMY_VISUAL_SIZE = SPRITE_SIZE;
const TREASURE_VISUAL_SIZE = 100;
const VILLAIN_FAIL_SIZE = 250;

// --- Hitboxes -----------------------------------------------------------
// Expressed as a FRACTION of the sprite's displayed size, not as pixels.
// 1.0 means the hitbox is exactly the sprite, edge to edge.
//
// Fractions are version-proof. Phaser computes body width as
// sourceWidth * scaleX, so passing frameWidth * fraction always lands on
// displayWidth * fraction, regardless of the source PNG's resolution and
// regardless of whether the body's cached scale has refreshed yet.
//
// Collision fires when the two boxes touch, so the trigger distance between
// centres is the SUM of both half-widths:
//
//   player 1.0 + hostile 0.65  ->  (135 + 88) / 2  = 111px
//   player 1.0 + treasure 1.0  ->  (135 + 100) / 2 = 118px
//
// The villains are reduced because their PNGs carry transparent padding,
// so at 1.0 you die to empty pixels on both sprites at once. The treasure
// stays at 1.0 so pickups remain generous.
const PLAYER_HITBOX_SCALE = 1.0;
const HOSTILE_HITBOX_SCALE = 0.65;
const TREASURE_HITBOX_SCALE = 1.0;

// Draws translucent boxes over the real collision bodies: green for the
// player, red for hostiles, gold for the treasure. Press H in-game to
// toggle without redeploying.
const SHOW_HITBOXES = true;

// --- Speeds -------------------------------------------------------------
// Pygame ran a locked 60fps loop, so px/frame * 60 = px/sec.
const PLAYER_SPEED = 420;            // was 7 px/frame
const TREASURE_SPEED = 300;          // was 5 px/frame
const BASE_HOSTILE_SPEED = 360;      // was 6 px/frame
const HOSTILE_SPEED_INCREMENT = 30;  // was +0.5 px/frame per arc

// Pygame applied full speed to BOTH axes at once, so holding two arrow keys
// moved you 594 px/s diagonally rather than 420.
const NORMALIZE_DIAGONAL = false;

// Spawn distances, in pixels, measured centre to centre from the player.
const MIN_SAFE_DISTANCE = 300;      // hostiles: never materialise on top of you
const MIN_TREASURE_DISTANCE = 180;  // meat: no free points from a spawn-on-player

// Color definitions (as hex)
const COLORS = {
    WHITE: 0xFFFFFF,
    DARK_GRAY: 0x646464,
    RED: 0xFF0000,
    GREEN: 0x00FF00,
    YELLOW: 0xFFFF00,
    GOLD: 0xFFD700
};

// --- ARC REWARD DEFINITIONS ---
const ARC_REWARDS = [
    "Earned Infinite Tangerines.",
    "Earned Warlord strength.",
    "Earned Dial Energy secrets.",
    "Earned Robin's undying loyalty.",
    "Earned Shadow protection.",
    "Earned Whitebeard's respect.",
    "Earned Jinbe's loyalty.",
    "Earned Dressrosa party invitation.",
    "Earned a taste of Sanji's cake.",
    "Earned audience with Momonosuke.",
    "Earned Vegapunk's inventions.",
    "Earned The One Piece!",
];

const ONE_PIECE_ARCS = [
    {"name": "East Blue Saga", "arc_file": "arc1.jpg", "villain_index": 0, "crew_count": 4,
     "quote": "Inferior humans! You think you can beat a fishman?!"},
    {"name": "Alabasta Saga", "arc_file": "arc2.jpg", "villain_index": 1, "crew_count": 5,
     "quote": "Weakness is a sin."},
    {"name": "Skypiea Saga", "arc_file": "arc3.jpg", "villain_index": 2, "crew_count": 5,
     "quote": "Grovel before me, you powerless lambs!"},
    {"name": "Enies Lobby Saga", "arc_file": "arc4.jpg", "villain_index": 3, "crew_count": 7,
     "quote": "This area is now under the control of the World Government."},
    {"name": "Thriller Bark Saga", "arc_file": "arc5.jpg", "villain_index": 4, "crew_count": 8,
     "quote": "Now this one will make a good zombie! Kishishishi!"},
    {"name": "Summit War Saga", "arc_file": "arc6.jpg", "villain_index": 5, "crew_count": 8,
     "quote": "How unlucky for you to meet me. I will be sure to leave no traces behind."},
    {"name": "Fishman Island Saga", "arc_file": "arc7.jpg", "villain_index": 6, "crew_count": 9,
     "quote": "The resentment held by fishmen is eternal..."},
    {"name": "Dressrosa Saga", "arc_file": "arc8.jpg", "villain_index": 7, "crew_count": 11,
     "quote": "The weak don't get to decide anything, not even how they die."},
    {"name": "Whole Cake Island Saga", "arc_file": "arc9.jpg", "villain_index": 8, "crew_count": 10,
     "quote": "Mamma-Mamma!"},
    {"name": "Wano Saga", "arc_file": "arc10.jpg", "villain_index": 9, "crew_count": 12,
     "quote": "So you're one of those kids who are playing at being pirates..."},
    {"name": "Egghead Saga", "arc_file": "arc11.jpg", "villain_index": 10, "crew_count": 10,
     "quote": "Such impertinence."},
    {"name": "Elbaf Saga", "arc_file": "arc12.jpg", "villain_index": 11, "crew_count": 10,
     "quote": "Allow Mu to show you...the dominance of God!"},
];

// Indices that require Dark Gray text (0-based: 1, 2, 8, 9)
const GRAY_TEXT_ARCS = [1, 2, 8, 9];

// One extra enemy every two arcs. Since arcIndex === score / 3,
// floor(score/6) === floor(arcIndex/2), matching the pygame thresholds.
function getTargetHostileCount(arcIndex) {
    return Math.min(Math.floor(arcIndex / 2) + 1, MAX_HOSTILE_COUNT);
}

const INITIAL_ENEMY_COUNT = getTargetHostileCount(0);