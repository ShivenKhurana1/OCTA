import level1 from '../levels/level1.js';
import level2 from '../levels/level2.js';
import level3 from '../levels/level3.js';
import level4 from '../levels/level4.js';
import level5 from '../levels/level5.js';
import level6 from '../levels/level6.js';
import level7 from '../levels/level7.js';
import level8 from '../levels/level8.js';
import level9 from '../levels/level9.js';

const levels = {
  1: level1,
  2: level2,
  3: level3,
  4: level4,
  5: level5,
  6: level6,
  7: level7,
  8: level8,
  9: level9
};

export default {
  getLevelConfig(levelNumber) {
    return levels[levelNumber] || levels[1];
  }
};