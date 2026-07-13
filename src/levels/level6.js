export default {
  level: 6,
  octagon: {
    sides: 14,
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
      y: -80,
      width: 80,
      height: 15,
      rotationSpeed: 1
    },
    {
      x: -70,
      y: 50,
      width: 80,
      height: 15,
      rotationSpeed: 1
    },
    {
      x: 70,
      y: 50,
      width: 80,
      height: 15,
      rotationSpeed: 1
    }
  ]
};