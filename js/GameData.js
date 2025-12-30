// js/GameData.js

const API_ENDPOINT = 'https://7f65nb0g08.execute-api.us-east-1.amazonaws.com/prod/quote';

// --- Game Dimensions ---
const INTERNAL_WIDTH = 1400;
const INTERNAL_HEIGHT = 700;

// --- Gameplay & Scaling Constants ---
const STRAW_HAT_COUNT = 12;
const VILLAIN_COUNT = 12;
const ARC_COUNT = 12;

const CAPTURE_THRESHOLD = 3;
const BASE_HOSTILE_SPEED = 150;
const HOSTILE_SPEED_INCREMENT = 30;

// --- Visual & Hitbox Constants ---
const PLAYER_VISUAL_WIDTH = 100;
const PLAYER_VISUAL_HEIGHT = 200;
const TREASURE_VISUAL_SIZE = 100;
const ENEMY_VISUAL_SIZE = 120;

// Define constants for Pygame hitbox sizes
// CHANGED: Hitbox size now matches visual size for sensitive, border-to-border collision
const PLAYER_HITBOX_SIZE = PLAYER_VISUAL_WIDTH; // Set to 100 (Note: Height will be set to 200 in GameScene)
const HOSTILE_HITBOX_SIZE = ENEMY_VISUAL_SIZE; // Set to 120
const TREASURE_HITBOX_SIZE = TREASURE_VISUAL_SIZE; // Set to 100

const PLAYER_SPEED = 400; 
const TREASURE_SPEED = 300; 
const VILLAIN_FAIL_SIZE = 250; 

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
    // Arc 1 (Index 0): East Blue (Arlong)
    {"name": "East Blue Saga", "arc_file": "arc1.jpg", "villain_index": 0, "crew_count": 4, 
     "quote": "Inferior humans! You think you can beat a fishman?!"},
    // Arc 2 (Index 1): Alabasta (Crocodile)
    {"name": "Alabasta Saga", "arc_file": "arc2.jpg", "villain_index": 1, "crew_count": 5, 
     "quote": "Weakness is a sin."},
    // Arc 3 (Index 2): Skypiea (Enel)
    {"name": "Skypiea Saga", "arc_file": "arc3.jpg", "villain_index": 2, "crew_count": 5, 
     "quote": "Grovel before me, you powerless lambs!"},
    // Arc 4 (Index 3): Enies Lobby (Lucci)
    {"name": "Enies Lobby Saga", "arc_file": "arc4.jpg", "villain_index": 3, "crew_count": 7,
     "quote": "This area is now under the control of the World Government."},
    // Arc 5 (Index 4): Thriller Bark (Moria)
    {"name": "Thriller Bark Saga", "arc_file": "arc5.jpg", "villain_index": 4, "crew_count": 8,
     "quote": "Now this one will make a good zombie! Kishishishi!"},
    // Arc 6 (Index 5): Summit War (Akainu)
    {"name": "Summit War Saga", "arc_file": "arc6.jpg", "villain_index": 5, "crew_count": 8,
     "quote": "How unlucky for you to meet me. I will be sure to leave no traces behind."},
    // Arc 7 (Index 6): Fishman Island (Hody Jones)
    {"name": "Fishman Island Saga", "arc_file": "arc7.jpg", "villain_index": 6, "crew_count": 9,
     "quote": "The resentment held by fishmen is eternal..."},
    // Arc 8 (Index 7): Dressrosa (Doflamingo)
    {"name": "Dressrosa Saga", "arc_file": "arc8.jpg", "villain_index": 7, "crew_count": 11,
     "quote": "The weak don't get to decide anything, not even how they die."},
    // Arc 9 (Index 8): Whole Cake (Big Mom)
    {"name": "Whole Cake Island Saga", "arc_file": "arc9.jpg", "villain_index": 8, "crew_count": 10,
     "quote": "Mamma-Mamma"}, 
    // Arc 10 (Index 9): Wano (Kaido)
    {"name": "Wano Saga", "arc_file": "arc10.jpg", "villain_index": 9, "crew_count": 12,
     "quote": "So you're one of those kids who are playing at being pirates..."}, 
    // Arc 11 (Index 10): Egghead (Saturn)
    {"name": "Egghead Saga", "arc_file": "arc11.jpg", "villain_index": 10, "crew_count": 10,
     "quote": "Such impertinence."}, 
    // Arc 12 (Index 11): Elbaf (Imu)
    {"name": "Elbaf Saga", "arc_file": "arc12.jpg", "villain_index": 11, "crew_count": 10,
     "quote": "Allow Mu to show you...the dominance of God!"},
];

// Indices that require Dark Gray text (0-based: 1, 2, 8, 9)
const GRAY_TEXT_ARCS = [1, 2, 8, 9];

// --- HELPER FUNCTION ---
function getTargetHostileCount(arcIndex) {
    // Logic: (Index // 2) + 1, capped at MAX_HOSTILE_COUNT (6)
    const MAX_HOSTILE_COUNT = 6; 
    let target = Math.floor(arcIndex / 2) + 1;
    return Math.min(target, MAX_HOSTILE_COUNT);
}

// --- CONSTANT CALCULATION (MUST follow the function definition) ---
const INITIAL_ENEMY_COUNT = getTargetHostileCount(0);
// Ensure these are accessible globally or imported where needed (in this setup, global is easier)
// The Phaser scenes will use these constants and functions.