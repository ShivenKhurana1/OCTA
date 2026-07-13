export default {
  level: 8,
  octagon: {
    sides: 16,
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
      width: 140,
      height: 15,
      rotationSpeed: 1.5
    },
    {
      x: 0,
      y: 0,
      width: 15,
      height: 140,
      rotationSpeed: 1.5
    }
  ]
};