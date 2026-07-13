import Phaser from 'phaser';
import CONSTANTS from '../utils/constants';

class Boss {
  constructor(state, instruments) {
    this.game = state.game;
    this.state = state;
    this.instruments = instruments;

    // Boss stats
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.phase = 1;

    // Boss visuals
    this.group = this.game.add.group();
    this.group.x = this.game.world.centerX;
    this.group.y = this.game.world.centerY;

    // Core (pulsing center)
    this.core = this.game.add.graphics(0, 0);
    this.coreRadius = 60;
    this.group.add(this.core);

    // Outer ring
    this.ring = this.game.add.graphics(0, 0);
    this.ringRadius = 100;
    this.group.add(this.ring);

    // Add group to world
    this.game.world.add(this.group);

    // Attack timers
    this.attackTimer = 0;
    this.attackCooldown = 90;
    this.pulseTimer = 0;

    // Movement
    this.moveTimer = 0;
    this.moveCooldown = 120;
    this.targetX = this.game.world.centerX;
    this.targetY = this.game.world.centerY;
    this.moveSpeed = 2;

    // Projectiles
    this.projectiles = [];

    // Initialize
    this.drawBoss();
  }

  drawBoss() {
    this.core.clear();
    this.ring.clear();

    // Draw core
    this.core.beginFill(0xff0000, 1);
    this.core.drawCircle(0, 0, this.coreRadius);
    this.core.endFill();

    // Draw ring
    this.ring.lineStyle(4, 0xff4444, 1);
    this.ring.drawCircle(0, 0, this.ringRadius);
  }

  update() {
    this.pulseTimer += 0.05;
    const pulseScale = 1 + 0.1 * Math.sin(this.pulseTimer);
    this.core.scale.set(pulseScale);

    this.attackTimer++;

    // Determine phase based on health
    if (this.health > 66) {
      this.phase = 1;
      this.attackCooldown = 80;
    } else if (this.health > 33) {
      this.phase = 2;
      this.attackCooldown = 60;
    } else {
      this.phase = 3;
      this.attackCooldown = 40;
    }

    // Execute attacks
    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      this.executeAttack();
    }
    // Movement logic
    this.moveTimer++;
    if (this.moveTimer >= this.moveCooldown) {
      this.moveTimer = 0;
      // Pick new random target within bounds
      const margin = 150;
      this.targetX = margin + Math.random() * (this.game.width - margin * 2);
      this.targetY = margin + Math.random() * (this.game.height - margin * 2);
    }

    // Move toward target
    const dx = this.targetX - this.group.x;
    const dy = this.targetY - this.group.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      this.group.x += (dx / dist) * this.moveSpeed;
      this.group.y += (dy / dist) * this.moveSpeed;
    }
    // Update projectiles
    this.updateProjectiles();
  }

  executeAttack() {
    const attackType = Math.floor(Math.random() * this.phase);

    switch (attackType) {
      case 0:
        this.laserBarrage();
        break;
      case 1:
        this.wallSlam();
        break;
      case 2:
        this.pulseWave();
        break;
    }
  }

  laserBarrage() {
    // Fire multiple lasers in sequence
    const laserCount = this.phase + 2;
    for (let i = 0; i < laserCount; i++) {
      this.game.time.events.add(i * 150, () => {
        this.state.soundManager.play('shoot');
      });
    }
  }

  wallSlam() {
    // Expand rapidly
    const tween = this.game.add.tween(this.ring.scale)
      .to({ x: 1.5, y: 1.5 }, 200, Phaser.Easing.Elastic.Out)
      .to({ x: 1, y: 1 }, 300, Phaser.Easing.Elastic.Out)
      .start();
  }

  pulseWave() {
    // Create expanding shockwave rings
    const waveCount = this.phase;
    for (let i = 0; i < waveCount; i++) {
      this.game.time.events.add(i * 300, () => {
        this.createShockwave();
      });
    }
  }

  createShockwave() {
    const shockwave = this.game.add.graphics(0, 0);
    shockwave.lineStyle(3, 0xff0000, 1);
    shockwave.drawCircle(0, 0, 50);
    shockwave.x = this.game.world.centerX;
    shockwave.y = this.game.world.centerY;
    shockwave.radius = 50;
    shockwave.alpha = 1;

    const tween = this.game.add.tween(shockwave);
    tween.to({ radius: 400, alpha: 0 }, 1000, Phaser.Easing.Linear.None);
    tween.onUpdateCallback(() => {
      shockwave.clear();
      shockwave.lineStyle(3, 0xff0000, shockwave.alpha);
      shockwave.drawCircle(0, 0, shockwave.radius);
    });
    tween.onComplete.add(() => {
      shockwave.destroy();
    });
    tween.start();
  }

  createProjectile(angle) {
    const projectile = this.game.add.graphics(0, 0);
    projectile.beginFill(0xffff00, 1);
    projectile.drawCircle(0, 0, 10);
    projectile.endFill();

    projectile.x = this.game.world.centerX;
    projectile.y = this.game.world.centerY;
    projectile.velocity = {
      x: Math.cos(angle) * 3,
      y: Math.sin(angle) * 3
    };

    this.projectiles.push(projectile);
  }

  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.velocity.x;
      proj.y += proj.velocity.y;

      // Check collision with balls - bounce off instead of destroying
      for (const ball of this.state.balls) {
        const dx = proj.x - ball.sprite.x;
        const dy = proj.y - ball.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 15) {
          // Hit ball - bounce projectile away
          proj.velocity.x = -proj.velocity.x;
          proj.velocity.y = -proj.velocity.y;
          proj.x += proj.velocity.x * 2;
          proj.y += proj.velocity.y * 2;
          break;
        }
      }

      // Remove if off screen
      if (proj.x < 0 || proj.x > this.game.width ||
          proj.y < 0 || proj.y > this.game.height) {
        proj.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    // Flash red
    this.core.beginFill(0xffffff, 1);
    this.core.drawCircle(0, 0, this.coreRadius);
    this.core.endFill();
    this.game.time.events.add(100, () => {
      this.drawBoss();
    });

    // Screen shake in phase 3
    if (this.phase === 3) {
      this.game.camera.shake(0.01, 200);
    }

    return this.health <= 0;
  }

  destroy() {
    for (const proj of this.projectiles) {
      proj.destroy();
    }
    this.group.destroy();
  }
}

export default Boss;