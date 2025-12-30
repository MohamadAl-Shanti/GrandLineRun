import pygame
import sys
import random

pygame.init()

# --- 1. SETUP ---

# Screen Setup 
screen_width = 1400
screen_height = 700
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption('One Piece: Grand Line Run')
clock = pygame.time.Clock()

# Game State
game_active = False 
title_active = True
score = 0
capture_threshold = 3  # Points per level
current_arc_index = 0

# Color definitions
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
DARK_GRAY = (100, 100, 100)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
ORANGE = (255, 69, 0)
YELLOW = (255, 255, 0)
GOLD = (255, 215, 0)

# Player constants
PLAYER_HITBOX_SIZE = 40 

# Enemy constants
HOSTILE_HITBOX_SIZE = 60
base_hostile_speed = 6 
MIN_SAFE_DISTANCE = 300 
MAX_HOSTILE_COUNT = 6 

# --------------------------------------------------
# 🎨 FUN SYSTEM FONT
# --------------------------------------------------

def get_fun_font(size):
    return pygame.font.SysFont(
        ["comicsansms", "arialroundedmtbold", "verdana"],
        size,
        bold=True
    )

font_title = get_fun_font(110)
font_start = get_fun_font(42)
font_score = get_fun_font(60)
font_message = get_fun_font(110)
font_score_fail = get_fun_font(48)
font_reward = get_fun_font(38)
font_quote = get_fun_font(42)

# --------------------------------------------------
# ✨ TEXT RENDERING
# --------------------------------------------------

def draw_cool_text(surface, text, font, center_pos, text_color=WHITE, outline_color=BLACK, shadow_color=(20, 20, 20), outline_thickness=3, shadow_offset=(3, 3)):
    shadow = font.render(text, True, shadow_color)
    shadow_rect = shadow.get_rect(center=(center_pos[0] + shadow_offset[0], center_pos[1] + shadow_offset[1]))
    surface.blit(shadow, shadow_rect)

    outline = font.render(text, True, outline_color)
    for dx in range(-outline_thickness, outline_thickness + 1):
        for dy in range(-outline_thickness, outline_thickness + 1):
            if dx != 0 or dy != 0:
                outline_rect = outline.get_rect(center=(center_pos[0] + dx, center_pos[1] + dy))
                surface.blit(outline, outline_rect)

    main = font.render(text, True, text_color)
    main_rect = main.get_rect(center=center_pos)
    surface.blit(main, main_rect)

# --- ASSETS ---
ASSET_FOLDER = "assets/" 
STRAW_HAT_COUNT = 12 
VILLAIN_COUNT = 12 
ARC_COUNT = 12 
current_straw_hat_index = 0 
VILLAIN_FAIL_SIZE = (250, 250) 

ARC_REWARDS = [
    "Earned infinite tangerines.", "Earned Warlord strength.", "Earned Dial Energy secrets.",
    "Earned Robin's Poneglyph knowledge.", "Earned Shadow protection.", "Earned Whitebeard's respect.",
    "Earned Jinbe's loyalty.", "Earned Dressrosa party invitation.", "Earned a taste of Sanji's cake.",
    "Earned audience with Momonosuke.", "Earned Vegapunk's inventions.", "You Found The One Piece!",
]

ONE_PIECE_ARCS = [
    {"name": "East Blue Saga", "arc_file": "arc1.jpg", "villain_index": 0, "crew_count": 4, "quote": "Inferior humans! You think you can beat a fishman?!"},
    {"name": "Alabasta Saga", "arc_file": "arc2.jpg", "villain_index": 1, "crew_count": 5, "quote": "Weakness is a sin."},
    {"name": "Skypiea Saga", "arc_file": "arc3.jpg", "villain_index": 2, "crew_count": 5, "quote": "Grovel before me, you powerless lambs!"},
    {"name": "Enies Lobby Saga", "arc_file": "arc4.jpg", "villain_index": 3, "crew_count": 7, "quote": "This area is now under the control of the World Government."},
    {"name": "Thriller Bark Saga", "arc_file": "arc5.jpg", "villain_index": 4, "crew_count": 8, "quote": "Now this one will make a good zombie! Kishishishi!"},
    {"name": "Summit War Saga", "arc_file": "arc6.jpg", "villain_index": 5, "crew_count": 8, "quote": "How unlucky for you to meet me. I will be sure to leave no traces behind."},
    {"name": "Fishman Island Saga", "arc_file": "arc7.jpg", "villain_index": 6, "crew_count": 9, "quote": "The resentment held by fishmen is eternal..."},
    {"name": "Dressrosa Saga", "arc_file": "arc8.jpg", "villain_index": 7, "crew_count": 11, "quote": "The weak don't get to decide anything, not even how they die."},
    {"name": "Whole Cake Island Saga", "arc_file": "arc9.jpg", "villain_index": 8, "crew_count": 10, "quote": "Mamma-Mamma"}, 
    {"name": "Wano Saga", "arc_file": "arc10.jpg", "villain_index": 9, "crew_count": 12, "quote": "So you're one of those kids who are playing at being pirates..."},         
    {"name": "Egghead Saga", "arc_file": "background.jpg", "villain_index": 10, "crew_count": 10, "quote": "Such impertinence."},  
    {"name": "Elbaf Saga", "arc_file": "arc12.jpg", "villain_index": 11, "crew_count": 10, "quote": "Allow Mu to show you...the dominance of God!"},      
]

