/**
 * Sadhanam Kayyilundo? - Level Definitions & Compounding Cruelty System
 */

const WRONG_GRAB_TAUNTS = [
  "Not that one.",
  "Sadhanam kayyil ഇല്ല.",
  "Confidently incorrect.",
  "Is that what you think the sadhanam looks like?",
  "Nice try. Completely wrong.",
  "That's not even in the right zip code.",
  "Do you need glasses?",
  "Sadhanam is elsewhere.",
  "Wrong. Very wrong.",
  "Nope. Try harder.",
  "Wrong item, wrong vision, wrong life choices.",
  "Sadhanam remains untouched.",
  "Valare nalladhu. But wrong.",
  "Sadhanam is not here, bro."
];

const TIMEOUT_TAUNTS = [
  "Time expired. Your hands were too slow.",
  "Sadhanam lost forever in the ether.",
  "Too slow! Sadhanam kayyil kiyittilla.",
  "Clock won. You lost.",
  "Out of time. Better luck in the next life."
];

const ITEM_TYPES = [
  { id: 'key', name: 'Golden Key', target: true, color: '#f59e0b', shape: 'key' },
  { id: 'usb', name: 'Secret USB Drive', target: true, color: '#3b82f6', shape: 'usb' },
  { id: 'teapot', name: 'Brass Teapot', target: true, color: '#d97706', shape: 'teapot' },
  { id: 'orb', name: 'Glowing Orb', target: true, color: '#ec4899', shape: 'orb' },
  { id: 'ring', name: 'Diamond Ring', target: true, color: '#06b6d4', shape: 'ring' },
  { id: 'watch', name: 'Pocket Watch', target: true, color: '#eab308', shape: 'watch' },
  
  // Decoys
  { id: 'banana', name: 'Banana', target: false, color: '#facc15', shape: 'banana' },
  { id: 'duck', name: 'Rubber Duck', target: false, color: '#fde047', shape: 'duck' },
  { id: 'shoe', name: 'Old Shoe', target: false, color: '#78350f', shape: 'shoe' },
  { id: 'glasses', name: 'Broken Glasses', target: false, color: '#64748b', shape: 'glasses' },
  { id: 'battery', name: 'AA Battery', target: false, color: '#22c55e', shape: 'battery' },
  { id: 'paper', name: 'Crumpled Paper', target: false, color: '#e2e8f0', shape: 'paper' },
  { id: 'remote', name: 'TV Remote', target: false, color: '#1e293b', shape: 'remote' },
  { id: 'mug', name: 'Coffee Mug', target: false, color: '#ef4444', shape: 'mug' },
  { id: 'apple', name: 'Red Apple', target: false, color: '#dc2626', shape: 'apple' },
  { id: 'scissors', name: 'Scissors', target: false, color: '#94a3b8', shape: 'scissors' },
  { id: 'spoon', name: 'Steel Spoon', target: false, color: '#cbd5e1', shape: 'spoon' },
  { id: 'cactus', name: 'Tiny Cactus', target: false, color: '#15803d', shape: 'cactus' },
  { id: 'car', name: 'Toy Car', target: false, color: '#3b82f6', shape: 'car' },
  { id: 'sock', name: 'Single Sock', target: false, color: '#a855f7', shape: 'sock' },
  { id: 'onion', name: 'Red Onion', target: false, color: '#c026d3', shape: 'onion' },
  { id: 'toast', name: 'Burnt Toast', target: false, color: '#b45309', shape: 'toast' },
  { id: 'paperclip', name: 'Paperclip', target: false, color: '#94a3b8', shape: 'paperclip' },
  { id: 'comb', name: 'Plastic Comb', target: false, color: '#0284c7', shape: 'comb' },
  { id: 'feather', name: 'Feather', target: false, color: '#f43f5e', shape: 'feather' },
  { id: 'donut', name: 'Glazed Donut', target: false, color: '#f472b6', shape: 'donut' },
  { id: 'floppy', name: '3.5" Floppy Disk', target: false, color: '#2563eb', shape: 'floppy' },
  { id: 'dice', name: 'Pair of Dice', target: false, color: '#f8fafc', shape: 'dice' }
];

