// Game constants and sprite definitions

export const COLORS = {
  SKY: '#72D7EE',
  TREE: '#005108',
  FOG: '#334444',
  LIGHT: { road: '#6B6B6B', grass: '#cdac02', rumble: '#555555', lane: '#CCCCCC' },
  DARK: { road: '#696969', grass: '#c4a504', rumble: '#BBBBBB' },
  START: { road: 'white', grass: 'white', rumble: 'white' },
  FINISH: { road: 'black', grass: 'black', rumble: 'black' },
};

export const BACKGROUND = {
  HILLS: { x: 5, y: 5, w: 1280, h: 480 },
  SKY: { x: 5, y: 495, w: 1280, h: 480 },
  TREES: { x: 5, y: 985, w: 1280, h: 480 },
};

export const SPRITES = {
  SCALE: 0.3,
  PALM_TREE: { x: 5, y: 5, w: 215, h: 540 },
  BILLBOARD08: { x: 230, y: 5, w: 385, h: 265 },
  TREE1: { x: 625, y: 5, w: 360, h: 360 },
  DEAD_TREE1: { x: 5, y: 555, w: 135, h: 332 },
  BILLBOARD09: { x: 150, y: 555, w: 328, h: 282 },
  COLUMN: { x: 995, y: 5, w: 200, h: 315 },
  BILLBOARD01: { x: 625, y: 375, w: 300, h: 170 },
  BILLBOARD06: { x: 488, y: 555, w: 298, h: 190 },
  BILLBOARD05: { x: 5, y: 897, w: 298, h: 190 },
  BILLBOARD07: { x: 313, y: 897, w: 298, h: 190 },
  TREE2: { x: 1205, y: 5, w: 282, h: 295 },
  BILLBOARD04: { x: 1205, y: 310, w: 268, h: 170 },
  DEAD_TREE2: { x: 1205, y: 490, w: 150, h: 260 },
  BUSH1: { x: 5, y: 1097, w: 240, h: 155 },
  CACTUS: { x: 929, y: 897, w: 235, h: 118 },
  BUSH2: { x: 255, y: 1097, w: 232, h: 152 },
  BILLBOARD03: { x: 5, y: 1262, w: 230, h: 220 },
  BILLBOARD02: { x: 245, y: 1262, w: 215, h: 220 },
  STUMP: { x: 995, y: 330, w: 195, h: 140 },
  SEMI: { x: 1365, y: 490, w: 122, h: 144 },
  TRUCK: { x: 1365, y: 644, w: 100, h: 78 },
  CAR03: { x: 1383, y: 760, w: 88, h: 55 },
  CAR02: { x: 1383, y: 825, w: 80, h: 59 },
  CAR04: { x: 1383, y: 894, w: 80, h: 57 },
  CAR01: { x: 1205, y: 1018, w: 80, h: 56 },
  PLAYER_UPHILL_LEFT: { x: 1383, y: 961, w: 80, h: 45 },
  PLAYER_UPHILL_STRAIGHT: { x: 1295, y: 1018, w: 80, h: 45 },
  PLAYER_UPHILL_RIGHT: { x: 1385, y: 1018, w: 80, h: 45 },
  PLAYER_LEFT: { x: 995, y: 480, w: 80, h: 41 },
  PLAYER_STRAIGHT: { x: 1085, y: 480, w: 80, h: 41 },
  PLAYER_RIGHT: { x: 995, y: 531, w: 80, h: 41 },
  // Booster pad (we'll render this as a colored rectangle)
  BOOSTER: { x: 0, y: 0, w: 100, h: 30 },
  
  // New 3D rendered sprites (exact coordinates from sprite sheet tool)
  BILLBOARD_LIGHT_CAR_1: { x: 773, y: 1246, w: 303, h: 192 },  // sprite44
  BILLBOARD_LIGHT_CAR_2: { x: 1127, y: 1255, w: 330, h: 195 }, // sprite45
  TREE_3D_NEW: { x: 486, y: 1225, w: 250, h: 224 },  // sprite43 - new tree
  TREE_3D_PINK: { x: 967, y: 627, w: 218, h: 231 },  // sprite23 - pink/purple tree
  
  // 3D Car sprites (front and back angles)
  CAR_3D_FRONT: { x: 906, y: 1019, w: 139, h: 85 },  // sprite39 - front view
  CAR_3D_BACK: { x: 1056, y: 1020, w: 122, h: 91 },  // sprite40 - back view
};

// Calculate sprite scale
SPRITES.SCALE = 0.3 * (1 / SPRITES.PLAYER_STRAIGHT.w);

export const SPRITE_GROUPS = {
  BILLBOARDS: [
    SPRITES.BILLBOARD01,
    SPRITES.BILLBOARD02,
    SPRITES.BILLBOARD03,
    SPRITES.BILLBOARD04,
    SPRITES.BILLBOARD05,
    SPRITES.BILLBOARD06,
    SPRITES.BILLBOARD07,
    SPRITES.BILLBOARD08,
    SPRITES.BILLBOARD09,
    SPRITES.BILLBOARD_LIGHT_CAR_1,  // New 3D billboard
    SPRITES.BILLBOARD_LIGHT_CAR_2,  // New 3D billboard
  ],
  PLANTS: [
    SPRITES.TREE1,
    SPRITES.TREE2,
    SPRITES.DEAD_TREE1,
    SPRITES.DEAD_TREE2,
    SPRITES.PALM_TREE,
    SPRITES.BUSH2,
    SPRITES.CACTUS,
    SPRITES.STUMP,
    SPRITES.TREE_3D_NEW,   // New 3D tree
    SPRITES.TREE_3D_PINK,  // New 3D pink tree
  ],
  CARS: [
    SPRITES.CAR01, 
    SPRITES.CAR02, 
    SPRITES.CAR03, 
    SPRITES.CAR04, 
    SPRITES.SEMI, 
    SPRITES.TRUCK,
    SPRITES.CAR_3D_FRONT,  // New 3D car (front view)
    SPRITES.CAR_3D_BACK,   // New 3D car (back view)
  ],
};

export const ROAD = {
  LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
  HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
  CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 },
};

export const KEY = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  A: 65,
  D: 68,
  S: 83,
  W: 87,
};
