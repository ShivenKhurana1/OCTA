export default {
  level: 5,
  octagon: {
    sides: 13,
    rotationReversal: true,
    pulsingBoundaries: true,
    asymmetricalWarping: false
  },
  lasers: {
    enabled: true,
    warningFrames: 120,
    activeFrames: 30,
    cooldownFrames: 250
  },
  obstacles: [
    {
      x: -100,
      y: 0,
      width: 80,
      height: 15,
      rotationSpeed: 1.2
    },
    {
      x: 100,
      y: 0,
      width: 80,
      height: 15,
      rotationSpeed: -1.2
    }
  ]
};