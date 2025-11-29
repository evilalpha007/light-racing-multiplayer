// Main game engine with multiplayer support

import { SPRITES, BACKGROUND, SPRITE_GROUPS } from "./constants";
import { Renderer } from "./Renderer";
import { RoadBuilder } from "./RoadBuilder";
import { InputHandler } from "./InputHandler";
import { Util } from "./utils";
import type {
  Segment,
  GameConfig,
  RemotePlayer,
  SpriteDefinition,
} from "./types";

export class GameEngine {
  private config: GameConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputHandler;
  private roadBuilder: RoadBuilder;

  private backgroundImage: HTMLImageElement | null = null;
  private spritesImage: HTMLImageElement | null = null;

  private segments: Segment[] = [];
  private trackLength: number = 0;
  private resolution: number = 1;
  private cameraDepth: number = 0;
  private playerZ: number = 0;

  // Player state
  private playerX: number = 0;
  private position: number = 0;
  private speed: number = 0;
  private maxSpeed: number = 0;
  private playerSprite: SpriteDefinition | null = null;

  // Background offsets
  private skyOffset: number = 0;
  private hillOffset: number = 0;
  private treeOffset: number = 0;

  // Lap timing
  private currentLapTime: number = 0;
  private lastLapTime: number = 0;
  private fastestLapTime: number = 0;
  private currentLap: number = 1;
  private maxLaps: number = 3;
  private isFinished: boolean = false;

  // Animation
  private animationId: number | null = null;
  private lastTime: number = 0;
  private dt: number = 0;
  private gdt: number = 0;

  // Multiplayer & Bots
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private bots: {
    x: number;
    z: number;
    speed: number;
    offset: number;
    sprite: SpriteDefinition;
  }[] = [];
  private onPositionUpdate?: (data: any) => void;
  private onRaceFinished?: (results: any) => void;

  constructor(canvas: HTMLCanvasElement, config: Partial<GameConfig> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");
    this.ctx = ctx;

    this.config = {
      fps: 60,
      width: 1024,
      height: 768,
      roadWidth: 2000,
      segmentLength: 200,
      rumbleLength: 3,
      lanes: 3,
      fieldOfView: 100,
      cameraHeight: 1000,
      drawDistance: 300,
      fogDensity: 5,
      ...config,
    };

    this.input = new InputHandler();
    this.roadBuilder = new RoadBuilder(
      this.config.segmentLength,
      this.config.rumbleLength
    );

    this.calculateDerivedValues();

    // Only initialize bots if enabled (default: true for single-player)
    if (this.config.enableBots !== false) {
      this.initBots();
    }
    this.initPlayer();
  }

  private initPlayer(): void {
    // 50% chance to be default red car (with turning animations), 50% chance to be another random car
    if (Math.random() > 0.5) {
      this.playerSprite = null; // Default behavior (red car with animations)
    } else {
      const cars = SPRITE_GROUPS.CARS;
      this.playerSprite = cars[Math.floor(Math.random() * cars.length)];
    }
  }

  private initBots(): void {
    // Add 3 bots with random cars
    const cars = SPRITE_GROUPS.CARS;
    for (let i = 0; i < 3; i++) {
      this.bots.push({
        x: (Math.random() * 2 - 1) * 0.5, // Random lane
        z: 0,
        speed: 0,
        offset: Math.random() * 0.9 + 0.1, // Random speed factor
        sprite: cars[Math.floor(Math.random() * cars.length)],
      });
    }
  }

  private calculateDerivedValues(): void {
    this.cameraDepth =
      1 / Math.tan(((this.config.fieldOfView / 2) * Math.PI) / 180);
    this.playerZ = this.config.cameraHeight * this.cameraDepth;
    this.resolution = this.config.height / 480;
    this.maxSpeed = this.config.segmentLength / (1 / this.config.fps);
  }

