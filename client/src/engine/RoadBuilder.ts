// Road builder for procedural track generation

import { COLORS, ROAD, SPRITES, SPRITE_GROUPS } from './constants';
import type { Segment } from './types';
import { Util } from './utils';

export class RoadBuilder {
  private segments: Segment[] = [];
  private segmentLength: number;
  private rumbleLength: number;

  constructor(segmentLength: number, rumbleLength: number) {
    this.segmentLength = segmentLength;
    this.rumbleLength = rumbleLength;
  }

  getSegments(): Segment[] {
    return this.segments;
  }

  private lastY(): number {
    return this.segments.length === 0 ? 0 : this.segments[this.segments.length - 1].p2.world.y;
  }

  private addSegment(curve: number, y: number): void {
    const n = this.segments.length;
    this.segments.push({
      index: n,
      p1: { world: { x: 0, y: this.lastY(), z: n * this.segmentLength }, camera: { x: 0, y: 0, z: 0 }, screen: { x: 0, y: 0 } },
      p2: { world: { x: 0, y: y, z: (n + 1) * this.segmentLength }, camera: { x: 0, y: 0, z: 0 }, screen: { x: 0, y: 0 } },
      curve: curve,
      sprites: [],
      cars: [],
      color: Math.floor(n / this.rumbleLength) % 2 ? COLORS.DARK : COLORS.LIGHT,
    });
  }

  addSprite(n: number, sprite: any, offset: number): void {
    if (this.segments[n]) {
      this.segments[n].sprites.push({ source: sprite, offset: offset });
    }
  }

  private addRoad(enter: number, hold: number, leave: number, curve: number, y: number = 0): void {
    const startY = this.lastY();
    const endY = startY + y * this.segmentLength;
    const total = enter + hold + leave;

    for (let n = 0; n < enter; n++) {
      this.addSegment(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n / total));
    }
    for (let n = 0; n < hold; n++) {
      this.addSegment(curve, Util.easeInOut(startY, endY, (enter + n) / total));
    }
    for (let n = 0; n < leave; n++) {
      this.addSegment(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n) / total));
    }
  }

  addStraight(num: number = ROAD.LENGTH.MEDIUM): void {
    this.addRoad(num, num, num, 0, 0);
  }

  addHill(num: number = ROAD.LENGTH.MEDIUM, height: number = ROAD.HILL.MEDIUM): void {
    this.addRoad(num, num, num, 0, height);
  }

  addCurve(num: number = ROAD.LENGTH.MEDIUM, curve: number = ROAD.CURVE.MEDIUM, height: number = ROAD.HILL.NONE): void {
    this.addRoad(num, num, num, curve, height);
  }

  addLowRollingHills(num: number = ROAD.LENGTH.SHORT, height: number = ROAD.HILL.LOW): void {
    this.addRoad(num, num, num, 0, height / 2);
    this.addRoad(num, num, num, 0, -height);
    this.addRoad(num, num, num, ROAD.CURVE.EASY, height);
    this.addRoad(num, num, num, 0, 0);
    this.addRoad(num, num, num, -ROAD.CURVE.EASY, height / 2);
    this.addRoad(num, num, num, 0, 0);
  }

  addSCurves(): void {
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.NONE);
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.EASY, -ROAD.HILL.LOW);
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.MEDIUM);
    this.addRoad(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
  }

  addBumps(): void {
    this.addRoad(10, 10, 10, 0, 5);
    this.addRoad(10, 10, 10, 0, -2);
    this.addRoad(10, 10, 10, 0, -5);
    this.addRoad(10, 10, 10, 0, 8);
    this.addRoad(10, 10, 10, 0, 5);
    this.addRoad(10, 10, 10, 0, -7);
    this.addRoad(10, 10, 10, 0, 5);
    this.addRoad(10, 10, 10, 0, -2);
  }

  addDownhillToEnd(num: number = 200): void {
    this.addRoad(num, num, num, -ROAD.CURVE.EASY, -this.lastY() / this.segmentLength);
  }

  buildTrack(playerZ: number): void {
    this.segments = [];

    this.addStraight(ROAD.LENGTH.SHORT);
    this.addLowRollingHills();
    this.addSCurves();
    this.addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
    this.addBumps();
    this.addLowRollingHills();
    this.addCurve(ROAD.LENGTH.LONG * 2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
    this.addStraight();
    this.addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
    this.addSCurves();
    this.addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
    this.addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
    this.addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
    this.addBumps();
    this.addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
    this.addStraight();
    this.addSCurves();
    this.addDownhillToEnd();

    this.addSprites();
    this.addStartFinishLines(playerZ);
  }

  private addSprites(): void {
    // Billboards
    this.addSprite(20, SPRITES.BILLBOARD07, -1);
    this.addSprite(40, SPRITES.BILLBOARD06, -1);
    this.addSprite(60, SPRITES.BILLBOARD08, -1);
    this.addSprite(80, SPRITES.BILLBOARD09, -1);
    this.addSprite(100, SPRITES.BILLBOARD01, -1);
    this.addSprite(120, SPRITES.BILLBOARD02, -1);
    this.addSprite(140, SPRITES.BILLBOARD03, -1);
    this.addSprite(160, SPRITES.BILLBOARD04, -1);
    this.addSprite(180, SPRITES.BILLBOARD05, -1);

    this.addSprite(240, SPRITES.BILLBOARD07, -1.2);
    this.addSprite(240, SPRITES.BILLBOARD06, 1.2);
    this.addSprite(this.segments.length - 25, SPRITES.BILLBOARD07, -1.2);
    this.addSprite(this.segments.length - 25, SPRITES.BILLBOARD06, 1.2);

    // Palm trees
    for (let n = 10; n < 200; n += 4 + Math.floor(n / 100)) {
      this.addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random() * 0.5);
      this.addSprite(n, SPRITES.PALM_TREE, 1 + Math.random() * 2);
    }

    // Columns and trees
    for (let n = 250; n < 1000; n += 5) {
      this.addSprite(n, SPRITES.COLUMN, 1.1);
      this.addSprite(n + Util.randomInt(0, 5), SPRITES.TREE1, -1 - Math.random() * 2);
      this.addSprite(n + Util.randomInt(0, 5), SPRITES.TREE2, -1 - Math.random() * 2);
    }

    // Plants
    for (let n = 200; n < this.segments.length; n += 3) {
      this.addSprite(n, Util.randomChoice(SPRITE_GROUPS.PLANTS), Util.randomChoice([1, -1]) * (2 + Math.random() * 5));
    }

    // Random billboards with plants
    for (let n = 1000; n < this.segments.length - 50; n += 100) {
      const side = Util.randomChoice([1, -1]);
      this.addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITE_GROUPS.BILLBOARDS), -side);
      for (let i = 0; i < 20; i++) {
        const sprite = Util.randomChoice(SPRITE_GROUPS.PLANTS);
        const offset = side * (1.5 + Math.random());
        this.addSprite(n + Util.randomInt(0, 50), sprite, offset);
      }
    }
  }

  private addStartFinishLines(playerZ: number): void {
    const startIndex = Math.floor(playerZ / this.segmentLength) + 2;
    if (this.segments[startIndex]) {
      this.segments[startIndex].color = COLORS.START;
    }
    if (this.segments[startIndex + 1]) {
      this.segments[startIndex + 1].color = COLORS.START;
    }

    for (let n = 0; n < this.rumbleLength; n++) {
      const finishIndex = this.segments.length - 1 - n;
      if (this.segments[finishIndex]) {
        this.segments[finishIndex].color = COLORS.FINISH;
      }
    }
  }
}
