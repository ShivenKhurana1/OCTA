import CONSTANTS from '../utils/constants';

class Obstacle {
  constructor(state, x, y, width, height, rotationSpeed = 1) {
    this.game = state.game;
    this.state = state;
    this.rotationSpeed = rotationSpeed; // degrees per frame

    // Draw the obstacle sprite (translucent white block)
    this.bpm = this.game.make.bitmapData(width, height);
    this.bpm.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.bpm.ctx.fillRect(0, 0, width, height);

    this.sprite = this.game.add.sprite(x, y, this.bpm);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;

    // Enable P2 physics
    this.game.physics.p2.enable(this.sprite);
    this.sprite.body.setRectangle(width, height);
    this.sprite.body.static = true;
    this.sprite.data.type = 'obstacle';

    // Share wall material and collisions so balls and players bounce off it
    state.collisionManager.setMaterial(this.sprite.body, 'wall');
    state.collisionManager.setCollisions(this.sprite.body, 'wall');
  }

  update() {
    this.sprite.body.angle += this.rotationSpeed;
  }

  destroy() {
    if (this.sprite && this.sprite.body) {
      this.sprite.body.removeFromWorld();
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.bpm) {
      this.bpm.destroy();
    }
  }
}

export default Obstacle;
