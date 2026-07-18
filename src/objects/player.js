import Phaser from 'phaser';
import Ball from './ball';
import CONSTANTS from '../utils/constants';

class Player {
  
  constructor(state) {
    this.game = state.game;
    this.collisionManager = state.collisionManager;
    this.state = state;

    this.bmd = this.game.make.bitmapData(CONSTANTS.PLAYER_SIZE, CONSTANTS.PLAYER_SIZE);
    this.sprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, this.bmd);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;

    this.game.physics.p2.enable(this.sprite);
    this.sprite.body.setCircle(CONSTANTS.PLAYER_SIZE/2);
    this.sprite.body.setZeroDamping(CONSTANTS.PLAYER_SIZE/2);
    this.sprite.body.fixedRotation = true;
    this.collisionManager.setCollisions(this.sprite.body, 'player');
    this.sprite.body.onBeginContact.add(this.collide, this);
    this.sprite.body.removeFromWorld();

    this.sprite.data.type = 'player';
    this.sprite.data.player = this;

    this.orbitRadius = 160; 
    this.orbitAngle = -Math.PI / 2; 
    this.orbitSpeed = 0.03; 
    this.orbitDirection = 1; 

    this.animations = [];

    this.ammo = [];
    this.ammoBmd = this.game.make.bitmapData(CONSTANTS.PLAYER_SIZE, CONSTANTS.PLAYER_SIZE);
    this.ammoBmd.ctx.lineWidth = 2;
    const ammoImg = this.game.add.image(0, 0, this.ammoBmd);
    ammoImg.anchor.x = 0.5;
    ammoImg.anchor.y = 0.5;
    this.sprite.addChild(ammoImg);

