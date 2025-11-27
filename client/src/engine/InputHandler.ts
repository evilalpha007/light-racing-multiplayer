// Input handler for keyboard and touch controls

import { KEY } from './constants';

export class InputHandler {
  keyLeft: boolean = false;
  keyRight: boolean = false;
  keyFaster: boolean = false;
  keySlower: boolean = false;

  private keyDownHandler = (e: KeyboardEvent) => {
    this.handleKey(e.keyCode, true);
  };

  private keyUpHandler = (e: KeyboardEvent) => {
    this.handleKey(e.keyCode, false);
  };

  private handleKey(keyCode: number, isDown: boolean): void {
    switch (keyCode) {
      case KEY.LEFT:
      case KEY.A:
        this.keyLeft = isDown;
        break;
      case KEY.RIGHT:
      case KEY.D:
        this.keyRight = isDown;
        break;
      case KEY.UP:
      case KEY.W:
        this.keyFaster = isDown;
        break;
      case KEY.DOWN:
      case KEY.S:
        this.keySlower = isDown;
        break;
    }
  }

  start(): void {
    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }

  stop(): void {
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
  }

  reset(): void {
    this.keyLeft = false;
    this.keyRight = false;
    this.keyFaster = false;
    this.keySlower = false;
  }
}
