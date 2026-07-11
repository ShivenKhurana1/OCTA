import Tone from 'tone';

class SoundManager{
  constructor() {
    this.requests = [];
    this.sounds = {};

    for (let sound of ['start', 'shoot', 'hit']) {
      this.sounds[sound] = new Tone.Player().toMaster();
      this.requests.push(this.sounds[sound].load(`./assets/sounds/${sound}.ogg`));
    }
  }

  load() {
    return Promise.all(this.requests);
  }

  play(sound) {
    try {
      if (!this.sounds || !this.sounds[sound]) {
        console.warn('Sound not loaded:', sound);
        return;
      }
      this.sounds[sound].start();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }
}
export default SoundManager;
