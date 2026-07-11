import Wall from './wall';
import teoria from 'teoria';
import CONSTANTS from '../utils/constants';

class Octagon {
  constructor(state, instruments, sides = 8) {
    this.game = state.game;
    this.state = state;
    this.sides = sides;

    this.baseRadius = CONSTANTS.OCTAGON_SIZE / 2;
    this.currentRotationDirection = 1;
    this.timeCounter = 0;
    
    // Laser state
    this.laserTimer = 0;
    this.laserActive = false;
    this.laserWarning = false;
    this.laserStartIndex = 0;
    this.laserEndIndex = 0;
    this.laserFlickerState = true; // Flashes laser beam on/off slowly

    // Laser drawing overlay
    this.laserGraphics = this.game.add.graphics(0, 0);

    const length = 2 * this.baseRadius * Math.tan(Math.PI / sides);
    const scale = teoria.scale('G3', 'minor').notes();

    const notes = [];
    for (let i = 0; i < sides; i++) {
      const octaveShift = Math.floor(i / 7);
      const noteIdx = i % 7;
      let note = scale[noteIdx];
      for (let o = 0; o < octaveShift; o++) {
        note = note.interval('P8');
      }
      notes.push(note.scientific());
    }

    let step = 3;
    while (step < sides) {
      const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
      if (gcd(step, sides) === 1) break;
      step++;
    }

    this.walls = [];
    for (let i = 0; i < sides; i++) {
      const angle = i * (2 * Math.PI / sides);
      const noteIdx = (i * step) % sides;
      const wall = new Wall(state, length, angle, this.baseRadius, notes[noteIdx], instruments[0]);
      
      state.collisionManager.setMaterial(wall.sprite.body, 'wall');
      state.collisionManager.setCollisions(wall.sprite.body, 'wall');
      
      this.walls.push(wall);
    }
  }

  destroy() {
    for (const wall of this.walls) {
      wall.destroy();
    }
    this.walls = [];
    if (this.laserGraphics) {
      this.laserGraphics.destroy();
    }
  }

  render() {
    for (const wall of this.walls) {
      wall.render();
    }
    
    // Render the lasers on top of the geometry
    this.drawLaser();
  }

  update() {
    this.timeCounter += 0.015;
    this.laserTimer += 1;

    const currentLevel = this.state.level;

    // ── 1. Reversing Rotation Direction (Active on Level 2+) ──
    if (currentLevel >= 2) {
      if (this.game.time.fps && Math.floor(this.timeCounter) % 8 === 0 && Math.floor(this.timeCounter) > 0) {
        if (!this._reversedThisInterval) {
          this.currentRotationDirection *= -1;
          this._reversedThisInterval = true;
        }
      } else {
        this._reversedThisInterval = false;
      }
    }

    const rotationSpeed = CONSTANTS.OCTAGON_ROTATION_SPEED * this.currentRotationDirection;
    for (const wall of this.walls) {
      wall.rotate(rotationSpeed);
    }

    // ── 2. Pulsing Boundaries (Only active on Levels 3, 5, 7) ──
    let pulseFactor = 1;
    if (currentLevel === 3 || currentLevel === 5 || currentLevel === 7) {
      pulseFactor = 1 + 0.15 * Math.sin(this.timeCounter * 2);
    }
    const scaledRadius = this.baseRadius * pulseFactor;

    // ── 3. Asymmetrical Warping (Only active on Levels 4, 6, 8) ──
    let stretchX = 1;
    let stretchY = 1;
    if (currentLevel === 4 || currentLevel === 6 || currentLevel === 8) {
      stretchX = 1 + 0.1 * Math.sin(this.timeCounter * 1.5);
      stretchY = 1 + 0.1 * Math.cos(this.timeCounter * 1.5);
    }

    // Update wall coordinates
    for (const wall of this.walls) {
      wall.updatePosition(scaledRadius, stretchX, stretchY);
    }

    // ── 4. Laser Gate Flickering (Only on Level 4+) ──
    if (currentLevel >= 4) {
      // Loop cycle: 0-120frames (Warning phase), 120-150frames (Laser active/firing phase - 0.5s), 150-400frames (Off cooldown)
      const cycle = this.laserTimer % 400;
      
      if (cycle === 0) {
        // Pick random start wall index
        this.laserStartIndex = Math.floor(Math.random() * this.walls.length);
        
        // Target index must NOT be adjacent (index-1, index, index+1)
        const validIndices = [];
        for (let i = 0; i < this.walls.length; i++) {
          const diff = Math.abs(i - this.laserStartIndex);
          const isAdjacent = (diff <= 1) || (diff === this.walls.length - 1);
          if (!isAdjacent) {
            validIndices.push(i);
          }
        }
        
        // Select a random valid target index
        if (validIndices.length > 0) {
          const randTargetIdx = Math.floor(Math.random() * validIndices.length);
          this.laserEndIndex = validIndices[randTargetIdx];
        } else {
          // Fallback if shape has too few sides
          this.laserEndIndex = (this.laserStartIndex + Math.floor(this.walls.length / 2)) % this.walls.length;
        }

        this.laserWarning = true;
        this.laserActive = false;
      } else if (cycle === 120) {
        this.laserWarning = false;
        this.laserActive = true;
        this.state.soundManager.play('shoot'); 
      } else if (cycle === 150) {
        this.laserActive = false;
        this.laserWarning = false;
      }

      // Slow down the flicker cycle (swaps state every 18 frames / ~300ms)
      if (this.laserActive) {
        this.laserFlickerState = (Math.floor(this.laserTimer / 18) % 2 === 0);
        // Only verify collisions when the laser is physically flicker-active
        if (this.laserFlickerState) {
          this.checkLaserCollision();
        }
      }
    } else {
      this.laserActive = false;
      this.laserWarning = false;
    }
  }

