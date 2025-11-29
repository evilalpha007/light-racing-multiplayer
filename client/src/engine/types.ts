// Game types and interfaces

export interface Point2D {
  x: number;
  y: number;
  w?: number;
  scale?: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Camera {
  x: number;
  y: number;
  z: number;
}

export interface Segment {
  index: number;
  p1: {
    world: Point3D;
    camera: Camera;
    screen: Point2D;
  };
  p2: {
    world: Point3D;
    camera: Camera;
    screen: Point2D;
  };
  curve: number;
  sprites: SegmentSprite[];
  cars: Car[];
  color: RoadColor;
  looped?: boolean;
  fog?: number;
  clip?: number;
}

export interface SegmentSprite {
  source: SpriteDefinition;
  offset: number;
}

export interface SpriteDefinition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoadColor {
  road: string;
  grass: string;
  rumble: string;
  lane?: string;
}

export interface Car {
  offset: number;
  z: number;
  sprite: SpriteDefinition;
  speed: number;
  percent?: number;
}

export interface RemotePlayer {
  playerId: string;
  username: string;
  x: number;
  z: number;
  speed: number;
  sprite?: SpriteDefinition;
}

export interface GameConfig {
  fps: number;
  width: number;
  height: number;
  roadWidth: number;
  segmentLength: number;
  rumbleLength: number;
  lanes: number;
  fieldOfView: number;
  cameraHeight: number;
  drawDistance: number;
  fogDensity: number;
  enableBots?: boolean; // Add this
}
