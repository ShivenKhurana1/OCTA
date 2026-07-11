import Phaser from 'phaser';
import Player from '../objects/player';
import Octagon from '../objects/octagon';
import CollisionManager from '../objects/collision-manager';
import ProgressDisplay from '../objects/progress-display';
import UI from '../objects/ui';
import Obstacle from '../objects/obstacle';
import CONSTANTS from '../utils/constants';

class Main extends Phaser.State {

  init(data) {
    this.data = data;
  }

  preload() {}

  create() {
    this.background = this.data.background;
    this.background.addToWorld();
    this.backgroundGroup = this.game.add.group();

    this.collisionManager = new CollisionManager(this.game);
    this.musicManager = this.data.musicManager;
    this.soundManager = this.data.soundManager;
    
    this.progress = new ProgressDisplay(this.game, this.background);
    this.octagon = new Octagon(this, this.data.instruments, 5);
    this.player = new Player(this);
    
    // Title screen
    this.ui = new UI(this.game);

    // Update game status
    this.level = 1;
    this.nextLevelCounter = 8;
    this.ballsOut = false;
    this.balls = [];
    this.obstacles = [];

    // Score
    this.timer = this.game.time.create(false);
    this.hits = 0;

    // Cursor
    this.game.canvas.style.cursor = 'none';
    const cursorFullSize = CONSTANTS.CURSOR_SIZE + CONSTANTS.CURSOR_WIDTH;
    this.bmdCursor = this.game.make.bitmapData(cursorFullSize, cursorFullSize);
    this.displayCursor = false;
    const cursorSprite = this.game.add.image(0, 0, this.bmdCursor);
    cursorSprite.anchor.x = 0.5;
    cursorSprite.anchor.y = 0.5;
    this.game.input.addMoveCallback((pointer, x, y) => {
      if (!this.displayCursor) {
        this.drawCursor();
      }
      cursorSprite.x = x;
      cursorSprite.y = y;
    });

    // Start the Game
    this.startGame = this.startGame.bind(this);
    this.keyboard = this.game.input.keyboard.addKeys({
      start: Phaser.KeyCode.ENTER,
      space: Phaser.KeyCode.SPACEBAR
    });
    this.keyboard.start.onDown.add(this.startGame);
    this.keyboard.space.onDown.add(this.handleSpacePress, this);

    this.started = false;
  }

  handleSpacePress() {
    if (!this.started) {
      this.startGame();
    } else {
      this.player.handleActionKey();
    }
  }
  
  startGame() {
    // If tutorial is enabled and hasn't been played yet, go to Tutorial first
    if (!this.started && CONSTANTS.SHOW_TUTORIAL && !this.data.tutorialDone) {
      this.game.state.start('Tutorial', true, false, this.data);
      return;
    }

    if (!this.started) {
      this.ui.hideTitle();
      this.player.activate();
    }
    else {
      this.player.init();
      this.progress.reset();
      this.musicManager.clear();
      this.timer.stop();
    }
    if (this.balls.length > 0) {
      for (const ball of this.balls) {
        ball.destroy(true);
      }
    }
    if (this.level > 1) {
      this.musicManager.stopLevel(this.level);
    }
    this.musicManager.startLevel(1);
    this.soundManager.play('start');

    // Update game status
    this.level = 1;
    this.nextLevelCounter = 8;
    this.ballsOut = false;
    this.balls = [];
    if (this.octagon) {
      this.octagon.destroy();
    }
    this.octagon = new Octagon(this, this.data.instruments, 5);
    this.spawnObstacles();
    this.timer.start();
    this.hits = 0;

    this.started = true;
  }

  update() {
    this.octagon.update();
    this.player.update();
    for (const ball of this.balls) {
      ball.update();
    }
    if (this.obstacles) {
      for (const obs of this.obstacles) {
        obs.update();
      }
    }
  }

  render() {
    this.player.render();
    this.octagon.render();
    this.progress.render();
    for (const ball of this.balls) {
      ball.render();
    }
  }

  setBallsOut(value) {
    this.ballsOut = value;
    this.nextLevelCounter = this.level * 8;

    if (!value) {
      this.progress.clear();
      this.musicManager.clear();
      this.hits += 1;
    }

    this.ui.hideControls();
  }

