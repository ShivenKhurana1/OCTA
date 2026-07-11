import Phaser from 'phaser';
import Player from '../objects/player';
import Octagon from '../objects/octagon';
import CollisionManager from '../objects/collision-manager';
import ProgressDisplay from '../objects/progress-display';
import CONSTANTS from '../utils/constants';

/**
 * Tutorial – a fully playable introductory level.
 *
 * The game world (octagon, player, background) is visible from the start.
 * Small hint boxes appear to guide the player through:
 *   0 – "Move your mouse to guide the player"
 *   1 – "Press SPACEBAR to shoot toward the centre"
 *   2 – (ball flying) "Each wall plays a note – listen!"
 *   3 – (ball caught) "You reloaded! Keep shooting."
 *   4 – (octave done) "You completed an octave! Starting the game…"
 */
class Tutorial extends Phaser.State {

  init(data) {
    this.data = data;
  }

  preload() {}

  create() {
    // ── Background ──────────────────────────────────────────────────────
    this.background = this.data.background;
    this.background.addToWorld();
    this.backgroundGroup = this.game.add.group();

    // ── Core systems (same as Main) ─────────────────────────────────────
    this.collisionManager = new CollisionManager(this.game);
    this.musicManager     = this.data.musicManager;
    this.soundManager     = this.data.soundManager;

    this.progress = new ProgressDisplay(this.game, this.background);
    this.octagon  = new Octagon(this, this.data.instruments, 5);
    this.player   = new Player(this);

    // Game-state bookkeeping expected by Player / Ball / Wall
    this.level            = 1;
    this.nextLevelCounter = 8;
    this.ballsOut         = false;
    this.balls            = [];
    this.obstacles        = [];
    this.hits             = 0;
    this.started          = true;

    // ── Cursor ──────────────────────────────────────────────────────────
    this.game.canvas.style.cursor = 'none';
    const cursorFullSize = CONSTANTS.CURSOR_SIZE + CONSTANTS.CURSOR_WIDTH;
    this.bmdCursor = this.game.make.bitmapData(cursorFullSize, cursorFullSize);
    this.displayCursor = false;
    const cursorSprite = this.game.add.image(0, 0, this.bmdCursor);
    cursorSprite.anchor.x = 0.5;
    cursorSprite.anchor.y = 0.5;
    this.game.input.addMoveCallback((pointer, x, y) => {
      if (!this.displayCursor) { this.drawCursor(); }
      cursorSprite.x = x;
      cursorSprite.y = y;
      this._mousePixels = (this._mousePixels || 0) + 1;
    });

    // ── Activate the player and music immediately ───────────────────────
    this.musicManager.startLevel(1);
    this.soundManager.play('start');
    this.player.activate();

    // ── Input ───────────────────────────────────────────────────────────
    this.spaceKey = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

    // ── Tutorial hint layer (on top of everything) ──────────────────────
    this._hintGroup = this.game.add.group();
    this._arrowGroup = this.game.add.group();
    this._mousePixels = 0;
    this._wallHitsTotal = 0;
    this._hasCaught = false;
    
    // Tutorial progress indicator
    this._createProgressIndicator();
    
    // Skip button
    this._createSkipButton();
    
    // Start at step 0
    this._step = -1;
    this._advanceStep();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Step machine – each step shows a small hint and waits for a condition
  // ════════════════════════════════════════════════════════════════════════

  _advanceStep() {
    this._step += 1;
    this._clearHint();
    this._updateProgressIndicator();
    switch (this._step) {

        // ── Step 0: Move ─────────────────────────────────────────────────
        case 0:
        this._showHint('Move your mouse to guide the player', 'top');
        this._showArrow(this.game.world.centerX, this.game.world.centerY + 100, 'up');
        this._mousePixels = 0;
        this._stepCheck = () => {
            if (this._mousePixels > 60) {
            this._stepCheck = null;
            this._advanceStep();
            }
        };
        break;
        
        // ── Step 1: Shoot ────────────────────────────────────────────────
        case 1:
        this._showHint('Press SPACEBAR to shoot toward the centre', 'top');
        this._showArrow(this.game.world.centerX, this.game.world.centerY - 150, 'down');
        this.spaceKey.onDown.addOnce(() => {
            this.player.handleActionKey();
            this._advanceStep();
        }, this);
        break;
        
        // ── Step 2: Listen to notes ──────────────────────────────────────
        case 2:
        this._showHint('Each wall plays a note — listen!', 'bottom');
        this._showArrow(this.game.world.centerX, this.game.world.centerY - 100, 'down');
        // Will be advanced by setBallsOut(false) when ball is caught
        this._waitingForCatch = true;
        break;
        
        // ── Step 3: Caught – keep going ──────────────────────────────────
        case 3:
        this._showHint('You reloaded! Keep shooting to hit every wall.', 'top');
        this._waitingForCatch = false;
        this._freePlay = true;
        this.spaceKey.onDown.addOnce(() => {
            this._clearHint();
            this._clearArrow();
            this.player.handleActionKey();
            this._showHint('Hit all 8 walls to complete an octave!', 'bottom');
        }, this);
        break;
        
        // ── Step 4: Octave complete ──────────────────────────────────────
        case 4:
        this._clearHint();
        this._clearArrow();
        this._showHint('You completed an octave! Starting the real game…', 'center');
        this.game.time.events.add(2500, () => {
            this._cleanup();
            this.data.tutorialDone = true;
            this.game.state.start('Main', true, false, this.data);
            this.game.state.start('Story', true, false, this.data);
        }, this);
        break;

      default:
        break;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Game-loop hooks (same interface as Main)
  // ════════════════════════════════════════════════════════════════════════

  update() {
    if (this.octagon)  this.octagon.update();
    if (this.player)   this.player.update();
    for (const ball of this.balls) { ball.update(); }
    if (this._stepCheck) this._stepCheck();
  }

  render() {
    if (this.player)  this.player.render();
    if (this.octagon) this.octagon.render();
    this.progress.render();
    for (const ball of this.balls) { ball.render(); }
  }

  hitWall() {
    if (this.ballsOut) {
      this._wallHitsTotal += 1;
      this.nextLevelCounter -= 1;
      this.progress.increment(
        this.level * 8 - this.nextLevelCounter,
        this.level * 8
      );
      this.musicManager.progress(
        (this.level * 8 - this.nextLevelCounter) / (this.level * 8)
      );

      if (this.nextLevelCounter <= 0) {
        this.musicManager.stopLevel(this.level);
        this.ballsOut = false;
        this.updateCursor();
        this.progress.complete();
        // Jump to the completion step
        this._step = 3;
        this._advanceStep();
      }
    }
  }

  setBallsOut(value) {
    this.ballsOut = value;
    if (!value) {
      this.nextLevelCounter = this.level * 8;
      this.progress.clear();
      this.musicManager.clear();
      this.hits += 1;

      if (this._waitingForCatch) {
        this._advanceStep();
        return;
      }

      // Free play – rebind spacebar for shooting
      if (this._freePlay && this._step <= 4) {
        this.spaceKey.onDown.addOnce(() => {
          this.player.handleActionKey();
        }, this);
      }
    }
  }

  addBall(ball)        { this.balls.push(ball); }
  removeBall(ball)     { this.balls.splice(this.balls.indexOf(ball), 1); }
  addToBackground(obj) { this.backgroundGroup.addChild(obj); }
  hideControls()       { /* no controls panel in tutorial */ }
  spawnObstacles()     { /* no obstacles in tutorial */ }

  // ── Cursor helpers ────────────────────────────────────────────────────
  drawCursor() {
    this.displayCursor = true;
    const s = CONSTANTS.CURSOR_SIZE + CONSTANTS.CURSOR_WIDTH;
    this.bmdCursor.clear();
    this.bmdCursor.ctx.strokeStyle = `rgba(255,255,255,${this.ballsOut ? 0.2 : 0.5})`;
    this.bmdCursor.ctx.lineWidth = CONSTANTS.CURSOR_WIDTH;
    this.bmdCursor.ctx.beginPath();
    this.bmdCursor.ctx.arc(s / 2, s / 2, CONSTANTS.CURSOR_SIZE / 2, 0, 2 * Math.PI);
    this.bmdCursor.ctx.stroke();
  }
  hideCursor()   { this.displayCursor = false; this.bmdCursor.clear(); }
  updateCursor() { if (this.displayCursor) this.drawCursor(); }

  // ════════════════════════════════════════════════════════════════════════
  //  Hint UI – small floating text boxes, NOT full-screen overlays
  // ════════════════════════════════════════════════════════════════════════

  _showHint(message, position) {
    const cx = this.game.world.centerX;
    let y;
    if (position === 'top')         y = 60;
    else if (position === 'bottom') y = this.game.height - 60;
    else                            y = this.game.world.centerY;

    // Pill-shaped backdrop
    const style = { font: "22px 'springsteel'", fill: '#ffffff', align: 'center' };
    const text = this.game.add.text(cx, y, message, style);
    text.anchor.setTo(0.5);

    // Measure and draw a rounded-rect behind
    const pad = 20;
    const bg = this.game.add.graphics(0, 0);
    bg.beginFill(0x000000, 0.6);
    bg.drawRoundedRect(
      cx - text.width / 2 - pad,
      y - text.height / 2 - pad / 2,
      text.width + pad * 2,
      text.height + pad,
      12
    );
    bg.endFill();

    this._hintGroup.add(bg);
    this._hintGroup.add(text);

    // Subtle fade-in
    bg.alpha = 0;
    text.alpha = 0;
    this.game.add.tween(bg).to({ alpha: 1 }, 300, Phaser.Easing.Linear.None, true);
    this.game.add.tween(text).to({ alpha: 1 }, 300, Phaser.Easing.Linear.None, true);

    this.game.world.bringToTop(this._hintGroup);
  }

  _clearHint() {
    this._hintGroup.removeAll(true);
  }

  _clearArrow() {
    this._arrowGroup.removeAll(true);
  }

  _showArrow(x, y, direction) {
    this._clearArrow();
    
    const arrow = this.game.add.graphics(x, y);
    const size = 30;
    const color = 0xffffff;
    
    arrow.lineStyle(4, color, 1);
    arrow.beginFill(color, 0.8);
    
    if (direction === 'up') {
      arrow.moveTo(0, size);
      arrow.lineTo(-size/2, 0);
      arrow.lineTo(size/2, 0);
      arrow.lineTo(0, size);
    } else if (direction === 'down') {
      arrow.moveTo(0, -size);
      arrow.lineTo(-size/2, 0);
      arrow.lineTo(size/2, 0);
      arrow.lineTo(0, -size);
    } else if (direction === 'left') {
      arrow.moveTo(size, 0);
      arrow.lineTo(0, -size/2);
      arrow.lineTo(0, size/2);
      arrow.lineTo(size, 0);
    } else if (direction === 'right') {
      arrow.moveTo(-size, 0);
      arrow.lineTo(0, -size/2);
      arrow.lineTo(0, size/2);
      arrow.lineTo(-size, 0);
    }
    
    arrow.endFill();
    this._arrowGroup.add(arrow);
    
    // Animate arrow
    const tween = this.game.add.tween(arrow.scale).to({ x: 1.2, y: 1.2 }, 500, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
    this._arrowGroup.bringToTop(arrow);
  }

  _createProgressIndicator() {
    const totalSteps = 4;
    const dotSize = 12;
    const spacing = 20;
    const startX = this.game.world.centerX - ((totalSteps - 1) * spacing) / 2;
    const y = this.game.height - 30;
    
    this._progressDots = [];
    
    for (let i = 0; i < totalSteps; i++) {
      const dot = this.game.add.graphics(startX + i * spacing, y);
      dot.beginFill(0xffffff, 0.3);
      dot.drawCircle(0, 0, dotSize);
      dot.endFill();
      this._progressDots.push(dot);
      this._hintGroup.add(dot);
    }
    
    this._updateProgressIndicator();
  }

  _updateProgressIndicator() {
    if (!this._progressDots) return;
    
    for (let i = 0; i < this._progressDots.length; i++) {
      const dot = this._progressDots[i];
      dot.clear();
      
      if (i < this._step) {
        // Completed step
        dot.beginFill(0x00ff00, 0.8);
      } else if (i === this._step) {
        // Current step
        dot.beginFill(0xffffff, 1);
      } else {
        // Future step
        dot.beginFill(0xffffff, 0.3);
      }
      
      dot.drawCircle(0, 0, 12);
      dot.endFill();
    }
  }

  _createSkipButton() {
    const buttonX = this.game.width - 80;
    const buttonY = 30;
    
    const button = this.game.add.text(buttonX, buttonY, 'SKIP', {
      font: "16px 'springsteel'",
      fill: '#ffffff',
      align: 'center'
    });
    button.anchor.setTo(0.5);
    
    const bg = this.game.add.graphics(buttonX, buttonY);
    bg.beginFill(0x000000, 0.5);
    bg.drawRoundedRect(-30, -15, 60, 30, 8);
    bg.endFill();
    
    button.inputEnabled = true;
    button.input.useHandCursor = true;
    button.events.onInputDown.add(() => {
      this._cleanup();
      this.data.tutorialDone = true;
      this.game.state.start('Main', true, false, this.data);
    }, this);
    
    this._skipButton = { button, bg };
    this._hintGroup.add(bg);
    this._hintGroup.add(button);
  }

  _cleanup() {
    this._clearHint();
    this._clearArrow();
    if (this._skipButton) {
      this._skipButton.button.destroy();
      this._skipButton.bg.destroy();
    }
    if (this.octagon) this.octagon.destroy();
    for (const ball of this.balls) { ball.destroy(true); }
    this.balls = [];
    this.musicManager.stopLevel(this.level);
    this.musicManager.clear();
    if (this.player) this.player.desactivate();
  }
}

export default Tutorial;
