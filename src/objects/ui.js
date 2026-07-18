import CONSTANTS from '../utils/constants';

class UI {

  constructor(game) {
    this.game = game;

    // Title screen
    this.title = this.game.add.group();
    this.title.x = this.game.world.centerX;
    this.title.y = this.game.world.centerY;
    const octave = this.game.make.text(0, 0, 'OCTA', {
      align: 'center',
      fill: 'white',
      font: `${CONSTANTS.TITLE_OCTAVE_SIZE}px 'springsteel'`
    });
    octave.anchor.x = 0.5;
    octave.anchor.y = 0.5;
    this.title.add(octave);
    
    // Press start
    this.pressStart = this.game.add.text(this.game.world.centerX, this.game.world.centerY + CONSTANTS.TITLE_START_POSITION, 'START / SPACEBAR', {
      align: 'center',
      fill: 'white',
      font: `${CONSTANTS.TITLE_START_SIZE}px 'springsteel'`
    });
    this.pressStart.anchor.x = 0.5;
    this.pressStart.anchor.y = 0.5;
    this.pressStart.alpha = CONSTANTS.UI_OPACITY;

    // Control display
    this.controls = this.game.add.group();
    this.controls.x = this.game.world.centerX;
    this.controls.y = CONSTANTS.CONTROLS_POSITION.y + 40;
    const infoText = this._makeText(0, 0, 24, "CONTROLS:\n- MOVE by hovering your mouse cursor\n- PRESS SPACEBAR to shoot towards the center", true);
    this.controls.add(infoText);

    // Score
    this.scoreLabels = {};
    this.score = this.game.add.group();
    this.score.x = this.game.world.centerX;
    this.score.y = this.game.world.centerY;
    this._makeScoreDisplay('time', CONSTANTS.SCORE_TIME_POSITION);
    this._makeScoreDisplay('hits', CONSTANTS.SCORE_HITS_POSITION);
    this.score.visible = false;

    // Level display
    this.levelText = this.game.add.text(40, 40, 'LEVEL 1', {
      align: 'left',
      fill: 'white',
      font: "24px 'springsteel'"
    });
    this.levelText.anchor.x = 0;
    this.levelText.anchor.y = 0;
    this.levelText.alpha = CONSTANTS.UI_OPACITY;

    this.bossHealthGroup = this.game.add.group();
    this.bossHealthGroup.visible = false;
        
    this.bossHealthBg = this.game.add.graphics(0, 0);
    this.bossHealthBg.beginFill(0x333333, 0.8);
    this.bossHealthBg.drawRect(0, 0, 400, 30);
    this.bossHealthBg.endFill();
    this.bossHealthGroup.add(this.bossHealthBg);
        
    this.bossHealthBar = this.game.add.graphics(0, 0);
    this.bossHealthBar.beginFill(0xff0000, 1);
    this.bossHealthBar.drawRect(2, 2, 396, 26);
    this.bossHealthBar.endFill();
    this.bossHealthGroup.add(this.bossHealthBar);
        
    this.bossHealthGroup.x = this.game.world.centerX - 200;
    this.bossHealthGroup.y = 60;
        
    this.bossLabel = this.game.add.text(this.game.world.centerX, 45, 'THE CONDUCTOR', {
      align: 'center',
      fill: '#ff4444',
      font: "20px 'springsteel'"
    });
    this.bossLabel.anchor.x = 0.5;
    this.bossLabel.anchor.y = 0.5;
    this.bossLabel.visible = false;
    this.bossHealthGroup.add(this.bossLabel);
    // Player health bar (for boss battles)
    this.playerHealthGroup = this.game.add.group();
    this.playerHealthGroup.visible = false;

    this.playerHealthBg = this.game.add.graphics(0, 0);
    this.playerHealthBg.beginFill(0x333333, 0.8);
    this.playerHealthBg.drawRect(0, 0, 400, 30);
    this.playerHealthBg.endFill();
    this.playerHealthGroup.add(this.playerHealthBg);

    this.playerHealthBar = this.game.add.graphics(0, 0);
    this.playerHealthBar.beginFill(0x00ff00, 1);
    this.playerHealthBar.drawRect(2, 2, 396, 26);
    this.playerHealthBar.endFill();
    this.playerHealthGroup.add(this.playerHealthBar);

    this.playerHealthGroup.x = this.game.world.centerX - 200;
    this.playerHealthGroup.y = 100;

    this.playerLabel = this.game.add.text(this.game.world.centerX, 85, 'PLAYER', {
      align: 'center',
      fill: '#00ff00',
      font: "20px 'springsteel'"
    });
    this.playerLabel.anchor.x = 0.5;
    this.playerLabel.anchor.y = 0.5;
    this.playerLabel.visible = false;
    this.playerHealthGroup.add(this.playerLabel);
  }

  hideTitle() {
    this.title.visible = false;
    this.pressStart.visible = false;
    this.score.visible = false;
    this.scoreLabels.time.new.visible = false;
    this.scoreLabels.hits.new.visible = false;
    this.scoreLabels.hits.perfect.visible = false;
  }

