import Phaser from 'phaser';
import Instrument from '../instruments/instrument';
import MusicManager from '../instruments/music-manager';
import SoundManager from '../instruments/sound-manager';
import CONSTANTS from '../utils/constants';
import WebFont from 'webfontloader';

class Preload extends Phaser.State {

  preload() { 
    /* Preload required assets */ 
    this.load.image('pad', './assets/icons/pad.png'); 
    this.load.image('keyboard', './assets/icons/keyboard.png'); 
  }

  async create() {
    // 1. Init background
    const background = this.game.add.bitmapData(this.game.width, this.game.height);
    background.addToWorld();
    const backgroundColor = CONSTANTS.LEVELS_COLORS[0];
    background.rect(0, 0, this.game.width, this.game.width,
      `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`);

    // 2. Dynamic stepping octagon loader (larger, in absolute center)
    this.loaderOctagon = this.game.add.graphics(this.game.world.centerX, this.game.world.centerY);
    this.drawLoadingOctagon();

    // Set up step rotation variables (360 degrees / 8 sides = 45 degrees, or PI/4 radians)
    this.targetRotation = 0;
    this.stepInterval = 600; // time in ms between steps
    this.rotateSpeed = 0.15;  // speed of interpolation
    this.stepTimer = this.game.time.create(false);
    
    // Add periodic event to increment target rotation by 45 degrees (PI / 4)
    this.stepTimer.loop(this.stepInterval, () => {
      this.targetRotation += Math.PI / 4;
    }, this);
    this.stepTimer.start();

    try {
      const musicManager = new MusicManager();
      const soundManager = new SoundManager();

      const fontPromise = new Promise((resolve) => {
        const wfconfig = {
          custom: {
            families: ['springsteel'],
          },
          active: resolve
        };

        WebFont.load(wfconfig);
      });

      const data = {
        instruments: [
          new Instrument()
        ],
        musicManager,
        soundManager,
        background
      };

      const promises = [
        data.instruments[0].load(),
        musicManager.load(),
        soundManager.load(),
        fontPromise
      ];

      await Promise.all(promises);
      
      // Clean up loader resources
      this.cleanupLoader();

      // Always start the Main state (title screen); tutorial is handled from there
      this.game.state.start('Main', true, false, data);
    }
    catch(err) {
      this.cleanupLoader();
      
      // If error occurs, render a fallback message
      const errorText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, 
        'Error: Unable to load the game!\nYou might need to try another browser.', {
        align: 'center',
        fill: 'white',
        font: "18px 'springsteel'"
      });
      errorText.anchor.setTo(0.5);
      throw err;
    }
  }

  // Draw a larger vector-based octagon shape
  drawLoadingOctagon() {
    const size = 65; // increased radius size of the loader
    const sides = 8;
    
    this.loaderOctagon.clear();
    this.loaderOctagon.beginFill(0xffffff, 0.1);
    this.loaderOctagon.lineStyle(4, 0xffffff, 0.9); // thicker stroke
    
    for (let i = 0; i <= sides; i++) {
      const angle = i * (2 * Math.PI / sides);
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) {
        this.loaderOctagon.moveTo(x, y);
      } else {
        this.loaderOctagon.lineTo(x, y);
      }
    }
    
    this.loaderOctagon.endFill();
  }

  cleanupLoader() {
    if (this.stepTimer) {
      this.stepTimer.destroy();
    }
    if (this.loaderOctagon) {
      this.loaderOctagon.destroy();
    }
  }

  update() {
    if (this.loaderOctagon) {
      // Smoothly interpolate current rotation towards the target stepping rotation
      const diff = this.targetRotation - this.loaderOctagon.rotation;
      if (Math.abs(diff) > 0.001) {
        this.loaderOctagon.rotation += diff * this.rotateSpeed;
      } else {
        this.loaderOctagon.rotation = this.targetRotation;
      }
    }
  }

}

export default Preload;