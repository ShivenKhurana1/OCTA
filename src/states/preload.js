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

    // 2. Dynamic stepping octagon loader
    this.loaderOctagon = this.game.add.graphics(this.game.world.centerX, this.game.world.centerY);
    this.drawLoadingOctagon();

    this.targetRotation = 0;
    this.stepInterval = 600; 
    this.rotateSpeed = 0.15;  
    this.stepTimer = this.game.time.create(false);
    
    this.stepTimer.loop(this.stepInterval, () => {
      this.targetRotation += Math.PI / 4;
    }, this);
    this.stepTimer.start();

    try {
      const musicManager = new MusicManager();
      const soundManager = new SoundManager();

      // Safety timeout wrapper helper
      const withTimeout = (promise, label, ms = 4000) => {
        return Promise.race([
          promise,
          new Promise((resolve) => setTimeout(() => {
            console.warn(`Loader warning: ${label} timed out after ${ms}ms. Force resolving.`);
            resolve();
          }, ms))
        ]);
      };

      // 3. WebFont Loader with safety timeout
      const fontPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("WebFont load timed out. Continuing with fallbacks.");
          resolve();
        }, 3000);

        const wfconfig = {
          custom: {
            families: ['springsteel'],
          },
          active: () => {
            clearTimeout(timeout);
            resolve();
          },
          inactive: () => {
            clearTimeout(timeout);
            resolve();
          }
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

      // Wrap loaders in safety timeouts to prevent silent hangs
      const promises = [
        withTimeout(data.instruments[0].load(), "Instruments").catch(e => {
          console.error('Instrument loading error:', e);
          return null;
        }),
        withTimeout(musicManager.load(), "MusicManager").catch(e => {
          console.error('Music loading error:', e);
          return null;
        }),
        withTimeout(soundManager.load(), "SoundManager").catch(e => {
          console.error('Sound loading error:', e);
          return null;
        }),
        fontPromise
      ];

      await Promise.all(promises);
      
      this.cleanupLoader();
      this.game.state.start('Main', true, false, data);
    }
    catch(err) {
      console.error("Preload create error:", err);
      console.error("Error details:", err.message, err.stack);
      this.cleanupLoader();
      
      const errorText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, 
        'Error: Unable to load the game!', {
        align: 'center',
        fill: 'white',
        font: "18px 'springsteel'"
      });
      errorText.anchor.setTo(0.5);
    }
  }

  drawLoadingOctagon() {
    const size = 65; 
    const sides = 8;
    
    this.loaderOctagon.clear();
    this.loaderOctagon.beginFill(0xffffff, 0.1);
    this.loaderOctagon.lineStyle(4, 0xffffff, 0.9);
    
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