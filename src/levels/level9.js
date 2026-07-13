export default {
  level: 9,
  isBossLevel: true,
  octagon: {
    sides: 16,
    rotationReversal: true,
    pulsingBoundaries: true,
    asymmetricalWarping: true
  },
  lasers: {
    enabled: true,
    warningFrames: 60,
    activeFrames: 45,
    cooldownFrames: 150
  },
  obstacles: [
    {
      x: 0,
      y: 0,
      width: 160,
      height: 15,
      rotationSpeed: 2
    },
    {
      x: 0,
      y: 0,
      width: 15,
      height: 160,
      rotationSpeed: 2
    }
  ],
  boss: {
    maxHealth: 100,
    phases: 3
  }
};