  drawLaser() {
    this.laserGraphics.clear();
    if ((!this.laserActive && !this.laserWarning) || this.walls.length === 0) return;

    const wallA = this.walls[this.laserStartIndex].sprite;
    const wallB = this.walls[this.laserEndIndex].sprite;

    if (this.laserWarning) {
      // Draw faint flashing dotted warning line (yellow)
      if (Math.floor(this.game.time.time / 150) % 2 === 0) {
        this.laserGraphics.lineStyle(2, 0xffcc00, 0.4);
        this.laserGraphics.moveTo(wallA.x, wallA.y);
        this.laserGraphics.lineTo(wallB.x, wallB.y);
      }
    } else if (this.laserActive && this.laserFlickerState) {
      // Draw intense firing laser beam (thick neon red/cyan outer glow)
      this.laserGraphics.lineStyle(6, 0xff3333, 0.35); // Outer glow
      this.laserGraphics.moveTo(wallA.x, wallA.y);
      this.laserGraphics.lineTo(wallB.x, wallB.y);

      this.laserGraphics.lineStyle(2, 0xffffff, 0.9); // Inner bright core
      this.laserGraphics.moveTo(wallA.x, wallA.y);
      this.laserGraphics.lineTo(wallB.x, wallB.y);
    }
  }

  // Segment-point collision test helper
  checkLaserCollision() {
    if (this.state.balls.length === 0) return;
    
    const wallA = this.walls[this.laserStartIndex].sprite;
    const wallB = this.walls[this.laserEndIndex].sprite;

    for (const ball of this.state.balls) {
      const bx = ball.sprite.x;
      const by = ball.sprite.y;

      // Distance from point (ball) to line segment (laser beam)
      const A = bx - wallA.x;
      const B = by - wallA.y;
      const C = wallB.x - wallA.x;
      const D = wallB.y - wallA.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;
      if (param < 0) {
        xx = wallA.x;
        yy = wallA.y;
      } else if (param > 1) {
        xx = wallB.x;
        yy = wallB.y;
      } else {
        xx = wallA.x + param * C;
        yy = wallA.y + param * D;
      }

      const dx = bx - xx;
      const dy = by - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If ball touches the laser beam segment, vaporize it
      if (distance < (CONSTANTS.BALL_SIZE / 2) + 6) {
        ball.teleportToPlayer();
      }
    }
  }
}

export default Octagon;