    this.active = false;
    this.maxHealth = 100;
    this.health = this.maxHealth;
  }

  activate() {
    this.animations.push({
      type: 'activate',
      active: true,
      level: 0
    });
    this.sprite.body.addToWorld();
    this.ammo = ['default'];
    this.drawAmmo(this.ammo.length, true);
    this.active = true;
  }

  init() {
    this.ammo = ['default'];
    this.drawAmmo(this.ammo.length, false);
  }

  desactivate() {
    this.animations.push({
      type: 'activate',
      active: false,
      level: 0
    });
    this.sprite.body.removeFromWorld();
    this.active = false;
  }

  setCollisions(group, collisionGroups) {
    this.sprite.body.setCollisionGroup(group);
    this.sprite.body.collides(collisionGroups, this.collide, this);
  }

  collide(body) {
    if (body.sprite.data.type === 'ball') {
      this.giveBall(body.sprite.data.ball.type);
      this.state.setBallsOut(false);
      this.state.updateCursor();
      
      this.clearAnimations('collide');
      this.animations.push({
        type: 'collide',
        color: body.sprite.data.color,
        level: 0
      });
      this.state.soundManager.play('hit');
      
      body.sprite.data.ball.destroy();
    }
  }

  update() {
    if (this.active) {
      const pointerPosition = this.game.input.activePointer.position;
      const playerPosition = this.sprite.position;
      const distance = Phaser.Point.distance(pointerPosition, playerPosition);

      if (distance > 10) {
        const direction = Phaser.Point.subtract(pointerPosition, playerPosition).normalize();
        const speed = Math.min(CONSTANTS.PLAYER_VELOCITY, distance * 4);
        this.sprite.body.velocity.x = direction.x * speed;
        this.sprite.body.velocity.y = direction.y * speed;
      } else {
        this.sprite.body.setZeroVelocity();
      }
    }
  }

  handleActionKey() {
    if (!this.active) {
      console.warn('Player not active, cannot shoot');
      return;
    }

    if (this.ammo.length > 0) {
      // Shoot towards the center of the screen
      const shootDirection = new Phaser.Point(this.game.world.centerX - this.sprite.x, this.game.world.centerY - this.sprite.y).normalize();
      this.shoot(shootDirection);
    } else {
      console.warn('No ammo to shoot');
    }
  }

  shoot(direction) {
    if (this.ammo.length > 0) {
      const ballType = this.ammo.pop();
      // Initialize position so that it doesn't collide with the player
      const angle = new Phaser.Point(0, 0).angle(direction);
      const ballPosition = {
        x: this.sprite.position.x + Math.cos(angle) * (CONSTANTS.PLAYER_SIZE / 2 + CONSTANTS.BALL_SIZE / 2 + 1),
        y: this.sprite.position.y + Math.sin(angle) * (CONSTANTS.PLAYER_SIZE / 2 + CONSTANTS.BALL_SIZE / 2 + 1)
      };
      new Ball(this.state, ballPosition.x, ballPosition.y, direction, ballType);
      this.drawAmmo(this.ammo.length);

      this.state.soundManager.play('shoot', true);

      // Decrease player health when shooting (only in boss battle)
      if (this.state.boss) {
        this.health = Math.max(0, this.health - 10);
        this.state.ui.updatePlayerHealth(this.health, this.maxHealth);
        
        // Check if player died
        if (this.health <= 0) {
          this.state.handlePlayerDeath();
        }
      }

      if (this.ammo.length === 0) {
        this.state.setBallsOut(true);
      }
    }
  }
  giveBall(type, animate) {
    this.ammo.push(type);
    this.sprite.body.addToWorld();
    this.drawAmmo(this.ammo.length, animate);
  }

  render() {
    if (this.animations.length > 0) {
      // Animation for gaining new ball
      const clearAnimations = [];
      for (const animIdx in this.animations) {
        const anim = this.animations[animIdx];
        if (anim.type === 'ammo') {
          this.ammoAnimation(anim);
        }
        else if (anim.type === 'collide') {
          this.collideAnimation(anim);
        }
        else if (anim.type === 'activate') {
          this.activateAnimation(anim);
        }

        if (anim.level >= 1) {
          this.endAnimation(anim);
          clearAnimations.push(animIdx);
        }
      }

      // Remove finished animations
      if (clearAnimations.length > 0) {
        for (const animIdx of clearAnimations) {
          this.animations.splice(animIdx, 1);
        }
      }
    }

    // this.game.debug.text(this.debug, 32, 32);
  }

  ammoAnimation(anim) {
    anim.level += 1 / (60 * CONSTANTS.AMMO_ANIM_TIME);
    this.ammoBmd.clear();
    this.ammoBmd.ctx.beginPath();
    this.ammoBmd.ctx.strokeStyle = `rgb(${anim.color.r}, ${anim.color.g}, ${anim.color.b})`;
    this.ammoBmd.ctx.arc(CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2,
      ((anim.target * Math.sin((Math.PI/2) * anim.level))) / 2, 0, 2 * Math.PI);
    this.ammoBmd.ctx.stroke();
  }

  collideAnimation(anim) {
    const color = {};
    const rbal = 1 - anim.level;
    for (let idx of ['r', 'g', 'b']) {
      color[idx] = anim.color[idx] * rbal + 255 * anim.level;
    }
    this.bmd.clear();
    this.bmd.circle(CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2,
      `rgb(${color.r}, ${color.g}, ${color.b})`);
    anim.level += 1 / (60 * CONSTANTS.COLLIDE_ANIM_TIME);
  }

  activateAnimation(anim) {
    anim.level += 1 / (60 * CONSTANTS.PLAYER_ACTIVATE_ANIM_TIME);
    this.bmd.clear();
    const level = anim.active ? anim.level : Math.max(0, 1 - anim.level);
    const size = CONSTANTS.PLAYER_SIZE/2 *  Math.min(1, Math.sin((Math.PI/2) * level));
    this.bmd.circle(CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2, size, '#ffffff');
  }

  endAnimation(anim) {
    if (anim.type === 'ammo') {
      this.drawAmmo(this.ammo.length);
    }
    else if (anim.type === 'collide') {
      this.bmd.circle(CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2, '#ffffff');
    }
    else if (anim.type === 'activate') {
      if (anim.active) {
        this.bmd.circle(CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2, '#ffffff');
      }
      else {
        this.bmd.clear();
      }
    }
  }

  clearAnimations(type) {
    const clearAnimations = [];
    for (const animIdx in this.animations) {
      if (this.animations[animIdx].type === type) {
        clearAnimations.push(animIdx);
      }
    }
    for (const animIdx of clearAnimations) {
      this.animations.splice(animIdx, 1);
    }
  }

  // Update ammo display
  drawAmmo(level, animate) {
    this.ammoBmd.clear();
    if (!animate) {
      // Remove ammo animations
      this.clearAnimations('ammo');
      for (let i = 0 ; i < level ; i++) {
        const ammoSize = CONSTANTS.PLAYER_SIZE * 1/8 + (i / 7) * (CONSTANTS.PLAYER_SIZE * 6/8);
        this.ammoBmd.ctx.beginPath();
        const color = CONSTANTS.BALL_TYPES[this.ammo[i]].color;
        this.ammoBmd.ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ammoBmd.ctx.arc(CONSTANTS.PLAYER_SIZE/2, CONSTANTS.PLAYER_SIZE/2, ammoSize / 2, 0, 2 * Math.PI);
        this.ammoBmd.ctx.stroke();
      }
    }
    else {
      // Animate a new ball given;
      this.animations.push({
        type: 'ammo',
        level: 0,
        color: CONSTANTS.BALL_TYPES[this.ammo[this.ammo.length - 1]].color,
        target: CONSTANTS.PLAYER_SIZE * 1/8 + (level / 7) * (CONSTANTS.PLAYER_SIZE * 6/8)
      });
    }
  }
  restoreHealth() {
    this.health = this.maxHealth;
  }
}

export default Player;
