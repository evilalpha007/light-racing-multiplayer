// Renderer class for drawing game graphics

import { COLORS, SPRITES } from './constants';
import type { SpriteDefinition, RoadColor } from './types';

export class Renderer {
  /**
   * Draw a polygon (road segment)
   */
  static polygon(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw a road segment
   */
  static segment(
    ctx: CanvasRenderingContext2D,
    width: number,
    lanes: number,
    x1: number,
    y1: number,
    w1: number,
    x2: number,
    y2: number,
    w2: number,
    fog: number,
    color: RoadColor
  ): void {
    const r1 = Renderer.rumbleWidth(w1, lanes);
    const r2 = Renderer.rumbleWidth(w2, lanes);
    const l1 = Renderer.laneMarkerWidth(w1, lanes);
    const l2 = Renderer.laneMarkerWidth(w2, lanes);

    // Grass
    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);

    // Rumble strips
    Renderer.polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
    Renderer.polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);

    // Road
    Renderer.polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

    // Lane markers
    if (color.lane) {
      const lanew1 = (w1 * 2) / lanes;
      const lanew2 = (w2 * 2) / lanes;
      let lanex1 = x1 - w1 + lanew1;
      let lanex2 = x2 - w2 + lanew2;
      for (let lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++) {
        Renderer.polygon(
          ctx,
          lanex1 - l1 / 2,
          y1,
          lanex1 + l1 / 2,
          y1,
          lanex2 + l2 / 2,
          y2,
          lanex2 - l2 / 2,
          y2,
          color.lane
        );
      }
    }

    Renderer.fog(ctx, 0, y1, width, y2 - y1, fog);
  }

  /**
   * Draw background layer
   */
  static background(
    ctx: CanvasRenderingContext2D,
    background: HTMLImageElement,
    width: number,
    height: number,
    layer: { x: number; y: number; w: number; h: number },
    rotation: number = 0,
    offset: number = 0
  ): void {
    const imageW = layer.w / 2;
    const imageH = layer.h;

    const sourceX = layer.x + Math.floor(layer.w * rotation);
    const sourceY = layer.y;
    const sourceW = Math.min(imageW, layer.x + layer.w - sourceX);
    const sourceH = imageH;

    const destX = 0;
    const destY = offset;
    const destW = Math.floor((width * sourceW) / imageW);
    const destH = height;

    ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
    if (sourceW < imageW) {
      ctx.drawImage(background, layer.x, sourceY, imageW - sourceW, sourceH, destW - 1, destY, width - destW, destH);
    }
  }

  /**
   * Draw a sprite
   */
  static sprite(
    ctx: CanvasRenderingContext2D,
    width: number,
    _height: number,
    _resolution: number,
    roadWidth: number,
    sprites: HTMLImageElement,
    sprite: SpriteDefinition,
    scale: number,
    destX: number,
    destY: number,
    offsetX: number = 0,
    offsetY: number = 0,
    clipY?: number
  ): void {
    const destW = ((sprite.w * scale * width) / 2) * (SPRITES.SCALE * roadWidth);
    const destH = ((sprite.h * scale * width) / 2) * (SPRITES.SCALE * roadWidth);

    destX = destX + destW * offsetX;
    destY = destY + destH * offsetY;

    const clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
    if (clipH < destH) {
      ctx.drawImage(
        sprites,
        sprite.x,
        sprite.y,
        sprite.w,
        sprite.h - (sprite.h * clipH) / destH,
        destX,
        destY,
        destW,
        destH - clipH
      );
    }
  }

  /**
   * Draw player car
   */
  static player(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    resolution: number,
    roadWidth: number,
    sprites: HTMLImageElement,
    speedPercent: number,
    scale: number,
    destX: number,
    destY: number,
    steer: number,
    updown: number
  ): void {
    const bounce = 1.5 * Math.random() * speedPercent * resolution * (Math.random() > 0.5 ? 1 : -1);
    let sprite: SpriteDefinition;

    if (steer < 0) {
      sprite = updown > 0 ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
    } else if (steer > 0) {
      sprite = updown > 0 ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
    } else {
      sprite = updown > 0 ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
    }

    Renderer.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);
  }

  /**
   * Draw other cars (bots/multiplayer)
   */
  static car(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    resolution: number,
    roadWidth: number,
    sprites: HTMLImageElement,
    sprite: SpriteDefinition,
    scale: number,
    destX: number,
    destY: number
  ): void {
    const bounce = 1.5 * Math.random() * resolution * (Math.random() > 0.5 ? 1 : -1);
    Renderer.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);
  }

  /**
   * Draw fog overlay
   */
  static fog(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fog: number): void {
    if (fog < 1) {
      ctx.globalAlpha = 1 - fog;
      ctx.fillStyle = COLORS.FOG;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = 1;
    }
  }

  static rumbleWidth(projectedRoadWidth: number, lanes: number): number {
    return projectedRoadWidth / Math.max(6, 2 * lanes);
  }

  static laneMarkerWidth(projectedRoadWidth: number, lanes: number): number {
    return projectedRoadWidth / Math.max(32, 8 * lanes);
  }
}