  async loadAssets(): Promise<void> {
    return new Promise((resolve, reject) => {
      let loaded = 0;
      const total = 2;

      const checkComplete = () => {
        loaded++;
        if (loaded === total) resolve();
      };

      this.backgroundImage = new Image();
      this.backgroundImage.onload = checkComplete;
      this.backgroundImage.onerror = () =>
        reject(new Error("Failed to load background"));
      this.backgroundImage.src = "/images/background.png";

      this.spritesImage = new Image();
      this.spritesImage.onload = checkComplete;
      this.spritesImage.onerror = () =>
        reject(new Error("Failed to load sprites"));
      this.spritesImage.src = "/images/sprites.png";

      // Fallback if images fail (for development)
      setTimeout(() => {
        if (loaded < total) {
          console.warn("Assets loading timed out, proceeding anyway");
          resolve();
        }
      }, 2000);
    });
  }

  init(): void {
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;

    this.roadBuilder.buildTrack(this.playerZ);
    this.segments = this.roadBuilder.getSegments();
    this.trackLength = this.segments.length * this.config.segmentLength;

    this.input.start();
  }

  start(): void {
    this.lastTime = Util.timestamp();
    this.animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.input.stop();
  }

  private animate = (): void => {
    const now = Util.timestamp();
    this.dt = Math.min(1, (now - this.lastTime) / 1000);
    this.gdt += this.dt;

    const step = 1 / this.config.fps;
    while (this.gdt > step) {
      this.gdt -= step;
      this.update(step);
    }

    this.render();
    this.lastTime = now;
    this.animationId = requestAnimationFrame(this.animate);
  };

  private update(dt: number): void {
    if (this.isFinished) return;

    const playerSegment = this.findSegment(this.position + this.playerZ);
    const playerW = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
    const speedPercent = this.speed / this.maxSpeed;
    const dx = dt * 2 * speedPercent;
    const startPosition = this.position;

    // Update position
    this.position = Util.increase(
      this.position,
      dt * this.speed,
      this.trackLength
    );

    // Steering
    if (this.input.keyLeft) {
      this.playerX -= dx;
    } else if (this.input.keyRight) {
      this.playerX += dx;
    }

    // Centrifugal force
    this.playerX -= dx * speedPercent * playerSegment.curve * 0.3;

    // Acceleration
    const accel = this.maxSpeed / 5;
    const breaking = -this.maxSpeed;
    const decel = -this.maxSpeed / 5;
    const offRoadDecel = -this.maxSpeed / 2;
    const offRoadLimit = this.maxSpeed / 4;

    if (this.input.keyFaster) {
      this.speed = Util.accelerate(this.speed, accel, dt);
    } else if (this.input.keySlower) {
      this.speed = Util.accelerate(this.speed, breaking, dt);
    } else {
      this.speed = Util.accelerate(this.speed, decel, dt);
    }

    // Off-road deceleration
    if (this.playerX < -1 || this.playerX > 1) {
      if (this.speed > offRoadLimit) {
        this.speed = Util.accelerate(this.speed, offRoadDecel, dt);
      }

      // Collision with sprites
      for (const sprite of playerSegment.sprites) {
        const spriteW = sprite.source.w * SPRITES.SCALE;
        if (
          Util.overlap(
            this.playerX,
            playerW,
            sprite.offset + (spriteW / 2) * (sprite.offset > 0 ? 1 : -1),
            spriteW
          )
        ) {
          this.speed = 0; // Stop completely on collision
          this.position = Util.increase(
            playerSegment.p1.world.z,
            -this.playerZ,
            this.trackLength
          );
          break;
        }
      }
    }

    // Limits
    this.playerX = Util.limit(this.playerX, -3, 3);
    this.speed = Util.limit(this.speed, 0, this.maxSpeed);

    // Update Bots (only if enabled)
    if (this.config.enableBots !== false) {
      this.updateBots(dt);
    }

    // Background parallax
    const skySpeed = 0.001;
    const hillSpeed = 0.002;
    const treeSpeed = 0.003;

    this.skyOffset = Util.increase(
      this.skyOffset,
      (skySpeed * playerSegment.curve * (this.position - startPosition)) /
        this.config.segmentLength,
      1
    );
    this.hillOffset = Util.increase(
      this.hillOffset,
      (hillSpeed * playerSegment.curve * (this.position - startPosition)) /
        this.config.segmentLength,
      1
    );
    this.treeOffset = Util.increase(
      this.treeOffset,
      (treeSpeed * playerSegment.curve * (this.position - startPosition)) /
        this.config.segmentLength,
      1
    );

    // Lap timing
    if (this.position > this.playerZ) {
      if (this.currentLapTime && startPosition < this.playerZ) {
        this.lastLapTime = this.currentLapTime;
        this.currentLapTime = 0;
        if (!this.fastestLapTime || this.lastLapTime < this.fastestLapTime) {
          this.fastestLapTime = this.lastLapTime;
        }
        this.currentLap++;

        if (this.currentLap > this.maxLaps) {
          this.finishRace();
        }
      } else {
        this.currentLapTime += dt;
      }
    }

    // Send position update to server (multiplayer)
    // Send updates every frame to ensure smooth multiplayer sync
    if (this.onPositionUpdate) {
      this.onPositionUpdate({
        x: this.playerX,
        z: this.position,
        speed: this.speed,
        lapTime: this.currentLapTime,
        position: 1, // TODO: Calculate actual position
      });
    }
  }

