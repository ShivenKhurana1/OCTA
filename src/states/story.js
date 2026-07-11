import Phaser from 'phaser';
import CONSTANTS from '../utils/constants';

class Story extends Phaser.State {
  init(data) {
    this.data = data;
  }

  create() {
    // 1. Add the shared background
    this.background = this.data.background;
    this.background.addToWorld();

    // 2. Play background music
    this.musicManager = this.data.musicManager;
    this.soundManager = this.data.soundManager;

    // Ensure music is active and playing
    try {
      this.musicManager.clear();
      this.musicManager.startLevel(1);
      // Play the start-up sound effect as a backup/intro sound cue
      this.soundManager.play('start');
    } catch (e) {
      console.warn("Could not start background audio:", e);
    }

    this.dialogue = [
      "In the beginning, there was silence...",
      "Then came the first vibration. The fundamental frequency.",
      "An Octave is the bridge between two identical notes in different realms.",
      "To progress, you must weave these frequencies together.",
      "Welcome to Octa. Let the music begin..."
    ];

    this.currentIndex = 0;
    this.isTyping = false;
    this.typingTimer = null;

    // Dialogue text style
    const style = {
      font: "28px 'springsteel'",
      fill: '#ffffff',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 600
    };

    // Center coordinates
    this.cx = this.game.world.centerX;
    this.cy = this.game.world.centerY;

    // Create the dialogue text object (starts empty)
    this.storyText = this.game.add.text(this.cx, this.cy - 40, '', style);
    this.storyText.anchor.setTo(0.5);

    // Create the Spacebar key graphic dynamically with 3D bevel and keycap face
    const keyWidth = 180;
    const keyHeight = 44;
    const radius = 6;
    this.spacebarBmd = this.game.make.bitmapData(keyWidth + 8, keyHeight + 8);
    const ctx = this.spacebarBmd.ctx;

    // Helper to draw a rounded rectangle
    const drawRoundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // 1. Draw the 3D Bevel/Base (Shadow color)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    drawRoundRect(4, 8, keyWidth, keyHeight, radius);
    ctx.fill();

    // 2. Draw the Key Face (Slightly higher to create the 3D keycap look)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    drawRoundRect(4, 4, keyWidth, keyHeight, radius);
    ctx.fill();
    ctx.stroke();

    // 3. Add clean label inside the keycap
    ctx.fillStyle = '#ffffff';
    ctx.font = "14px 'springsteel'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPACE', keyWidth / 2 + 4, keyHeight / 2 + 4);

    // Create the spacebar image but keep it hidden/invisible initially
    this.spacebarImage = this.game.add.image(this.cx, this.cy + 130, this.spacebarBmd);
    this.spacebarImage.anchor.setTo(0.5);
    this.spacebarImage.visible = false;

    // Spacebar key listener
    this.spaceKey = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    this.spaceKey.onDown.add(this.handleInput, this);

    // Start typing the first line
    this.startTyping();
  }

  startTyping() {
    this.isTyping = true;
    this.storyText.text = '';
    
    // Hide and stop flashing spacebar image
    this.spacebarImage.visible = false;
    this.game.tweens.removeFrom(this.spacebarImage);

    const fullText = this.dialogue[this.currentIndex];
    let currentLength = 0;
    const speed = 40; // speed in milliseconds per letter

    if (this.typingTimer) {
      this.typingTimer.destroy();
    }

    // Timer to add letters one by one
    this.typingTimer = this.game.time.create(false);
    this.typingTimer.repeat(speed, fullText.length, () => {
      currentLength++;
      this.storyText.text = fullText.substring(0, currentLength);
      
      if (currentLength === fullText.length) {
        this.finishTyping();
      }
    }, this);
    
    this.typingTimer.start();
  }

  finishTyping() {
    this.isTyping = false;
    this.storyText.text = this.dialogue[this.currentIndex];
    
    if (this.typingTimer) {
      this.typingTimer.destroy();
      this.typingTimer = null;
    }

    // Show and flash the spacebar graphic
    this.spacebarImage.visible = true;
    this.spacebarImage.alpha = 0;
    
    // Fade in and then pulse/blink indefinitely
    this.game.add.tween(this.spacebarImage).to({ alpha: 0.8 }, 300, Phaser.Easing.Linear.None, true).onComplete.add(() => {
      if (this.spacebarImage) {
        this.game.add.tween(this.spacebarImage).to(
          { alpha: 0.2 }, 800, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true
        );
      }
    }, this);
  }

  handleInput() {
    if (this.isTyping) {
      this.finishTyping();
    } else {
      this.currentIndex++;
      if (this.currentIndex < this.dialogue.length) {
        this.startTyping();
      } else {
        // Transition to Main gameplay state
        this.game.state.start('Main', true, false, this.data);
      }
    }
  }

  shutdown() {
    if (this.typingTimer) {
      this.typingTimer.destroy();
    }
    this.game.tweens.removeFrom(this.spacebarImage);
  }
}

export default Story;