const GAME_LEVELS = [
  {
    level: 1,
    name: "First Contact",
    targetItem: "Golden Key",
    targetShape: "key",
    scene: "public/game/assets/scenes/living_room.png",
    decoyCount: 4,
    timerSeconds: 30,
    grabRadius: 46,
    pinchThreshold: 0.075,
    description: "Find the Golden Key. Hand gestures: Point to move, Pinch to grab.",
    modifiers: {}
  },
  {
    level: 2,
    name: "Drifting Target",
    targetItem: "Secret USB Drive",
    targetShape: "usb",
    scene: "public/game/assets/scenes/kitchen.png",
    decoyCount: 7,
    timerSeconds: 28,
    grabRadius: 44,
    pinchThreshold: 0.071,
    description: "The sadhanam is drifting now. Do not be distracted.",
    modifiers: {
      driftingTarget: true,
      hasMimic: true
    }
  },
  {
    level: 3,
    name: "Hidden In Plain Sight",
    targetItem: "Brass Teapot",
    targetShape: "teapot",
    scene: "public/game/assets/scenes/garage.png",
    decoyCount: 11,
    timerSeconds: 26,
    grabRadius: 42,
    pinchThreshold: 0.065,
    description: "Target hides behind clutter. Tighter pinch precision required.",
    modifiers: {
      driftingTarget: true,
      hasMimic: true,
      hiddenBehindClutter: true,
      tightPinch: true
    }
  },
  {
    level: 4,
    name: "Fading Reality",
    targetItem: "Glowing Orb",
    targetShape: "orb",
    scene: "public/game/assets/scenes/living_room.png",
    decoyCount: 15,
    timerSeconds: 24,
    grabRadius: 39,
    pinchThreshold: 0.060,
    description: "The sadhanam is fading from existence (alpha ~0.45).",
    modifiers: {
      driftingTarget: true,
      hasMimic: true,
      hiddenBehindClutter: true,
      tightPinch: true,
      semiTransparent: true
    }
  },
  {
    level: 5,
    name: "Mimicry & Evasion",
    targetItem: "Diamond Ring",
    targetShape: "ring",
    scene: "public/game/assets/scenes/kitchen.png",
    decoyCount: 19,
    timerSeconds: 22,
    grabRadius: 36,
    pinchThreshold: 0.055,
    description: "Decoys look almost identical. Target evades your fingertip.",
    modifiers: {
      driftingTarget: true,
      hasMimic: true,
      hiddenBehindClutter: true,
      tightPinch: true,
      semiTransparent: true,
      cursorEvasion: true,
      heavyMimics: true
    }
  },
  {
    level: 6,
    name: "Inverted Controls",
    targetItem: "Pocket Watch",
    targetShape: "watch",
    scene: "public/game/assets/scenes/garage.png",
    decoyCount: 23,
    timerSeconds: 20,
    grabRadius: 34,
    pinchThreshold: 0.051,
    description: "Your neurological motor paths are broken. X & Y inverted.",
    modifiers: {
      driftingTarget: true,
      hasMimic: true,
      hiddenBehindClutter: true,
      tightPinch: true,
      semiTransparent: true,
      cursorEvasion: true,
      heavyMimics: true,
      controlsInverted: true
    }
  },
  {
    level: 7,
    name: "Upside Down",
    targetItem: "Golden Key",
    targetShape: "key",
    scene: "public/game/assets/scenes/living_room.png",
    decoyCount: 26,
    timerSeconds: 20,
    grabRadius: 32,
    pinchThreshold: 0.048,
    description: "The universe flipped vertically. Controls still inverted.",
    modifiers: {
      driftingTarget: true,
      hasMimic: true,
      hiddenBehindClutter: true,
      tightPinch: true,
      semiTransparent: true,
      cursorEvasion: true,
      heavyMimics: true,
      controlsInverted: true,
      screenFlipped: true
    }
  },
  {
    level: 8,
    name: "Quantum Jump",
    targetItem: "Secret USB Drive",
    targetShape: "usb",
    scene: "public/game/assets/scenes/kitchen.png",
    decoyCount: 29,
    timerSeconds: 20,
    grabRadius: 30,
    pinchThreshold: 0.046,
    description: "The sadhanam teleports whenever your cursor gets close.",
    modifiers: {
      driftingTarget: true,
      hasMimic: true,
      hiddenBehindClutter: true,
      tightPinch: true,
      semiTransparent: true,
      cursorEvasion: true,
      heavyMimics: true,
      controlsInverted: true,
      screenFlipped: true,
      targetTeleports: true
    }
  },
  {
    level: 9,
    name: "Camouflage Chaos",
    targetItem: "Brass Teapot",
    targetShape: "teapot",
    scene: "public/game/assets/scenes/garage.png",
    decoyCount: 36,
    timerSeconds: 18,
    grabRadius: 29,
    pinchThreshold: 0.044,
    description: "35+ objects clutter the stage. Target blends into color chaos.",
    modifiers: {
      driftingTarget: true,
      hasMimic: true,
      hiddenBehindClutter: true,
      tightPinch: true,
      semiTransparent: true,
      cursorEvasion: true,
      heavyMimics: true,
      controlsInverted: true,
      screenFlipped: true,
      targetTeleports: true,
      heavyCamouflage: true
    }
  },
  {
    level: 10,
    name: "Sadhanam Kayyil (NOT)",
    targetItem: "Golden Key",
    targetShape: "key",
    scene: "public/game/assets/scenes/living_room.png",
    decoyCount: 42,
    timerSeconds: 18,
    grabRadius: 29,
    pinchThreshold: 0.044,
    description: "EVERY MODIFIER ACTIVE. 18 seconds. THE GAME LIES TO YOU.",
    modifiers: {
      driftingTarget: true,
      hasMimic: true,
      hiddenBehindClutter: true,
      tightPinch: true,
      semiTransparent: true,
      cursorEvasion: true,
      heavyMimics: true,
      controlsInverted: true,
      screenFlipped: true,
      targetTeleports: true,
      heavyCamouflage: true,
      falseChimesOnWrongGrabs: true
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAME_LEVELS, WRONG_GRAB_TAUNTS, TIMEOUT_TAUNTS, ITEM_TYPES };
}