  private updateBots(dt: number): void {
    for (const bot of this.bots) {
      const botSegment = this.findSegment(bot.z);
      const botSpeed = this.maxSpeed * bot.offset; // Bots have different max speeds

      // Simple AI: Follow track and accelerate
      bot.z = Util.increase(bot.z, dt * botSpeed, this.trackLength);

      // Simple steering: stay in lane but adjust for curves
      bot.x = Util.limit(
        bot.x - (dt * botSpeed * botSegment.curve * 0.3) / this.maxSpeed,
        -2,
        2
      );
    }
  }

  private finishRace(): void {
    this.isFinished = true;
    if (this.onRaceFinished) {
      this.onRaceFinished({
        totalTime: this.lastLapTime * this.maxLaps, // Approximate
        fastestLap: this.fastestLapTime,
      });
    }
  }

  private render(): void {
    if (!this.backgroundImage || !this.spritesImage) return;

    const baseSegment = this.findSegment(this.position);
    const basePercent = Util.percentRemaining(
      this.position,
      this.config.segmentLength
    );
    const playerSegment = this.findSegment(this.position + this.playerZ);
    const playerPercent = Util.percentRemaining(
      this.position + this.playerZ,
      this.config.segmentLength
    );
    const playerY = Util.interpolate(
      playerSegment.p1.world.y,
      playerSegment.p2.world.y,
      playerPercent
    );
    let maxy = this.config.height;

    let x = 0;
    let dx = -(baseSegment.curve * basePercent);

    // Clear canvas
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);

    // Draw background layers
    Renderer.background(
      this.ctx,
      this.backgroundImage,
      this.config.width,
      this.config.height,
      BACKGROUND.SKY,
      this.skyOffset,
      this.resolution * 0.001 * playerY
    );
    Renderer.background(
      this.ctx,
      this.backgroundImage,
      this.config.width,
      this.config.height,
      BACKGROUND.HILLS,
      this.hillOffset,
      this.resolution * 0.002 * playerY
    );
    Renderer.background(
      this.ctx,
      this.backgroundImage,
      this.config.width,
      this.config.height,
      BACKGROUND.TREES,
      this.treeOffset,
      this.resolution * 0.003 * playerY
    );