GRAY_TEXT_ARCS = [1, 2, 8, 9]

def load_and_scale(filename, size):
    try:
        full_path = ASSET_FOLDER + filename
        img = pygame.image.load(full_path).convert_alpha() if filename.endswith('.png') else pygame.image.load(full_path).convert()
        return pygame.transform.scale(img, size)
    except:
        return pygame.Surface(size) # Placeholder

NEW_SIZE = 135
ENEMY_SIZE = (NEW_SIZE, NEW_SIZE) 
PLAYER_SIZE = (NEW_SIZE, NEW_SIZE) 

title_background = load_and_scale("arc6.jpg", (screen_width, screen_height))
background_images = [load_and_scale(a["arc_file"], (screen_width, screen_height)) for a in ONE_PIECE_ARCS]
straw_hats = [load_and_scale(f'sh{i}.png', PLAYER_SIZE) for i in range(1, STRAW_HAT_COUNT + 1)]
cat_img = load_and_scale('target.png', (100, 100))
villains = [load_and_scale(f'villain{i}.png', ENEMY_SIZE) for i in range(1, VILLAIN_COUNT + 1)]
hostile_img = villains[0]

x, y = 0, 0
vel = 7
cat_x, cat_y = 700, 350
cat_speedx, cat_speedy = 5, 5
hostile_list = []

# --- HELPER FUNCTIONS ---

def randomize_position(image_width, image_height, avoid_player=False):
    global x, y
    current_player_img = straw_hats[current_straw_hat_index]
    while True:
        new_x = random.randint(0, screen_width - image_width)
        new_y = random.randint(0, screen_height - image_height)
        if not avoid_player: return new_x, new_y
        px, py = x + current_player_img.get_width() / 2, y + current_player_img.get_height() / 2
        ex, ey = new_x + image_width / 2, new_y + image_height / 2
        if ((px - ex) ** 2 + (py - ey) ** 2) ** 0.5 >= MIN_SAFE_DISTANCE: return new_x, new_y

def create_hostile_enemy(speed):
    hx, hy = randomize_position(hostile_img.get_width(), hostile_img.get_height(), True)
    return {'x': hx, 'y': hy, 'speedx': speed * random.choice([-1, 1]), 'speedy': speed * random.choice([-1, 1])}

# ✅ MODIFIED: Increases enemies by 1 every 2 levels (every 6 points)
def get_target_hostile_count(score_at_arc_start):
    # Calculation: 1 enemy + (levels cleared // 2)
    # levels_cleared = score // 3
    if score_at_arc_start < 6:       # Levels 1, 2
        target_count = 1
    elif score_at_arc_start < 12:    # Levels 3, 4
        target_count = 2
    elif score_at_arc_start < 18:    # Levels 5, 6
        target_count = 3
    elif score_at_arc_start < 24:    # Levels 7, 8
        target_count = 4
    elif score_at_arc_start < 30:    # Levels 9, 10
        target_count = 5
    else:                            # Levels 11, 12
        target_count = 6
        
    return min(target_count, MAX_HOSTILE_COUNT)

# Game Screens

