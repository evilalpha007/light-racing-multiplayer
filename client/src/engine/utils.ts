// Math and utility functions

export class Util {
  static timestamp(): number {
    return new Date().getTime();
  }

  static toInt(obj: any, def: number = 0): number {
    if (obj !== null) {
      const x = parseInt(obj, 10);
      if (!isNaN(x)) return x;
    }
    return def;
  }

  static toFloat(obj: any, def: number = 0.0): number {
    if (obj !== null) {
      const x = parseFloat(obj);
      if (!isNaN(x)) return x;
    }
    return def;
  }

  static limit(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }

  static randomInt(min: number, max: number): number {
    return Math.round(Util.interpolate(min, max, Math.random()));
  }

  static randomChoice<T>(options: T[]): T {
    return options[Util.randomInt(0, options.length - 1)];
  }

  static percentRemaining(n: number, total: number): number {
    return (n % total) / total;
  }

  static accelerate(v: number, accel: number, dt: number): number {
    return v + accel * dt;
  }

  static interpolate(a: number, b: number, percent: number): number {
    return a + (b - a) * percent;
  }

  static easeIn(a: number, b: number, percent: number): number {
    return a + (b - a) * Math.pow(percent, 2);
  }

  static easeOut(a: number, b: number, percent: number): number {
    return a + (b - a) * (1 - Math.pow(1 - percent, 2));
  }

  static easeInOut(a: number, b: number, percent: number): number {
    return a + (b - a) * (-Math.cos(percent * Math.PI) / 2 + 0.5);
  }

  static exponentialFog(distance: number, density: number): number {
    return 1 / Math.pow(Math.E, distance * distance * density);
  }

  static increase(start: number, increment: number, max: number): number {
    let result = start + increment;
    while (result >= max) result -= max;
    while (result < 0) result += max;
    return result;
  }

  static project(
    p: any,
    cameraX: number,
    cameraY: number,
    cameraZ: number,
    cameraDepth: number,
    width: number,
    height: number,
    roadWidth: number
  ): void {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;
    p.screen.scale = cameraDepth / p.camera.z;
    p.screen.x = Math.round(width / 2 + (p.screen.scale * p.camera.x * width) / 2);
    p.screen.y = Math.round(height / 2 - (p.screen.scale * p.camera.y * height) / 2);
    p.screen.w = Math.round((p.screen.scale * roadWidth * width) / 2);
  }

  static overlap(x1: number, w1: number, x2: number, w2: number, percent: number = 1): boolean {
    const half = percent / 2;
    const min1 = x1 - w1 * half;
    const max1 = x1 + w1 * half;
    const min2 = x2 - w2 * half;
    const max2 = x2 + w2 * half;
    return !(max1 < min2 || min1 > max2);
  }
}