  hideControls() {
    this.controls.visible = false;
  }
  showBossHealth() {
    this.bossHealthGroup.visible = true;
    this.bossLabel.visible = true;
  }

  hideBossHealth() {
    this.bossHealthGroup.visible = false;
    this.bossLabel.visible = false;
  }

  updateBossHealth(current, max) {
    const percentage = current / max;
    this.bossHealthBar.clear();
    this.bossHealthBar.beginFill(0xff0000, 1);
    this.bossHealthBar.drawRect(2, 2, 396 * percentage, 26);
    this.bossHealthBar.endFill();
  }
  showPlayerHealth() {
    this.playerHealthGroup.visible = true;
    this.playerLabel.visible = true;
  }

  hidePlayerHealth() {
    this.playerHealthGroup.visible = false;
    this.playerLabel.visible = false;
  }

  updatePlayerHealth(current, max) {
    const percentage = current / max;
    this.playerHealthBar.clear();
    // Change color based on health
    const color = percentage > 0.5 ? 0x00ff00 : percentage > 0.25 ? 0xffff00 : 0xff0000;
    this.playerHealthBar.beginFill(color, 1);
    this.playerHealthBar.drawRect(2, 2, 396 * percentage, 26);
    this.playerHealthBar.endFill();
  }
  showTitle() {
    this.title.visible = true;
    this.score.visible = true;
    this.game.world.bringToTop(this.title);
    this.game.world.bringToTop(this.score);
  }

  updateScore(time, hits) {
    this.scoreLabels.time.value.text = this._writeTime(time);
    let bestTime = localStorage.getItem('inoctave.time');
    if (!bestTime || time < bestTime) {
      localStorage.setItem('inoctave.time', time);
      this.scoreLabels.time.new.visible = !!bestTime;
      bestTime = time;
    }
    this.scoreLabels.time.best.text = this._writeTime(bestTime);

    this.scoreLabels.hits.value.text = `${hits}`;
    let bestHits = localStorage.getItem('inoctave.hits');
    if (!bestHits || hits < bestHits) {
      localStorage.setItem('inoctave.hits', hits);
      this.scoreLabels.hits.new.visible = !!bestHits;
      bestHits = hits;
    }
    this.scoreLabels.hits.best.text = bestHits;
    this.scoreLabels.hits.perfect.visible = hits === 0;
  }

  updateLevel(level) {
    this.levelText.text = `LEVEL ${level}`;
  }

  _writeTime(time) {
    const minutes = Math.floor(time / (60 * 1000));
    const seconds = Math.floor(time / 1000) % 60;
    const milliseconds = Math.round((time % 1000) / 10);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${milliseconds < 10 ? '0' : ''}${milliseconds}`;
  }

  _makeScoreDisplay(name, position) {
    const scoreDisplay = this.game.add.group();
    scoreDisplay.y = position;
    this.score.add(scoreDisplay);
    
    scoreDisplay.add(this._makeText(0, CONSTANTS.SCORE_LABEL_POSITION, CONSTANTS.SCORE_LABEL_SIZE, name.toUpperCase(), true));
    
    this.scoreLabels[name] = {};
    this.scoreLabels[name].value = this._makeText(-CONSTANTS.SCORE_VALUE_POSITION.x, CONSTANTS.SCORE_VALUE_POSITION.y, CONSTANTS.SCORE_VALUE_SIZE, '', true);
    this.scoreLabels[name].best = this._makeText(CONSTANTS.SCORE_VALUE_POSITION.x, CONSTANTS.SCORE_VALUE_POSITION.y, CONSTANTS.SCORE_VALUE_SIZE, '', true, CONSTANTS.SCORE_BEST_COLOR);
    this.scoreLabels[name].new = this._makeText(0, CONSTANTS.SCORE_NEW_POSITION, CONSTANTS.SCORE_NEW_SIZE, 'NEW RECORD', true, CONSTANTS.SCORE_BEST_COLOR);
    this.scoreLabels[name].perfect = this._makeText(0, CONSTANTS.SCORE_PERFECT_POSITION, CONSTANTS.SCORE_NEW_SIZE, 'PERFECT', true, CONSTANTS.SCORE_BEST_COLOR);
    
    scoreDisplay.add(this.scoreLabels[name].value);
    scoreDisplay.add(this.scoreLabels[name].best);
    scoreDisplay.add(this.scoreLabels[name].new);
    scoreDisplay.add(this.scoreLabels[name].perfect);

    this.scoreLabels[name].new.visible = false;
    this.scoreLabels[name].perfect.visible = false;
  }

  _makeText(x, y, size, value, alpha=false, color='white') {
    const text = this.game.make.text(x, y, value, {
      align: 'center',
      fill: color,
      font: `${size}px 'springsteel'`
    });
    text.anchor.x = 0.5;
    text.anchor.y = 0.5;
    text.alpha = alpha ? CONSTANTS.UI_OPACITY : 1;
    return text;
  }
  
}

export default UI;
