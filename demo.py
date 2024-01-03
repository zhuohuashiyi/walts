import pygame
import random

# Initialize pygame
pygame.init()

# Screen dimensions
WIDTH = 800
HEIGHT = 600

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Create the screen
screen = pygame.display.set_mode((WIDTH, HEIGHT))

# Set the title
pygame.display.set_caption("Tetris")

# Game variables
grid = [[0 for _ in range(10)] for _ in range(20)]
current_piece = random.choice([["O", "L", "J", "I", "T", "S", "Z"]])
rotation = 0

# Game loop
running = True
while running:
    screen.fill(WHITE)

    # Draw the grid
    for i in range(20):
        for j in range(10):
            if grid[i][j]:
                pygame.draw.rect(screen, BLACK, (j * 30, i * 30, 29, 29))

    # Draw the current piece
    for i in range(2):
        for j in range(4):
            if current_piece[j][i]:
                pygame.draw.rect(
                    screen,
                    BLACK,
                    (
                        (j * 30 + 15) % WIDTH,
                        (i * 30 + 15) % HEIGHT,
                        29,
                        29,
                    ),
                )

    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Input handling
    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:
        if not (current_piece[0][0] == 0 and grid[current_piece[1] - 1][current_piece[0]]):
            current_piece[0] -= 1
    if keys[pygame.K_RIGHT]:
        current_piece[0] += 1
    if keys[pygame.K_DOWN]:
        current_piece[1] += 1
    if keys[pygame.K_UP]:
        rotation = (rotation + 1) % 4

    # Collision detection
    if current_piece[1] == 20:
        # Clear full rows
        for i in range(20):
            full = True
            for j in range(10):
                if grid[i][j] == 0:
                    full = False
                    break
            if full:
                grid[i] = [0 for _ in range(10)]
                current_piece[1] = 0
                current_piece[0] = random.randint(0, 9)
        # Fall
        current_piece[1] += 1

    # Update the screen
    pygame.display.flip()

pygame.quit()