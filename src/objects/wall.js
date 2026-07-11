import CONSTANTS from '../utils/constants';

function radianToDegrees(r) {
  return r * 180 / Math.PI;
}

class Wall {
  constructor(state, length, angle, radius, note, instrument) {
    this.game = state.game;
    this.state = state;
    this.baseLength = length;
    this.note = note;
    this.instrument = instrument;

    const outLength = length + Math.cos((Math.PI * 3) / 8) * CONSTANTS.WALL_WIDTH;
    this.bpm = this.game.make.bitmapData(outLength, CONSTANTS.WALL_WIDTH);
    this.radius = radius;
    this.angle = angle;

    const x = this.game.world.centerX + radius * Math.sin(angle);
    const y = this.game.world.centerY - radius * Math.cos(angle);

    this.sprite = this.game.add.sprite(x, y, this.bpm);
    this.sprite.angle = radianToDegrees(angle);
    this.sprite.anchor.y = 0.5;
    this.sprite.anchor.x = 0.5;

    this.game.physics.p2.enable(this.sprite);
    this.sprite.body.setRectangle(length, CONSTANTS.WALL_WIDTH);
    this.sprite.body.static = true;
    this.sprite.body.angle = radianToDegrees(angle);
    this.sprite.data.type = 'wall';

    this.sprite.body.onBeginContact.add(this.collide, this);

    this.gradient = {
      level: 1,
      color: CONSTANTS.WALL_COLOR
    };
    this.redrawWall();
  }

  collide(body) {
    if (body.sprite.data.type === 'ball') {
      this.gradient.color = body.sprite.data.color; 
      this.gradient.level = 0;
      if (this.instrument) {
        this.instrument.play(this.note, CONSTANTS.INSTRUMENTS[body.sprite.data.ball.type]);
      }
      this.state.hitWall();
    }
  }

  redrawWall() {
    this.bpm.clear();
    const outLength = this.baseLength + Math.cos((Math.PI * 3) / 8) * CONSTANTS.WALL_WIDTH;
    this.bpm.ctx.fillStyle = this.getGradientColor(this.gradient.color, this.gradient.level);

    this.bpm.ctx.beginPath();
    this.bpm.ctx.moveTo(0, 0);
    this.bpm.ctx.lineTo(outLength, 0);
    this.bpm.ctx.lineTo(this.baseLength, CONSTANTS.WALL_WIDTH);
    this.bpm.ctx.lineTo(Math.cos((Math.PI * 3) / 8) * CONSTANTS.WALL_WIDTH, CONSTANTS.WALL_WIDTH);
    this.bpm.ctx.closePath();
    this.bpm.ctx.fill();
  }

  render() {
    if (this.gradient.level < 1) {
      this.gradient.level = this.gradient.level + CONSTANTS.WALL_GRADIENT_SPEED;
    } else {
      this.gradient.level = 1;
    }
    this.redrawWall();
  }

  updatePosition(scaleRadius, stretchX, stretchY) {
    const rx = scaleRadius * stretchX;
    const ry = scaleRadius * stretchY;
    this.sprite.body.x = this.game.world.centerX + rx * Math.sin(this.angle);
    this.sprite.body.y = this.game.world.centerY - ry * Math.cos(this.angle);
    this.sprite.body.angle = radianToDegrees(this.angle);
  }

  rotate(diff) {
    this.angle = (this.angle + diff) % (2 * Math.PI);
  }

  getGradientColor(colorFrom, balance) {
    if (balance >= 1) return `rgb(${CONSTANTS.WALL_COLOR.r}, ${CONSTANTS.WALL_COLOR.g}, ${CONSTANTS.WALL_COLOR.b})`;
    const nbal = 1 - balance;
    const color = {};
    for (const idx of ['r', 'g', 'b']) {
      color[idx] = Math.floor(colorFrom[idx] * nbal + CONSTANTS.WALL_COLOR[idx] * balance);
    }
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  destroy() {
    if (this.sprite) {
      if (this.sprite.body) this.sprite.body.removeFromWorld();
      this.sprite.destroy();
    }
    if (this.bpm) this.bpm.destroy();
  }
}

export default Wall;