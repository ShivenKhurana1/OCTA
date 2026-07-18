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

    let coreColor = 0xff0000; // Phase 1: Red
    let ringColor = 0xff4444;

    if (this.phase === 2) {
      coreColor = 0xffaa00; // Phase 2: Orange
      ringColor = 0xffcc44;
    } else if (this.phase === 3) {
      coreColor = 0xaa00ff; // Phase 3: Purple
      ringColor = 0xcc44ff;
    }

    // Draw core
    this.core.beginFill(coreColor, 1);
    this.core.drawCircle(0, 0, this.coreRadius);
    this.core.endFill();

    // Draw ring
    this.ring.lineStyle(4, ringColor, 1);
    this.ring.drawCircle(0, 0, this.ringRadius);
  }

  update() {
    this.pulseTimer += 0.05;
    const pulseScale = 1 + 0.1 * Math.sin(this.pulseTimer);
    this.core.scale.set(pulseScale);

    this.attackTimer++;

    // Determine phase based on health
    let newPhase = 1;
    if (this.health > 66) {
      newPhase = 1;
      this.attackCooldown = 80;
    } else if (this.health > 33) {
      newPhase = 2;
      this.attackCooldown = 60;
    } else {
      newPhase = 3;
      this.attackCooldown = 40;
    }

    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.drawBoss(); // Redraw with new color
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
      
      // In phase 3, occasionally dash toward the player
      if (this.phase === 3 && Math.random() < 0.5) {
        this.targetX = this.state.player.sprite.x;
        this.targetY = this.state.player.sprite.y;
        this.moveSpeed = 6; // Dash speed
      } else {
        // Pick new random target within bounds
        const margin = 150;
        this.targetX = margin + Math.random() * (this.game.width - margin * 2);
        this.targetY = margin + Math.random() * (this.game.height - margin * 2);
        this.moveSpeed = 2 + this.phase; // Normal speed scales with phase
      }
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
        const playerX = this.state.player.sprite.x;
        const playerY = this.state.player.sprite.y;
        const baseAngle = Math.atan2(playerY - this.group.y, playerX - this.group.x);
        
        this.createProjectile(baseAngle);
        
        // Fire spread if phase 2 or 3
        if (this.phase >= 2) {
          this.createProjectile(baseAngle - 0.3); // Left spread
          this.createProjectile(baseAngle + 0.3); // Right spread
        }
        
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

    // Check collision during the expansion
    this.game.time.events.add(100, () => {
      const pDx = this.group.x - this.state.player.sprite.x;
      const pDy = this.group.y - this.state.player.sprite.y;
      const pDist = Math.sqrt(pDx * pDx + pDy * pDy);
      
      // Ring radius expands to 150 (100 * 1.5)
      if (pDist < 160) {
        // Damage
        this.state.player.health = Math.max(0, this.state.player.health - 25);
        this.state.ui.updatePlayerHealth(this.state.player.health, this.state.player.maxHealth);
        if (this.state.player.health <= 0) {
          this.state.handlePlayerDeath();
        }
        
        // Knockback velocity
        const angle = Math.atan2(-pDy, -pDx);
        this.state.player.sprite.body.velocity.x += Math.cos(angle) * 800;
        this.state.player.sprite.body.velocity.y += Math.sin(angle) * 800;
      }
    });
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
    shockwave.hasHitPlayer = false;

    const tween = this.game.add.tween(shockwave);
    tween.to({ radius: 400, alpha: 0 }, 1000, Phaser.Easing.Linear.None);
    tween.onUpdateCallback(() => {
      shockwave.clear();
      shockwave.lineStyle(3, 0xff0000, shockwave.alpha);
      shockwave.drawCircle(0, 0, shockwave.radius);

      if (!shockwave.hasHitPlayer) {
        const pDx = shockwave.x - this.state.player.sprite.x;
        const pDy = shockwave.y - this.state.player.sprite.y;
        const pDist = Math.sqrt(pDx * pDx + pDy * pDy);
        
        if (Math.abs(pDist - shockwave.radius) < 15) {
          shockwave.hasHitPlayer = true;
          this.state.player.health = Math.max(0, this.state.player.health - 15);
          this.state.ui.updatePlayerHealth(this.state.player.health, this.state.player.maxHealth);
          if (this.state.player.health <= 0) {
            this.state.handlePlayerDeath();
          }
        }
      }
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

      // Check collision with player
      const pDx = proj.x - this.state.player.sprite.x;
      const pDy = proj.y - this.state.player.sprite.y;
      const pDist = Math.sqrt(pDx * pDx + pDy * pDy);
      
      if (pDist < 20) {
        this.state.player.health = Math.max(0, this.state.player.health - 20);
        this.state.ui.updatePlayerHealth(this.state.player.health, this.state.player.maxHealth);
        if (this.state.player.health <= 0) {
          this.state.handlePlayerDeath();
        }
        proj.destroy();
        this.projectiles.splice(i, 1);
        continue;
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