def display_title_screen():
    screen.blit(title_background, (0, 0))
    draw_cool_text(screen, "GRAND LINE RUN", font_title, (screen_width // 2, screen_height // 2 - 100))
    draw_cool_text(screen, "PRESS SPACE TO SET SAIL!", font_start, (screen_width // 2, screen_height // 2 + 110))

def display_arc_failure_screen():
    screen.blit(background_images[current_arc_index], (0, 0))
    overlay = pygame.Surface((screen_width, screen_height))
    overlay.set_alpha(150); overlay.fill((0, 0, 0)); screen.blit(overlay, (0, 0))
    
    villain_id = ONE_PIECE_ARCS[current_arc_index]['villain_index']
    villain_to_display = pygame.transform.scale(villains[villain_id], VILLAIN_FAIL_SIZE)
    screen.blit(villain_to_display, (screen_width - VILLAIN_FAIL_SIZE[0] - 50, 50))
    
    highest_cleared_arc_index = max(-1, current_arc_index - 1)
    quote = ONE_PIECE_ARCS[current_arc_index]['quote']
    draw_cool_text(screen, f"'{quote}'", font_quote, (screen_width // 2 - 200, screen_height // 2 - 150), text_color=RED)
    
    if highest_cleared_arc_index >= 0:
        msg = f"REWARD (Cleared Arc {highest_cleared_arc_index + 1}): {ARC_REWARDS[highest_cleared_arc_index]}"
        draw_cool_text(screen, msg, font_reward, (screen_width // 2, screen_height // 2 - 40), text_color=GOLD)
    else:
        draw_cool_text(screen, "You failed to leave East Blue!", font_reward, (screen_width // 2, screen_height // 2 - 40))

    draw_cool_text(screen, f"Final Score: {score} | Failed Arc: {ONE_PIECE_ARCS[current_arc_index]['name']}", font_score_fail, (screen_width // 2, screen_height // 2 + 50))
    draw_cool_text(screen, "Press SPACE to Restart", font_score_fail, (screen_width // 2, screen_height // 2 + 150), text_color=GREEN)

def reset_game():
    global game_active, title_active, score, x, y, cat_x, cat_y, hostile_list, current_arc_index, current_straw_hat_index, hostile_img
    game_active, title_active = True, False
    score, x, y, current_arc_index, current_straw_hat_index = 0, 0, 0, 0, 0
    cat_x, cat_y = randomize_position(cat_img.get_width(), cat_img.get_height())
    hostile_img = villains[ONE_PIECE_ARCS[0]['villain_index']]
    hostile_list = [create_hostile_enemy(base_hostile_speed) for _ in range(get_target_hostile_count(0))]

# Main Loop
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT: pygame.quit(); sys.exit()
        if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            if title_active or not game_active: reset_game()

    if title_active:
        display_title_screen()
    elif game_active:
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]: x -= vel
        if keys[pygame.K_RIGHT]: x += vel
        if keys[pygame.K_UP]: y -= vel
        if keys[pygame.K_DOWN]: y += vel 

        current_background = background_images[current_arc_index]
        current_player_img = straw_hats[current_straw_hat_index]
        hostile_img = villains[ONE_PIECE_ARCS[current_arc_index]['villain_index']]
        screen.blit(current_background, (0, 0))

        player_hitbox = pygame.Rect(x + (NEW_SIZE-PLAYER_HITBOX_SIZE)//2, y + (NEW_SIZE-PLAYER_HITBOX_SIZE)//2, PLAYER_HITBOX_SIZE, PLAYER_HITBOX_SIZE)
        cat1_rect = cat_img.get_rect(topleft=(cat_x, cat_y))
        
        if player_hitbox.colliderect(cat1_rect):
            score += 1
            cat_x, cat_y = randomize_position(cat_img.get_width(), cat_img.get_height()) 
            cat_speedx, cat_speedy = -cat_speedx, -cat_speedy

            if score % capture_threshold == 0:
                current_arc_index = (current_arc_index + 1) % ARC_COUNT
                current_straw_hat_index = (current_straw_hat_index + 1) % (ONE_PIECE_ARCS[current_arc_index]['crew_count'])
                arc_multiplier = score // capture_threshold 
                new_speed = base_hostile_speed + arc_multiplier * 0.5 
                
                # Update hostile count based on new every-2-level logic
                target_count = get_target_hostile_count(score) 
                
                while len(hostile_list) < target_count:
                    hostile_list.append(create_hostile_enemy(new_speed))
                for h in hostile_list:
                    h['speedx'] = (h['speedx'] / abs(h['speedx'])) * new_speed
                    h['speedy'] = (h['speedy'] / abs(h['speedy'])) * new_speed

        cat_x += cat_speedx; cat_y += cat_speedy
        if cat_x <= 0 or cat_x >= screen_width - 100: cat_speedx *= -1
        if cat_y <= 0 or cat_y >= screen_height - 100: cat_speedy *= -1

        for hostile in hostile_list:
            hostile['x'] += hostile['speedx']; hostile['y'] += hostile['speedy']
            if hostile['x'] <= 0 or hostile['x'] >= screen_width - NEW_SIZE: hostile['speedx'] *= -1
            if hostile['y'] <= 0 or hostile['y'] >= screen_height - NEW_SIZE: hostile['speedy'] *= -1
            
            h_hitbox = pygame.Rect(hostile['x'] + (NEW_SIZE-HOSTILE_HITBOX_SIZE)//2, hostile['y'] + (NEW_SIZE-HOSTILE_HITBOX_SIZE)//2, HOSTILE_HITBOX_SIZE, HOSTILE_HITBOX_SIZE)
            if player_hitbox.colliderect(h_hitbox): game_active = False
            screen.blit(hostile_img, (hostile['x'], hostile['y']))
        
        screen.blit(cat_img, (cat_x, cat_y))
        screen.blit(current_player_img, (x, y))
        score_color = DARK_GRAY if current_arc_index in GRAY_TEXT_ARCS else WHITE
        score_text = font_score.render(f"Score: {score} | Arc: {ONE_PIECE_ARCS[current_arc_index]['name']}", True, score_color)
        screen.blit(score_text, (10, 10))

        x = max(0, min(x, screen_width - NEW_SIZE))
        y = max(0, min(y, screen_height - NEW_SIZE))
    else: 
        display_arc_failure_screen()

    pygame.display.update()
    clock.tick(60)