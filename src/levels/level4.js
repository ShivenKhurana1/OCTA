export default {
  level: 4,
  octagon: {
    sides: 12,
    rotationReversal: true,
    pulsingBoundaries: false,
    asymmetricalWarping: true
  },
  lasers: {
    enabled: true,
    warningFrames: 120,
    activeFrames: 30,
    cooldownFrames: 250
  },
  obstacles: [
    {
      x: 0,
      y: 0,
      width: 120,
      height: 15,
      rotationSpeed: 0.7
    }
  ]
};