    // Draw road segments
    for (let n = 0; n < this.config.drawDistance; n++) {
      const segment =
        this.segments[(baseSegment.index + n) % this.segments.length];
      segment.looped = segment.index < baseSegment.index;
      segment.fog = Util.exponentialFog(
        n / this.config.drawDistance,
        this.config.fogDensity
      );
      segment.clip = maxy;

      Util.project(
        segment.p1,
        this.playerX * this.config.roadWidth - x,
        playerY + this.config.cameraHeight,
        this.position - (segment.looped ? this.trackLength : 0),
        this.cameraDepth,
        this.config.width,
        this.config.height,
        this.config.roadWidth
      );

      Util.project(
        segment.p2,
        this.playerX * this.config.roadWidth - x - dx,
        playerY + this.config.cameraHeight,
        this.position - (segment.looped ? this.trackLength : 0),
        this.cameraDepth,
        this.config.width,
        this.config.height,
        this.config.roadWidth
      );

      x += dx;
      dx += segment.curve;

      if (
        segment.p1.camera.z <= this.cameraDepth ||
        segment.p2.screen.y >= segment.p1.screen.y ||
        segment.p2.screen.y >= maxy
      ) {
        continue;
      }

      Renderer.segment(
        this.ctx,
        this.config.width,
        this.config.lanes,
        segment.p1.screen.x,
        segment.p1.screen.y,
        segment.p1.screen.w || 0,
        segment.p2.screen.x,
        segment.p2.screen.y,
        segment.p2.screen.w || 0,
        segment.fog || 0,
        segment.color
      );

      maxy = segment.p1.screen.y;
    }