  hitWall() {
    if (this.ballsOut) {
      this.nextLevelCounter -= 1;
      this.progress.increment(this.level * 8 - this.nextLevelCounter, this.level * 8);
      this.musicManager.progress((this.level * 8 - this.nextLevelCounter) / (this.level * 8));

      if (this.nextLevelCounter <= 0) {
        this.musicManager.stopLevel(this.level);
        this.level++;
        this.ballsOut = false;
        this.updateCursor();
        this.progress.complete();
        this.musicManager.startLevel(this.level);
        
        if (this.level < 9) {
          const typeBall = this.level <= 3 ? 'default' : this.level <= 6 ? 'fast' : 'curved';
          this.player.giveBall(typeBall, true);
          this.nextLevelCounter = this.level * 8;
          if (this.octagon) {
            this.octagon.destroy();
          }
          this.octagon = new Octagon(this, this.data.instruments, this.level + 4);
          this.spawnObstacles();
        } else {
          this.player.desactivate();
          if (this.obstacles && this.obstacles.length > 0) {
            for (const obs of this.obstacles) {
              obs.destroy();
            }
          }
          this.obstacles = [];
          this.ui.updateScore(this.timer.ms, this.hits);
          this.ui.showTitle();
          this.timer.stop();
          this.started = false;
        }
      }
    }
  }

  addBall(ball) {
    this.balls.push(ball);
  }

  removeBall(ball) {
    const index = this.balls.indexOf(ball);
    this.balls.splice(index, 1);
  }

  addToBackground(object) {
    this.backgroundGroup.addChild(object);
  }

  drawCursor() {
    this.displayCursor = true;
    const cursorFullSize = CONSTANTS.CURSOR_SIZE + CONSTANTS.CURSOR_WIDTH;
    this.bmdCursor.clear();
    this.bmdCursor.ctx.strokeStyle = `rgba(255, 255, 255, ${this.ballsOut ? 0.2 : 0.5})`;
    this.bmdCursor.ctx.lineWidth = CONSTANTS.CURSOR_WIDTH;
    this.bmdCursor.ctx.beginPath();
    this.bmdCursor.ctx.arc(cursorFullSize / 2, cursorFullSize / 2, CONSTANTS.CURSOR_SIZE / 2, 0, 2 * Math.PI);
    this.bmdCursor.ctx.stroke();
  }

  hideCursor() {
    this.displayCursor = false;
    this.bmdCursor.clear();
  }

  updateCursor() {
    if (this.displayCursor) {
      this.drawCursor();
    }
  }

  spawnObstacles() {
    // Clear existing first
    if (this.obstacles && this.obstacles.length > 0) {
      for (const obs of this.obstacles) {
        obs.destroy();
      }
    }
    this.obstacles = [];

    // Spawn obstacles starting at Level 4
    if (this.level >= 4) {
      if (this.level === 4) {
        // One rotating bar in the center
        this.obstacles.push(new Obstacle(this, this.game.world.centerX, this.game.world.centerY, 120, 15, 0.7));
      } else if (this.level === 5) {
        // Two rotating bars offset from center
        this.obstacles.push(new Obstacle(this, this.game.world.centerX - 100, this.game.world.centerY, 80, 15, 1.2));
        this.obstacles.push(new Obstacle(this, this.game.world.centerX + 100, this.game.world.centerY, 80, 15, -1.2));
      } else if (this.level === 6) {
        // Triangle obstacle setup
        this.obstacles.push(new Obstacle(this, this.game.world.centerX, this.game.world.centerY - 80, 80, 15, 1));
        this.obstacles.push(new Obstacle(this, this.game.world.centerX - 70, this.game.world.centerY + 50, 80, 15, 1));
        this.obstacles.push(new Obstacle(this, this.game.world.centerX + 70, this.game.world.centerY + 50, 80, 15, 1));
      } else if (this.level >= 7) {
        // Four fast rotating bars forming a cross-like hazard
        this.obstacles.push(new Obstacle(this, this.game.world.centerX, this.game.world.centerY, 140, 15, 1.5));
        this.obstacles.push(new Obstacle(this, this.game.world.centerX, this.game.world.centerY, 15, 140, 1.5));
      }
    }
  }
}

export default Main;