    // Draw sprites, bots, and remote players
    for (let n = this.config.drawDistance - 1; n > 0; n--) {
      const segment =
        this.segments[(baseSegment.index + n) % this.segments.length];

      // Draw segment sprites
      for (const sprite of segment.sprites) {
        const spriteScale = segment.p1.screen.scale || 1;
        const spriteX =
          segment.p1.screen.x +
          spriteScale *
            sprite.offset *
            this.config.roadWidth *
            (this.config.width / 2);
        const spriteY = segment.p1.screen.y;
        Renderer.sprite(
          this.ctx,
          this.config.width,
          this.config.height,
          this.resolution,
          this.config.roadWidth,
          this.spritesImage,
          sprite.source,
          spriteScale,
          spriteX,
          spriteY,
          sprite.offset < 0 ? -1 : 0,
          -1,
          segment.clip
        );
      }

      // Draw Bots (only if enabled)
      if (this.config.enableBots !== false) {
        for (const bot of this.bots) {
          // Simple bot rendering logic: check if bot is in this segment
          // This is a simplified check; real implementation would need more precise Z-checking
          const botSegmentIndex =
            Math.floor(bot.z / this.config.segmentLength) %
            this.segments.length;
          if (botSegmentIndex === segment.index) {
            const spriteScale = segment.p1.screen.scale || 1;
            const spriteX =
              segment.p1.screen.x +
              spriteScale *
                bot.x *
                this.config.roadWidth *
                (this.config.width / 2);
            const spriteY = segment.p1.screen.y;

            Renderer.car(
              this.ctx,
              this.config.width,
              this.config.height,
              this.resolution,
              this.config.roadWidth,
              this.spritesImage,
              bot.sprite,
              spriteScale,
              spriteX,
              spriteY
            );
          }
        }
      }

      // Draw Remote Players
      for (const [, remotePlayer] of this.remotePlayers.entries()) {
        // Remote player's track position (same coordinate system as local player's position)
        const remotePlayerTrackZ = remotePlayer.z;
        // Calculate relative Z position (remote player's track Z minus local player's position)
        const relativeZ = remotePlayerTrackZ - this.position;

        // Only draw if remote player is within draw distance
        if (
          Math.abs(relativeZ) <
          this.config.drawDistance * this.config.segmentLength
        ) {
          // Calculate which segment the remote player is in
          // Use remotePlayerTrackZ + playerZ to match local player's rendering position
          const remotePlayerRenderZ = remotePlayerTrackZ + this.playerZ;
          const remotePlayerSegment = this.findSegment(remotePlayerRenderZ);

          // Check if this remote player should be drawn in the current segment
          if (remotePlayerSegment.index === segment.index) {
            const spriteScale = segment.p1.screen.scale || 1;
            const spriteX =
              segment.p1.screen.x +
              spriteScale *
                remotePlayer.x *
                this.config.roadWidth *
                (this.config.width / 2);
            const spriteY = segment.p1.screen.y;

            // Use a default car sprite if none provided
            const carSprite = remotePlayer.sprite || SPRITE_GROUPS.CARS[0];

            Renderer.car(
              this.ctx,
              this.config.width,
              this.config.height,
              this.resolution,
              this.config.roadWidth,
              this.spritesImage,
              carSprite,
              spriteScale,
              spriteX,
              spriteY
            );
          }
        }
      }

      // Draw player at correct segment
      if (segment === playerSegment) {
        if (this.playerSprite) {
          // Render custom car (no turning animation)
          Renderer.car(
            this.ctx,
            this.config.width,
            this.config.height,
            this.resolution,
            this.config.roadWidth,
            this.spritesImage,
            this.playerSprite,
            this.cameraDepth / this.playerZ,
            this.config.width / 2,
            this.config.height / 2 -
              (this.cameraDepth / this.playerZ) *
                Util.interpolate(
                  playerSegment.p1.camera.y,
                  playerSegment.p2.camera.y,
                  playerPercent
                ) *
                (this.config.height / 2)
          );
        } else {
          // Render default car (with turning animation)
          Renderer.player(
            this.ctx,
            this.config.width,
            this.config.height,
            this.resolution,
            this.config.roadWidth,
            this.spritesImage,
            this.speed / this.maxSpeed,
            this.cameraDepth / this.playerZ,
            this.config.width / 2,
            this.config.height / 2 -
              (this.cameraDepth / this.playerZ) *
                Util.interpolate(
                  playerSegment.p1.camera.y,
                  playerSegment.p2.camera.y,
                  playerPercent
                ) *
                (this.config.height / 2),
            this.speed *
              (this.input.keyLeft ? -1 : this.input.keyRight ? 1 : 0),
            playerSegment.p2.world.y - playerSegment.p1.world.y
          );
        }
      }
    }
  }

  private findSegment(z: number): Segment {
    return this.segments[
      Math.floor(z / this.config.segmentLength) % this.segments.length
    ];
  }

  // Multiplayer methods
  setPositionUpdateCallback(callback: (data: any) => void): void {
    this.onPositionUpdate = callback;
  }

  setRaceFinishedCallback(callback: (results: any) => void): void {
    this.onRaceFinished = callback;
  }

  updateRemotePlayer(player: RemotePlayer): void {
    // Ensure remote player has valid initial position (default to 0 if not set)
    // If speed is 0 and position is very close to 0, normalize to exactly 0 for start line sync
    let normalizedZ = player.z ?? 0;
    if (player.speed === 0 && Math.abs(normalizedZ) < 0.1) {
      normalizedZ = 0; // Ensure all players start at exactly the same line
    }

    const remotePlayer: RemotePlayer = {
      ...player,
      z: normalizedZ,
      x: player.x ?? 0,
      speed: player.speed ?? 0,
    };
    this.remotePlayers.set(remotePlayer.playerId, remotePlayer);
  }

  removeRemotePlayer(playerId: string): void {
    this.remotePlayers.delete(playerId);
  }

  // Getters for HUD
  getSpeed(): number {
    return Math.round((this.speed / 500) * 5);
  }

  getCurrentLapTime(): number {
    return this.currentLapTime;
  }

  getLastLapTime(): number {
    return this.lastLapTime;
  }

  getFastestLapTime(): number {
    return this.fastestLapTime;
  }

  getCurrentLap(): number {
    return this.currentLap;
  }

  getMaxLaps(): number {
    return this.maxLaps;
  }
}
