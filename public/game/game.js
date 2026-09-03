/**
 * Sadhanam Kayyilundo? - Main Game Engine & Loop
 */

class SadhanamGame {
  constructor() {
    this.canvas = document.getElementById('game-stage');
    this.ctx = this.canvas.getContext('2d');
    
    // State machine: "START", "PLAYING", "PAUSED", "LEVEL_CLEAR", "GAME_OVER", "VICTORY"
    this.state = "START";
    this.currentLevelIndex = 0;
    this.missCount = 0;
    this.startTime = 0;
    this.levelStartTime = 0;
    this.remainingSeconds = 30;

    // Controls & Settings
    this.showCamera = true;
    this.showDebug = false;
    this.isMuted = false;

    // Cursor position (normalized 0..1 in stage coordinates)
    this.cursorPos = { x: 0.5, y: 0.5 };
    this.mousePos = { x: 0.5, y: 0.5 };
    this.usingMouse = true;
    this.wasPinching = false;

    // Level items
    this.items = [];
    this.targetItem = null;

    // Preloaded scene images
    this.sceneImages = {};
    this.loadSceneImages();

    // DOM Elements
    this.dom = {
      levelNum: document.getElementById('hud-level-num'),
      levelName: document.getElementById('hud-level-name'),
      targetName: document.getElementById('hud-target-name'),
      gestureBadge: document.getElementById('hud-gesture-badge'),
      missCount: document.getElementById('hud-miss-count'),
      timerBar: document.getElementById('timer-bar'),
      flashOverlay: document.getElementById('flash-overlay'),
      tauntOverlay: document.getElementById('taunt-overlay'),
      tauntText: document.getElementById('taunt-text'),
      startModal: document.getElementById('start-modal'),
      endingModal: document.getElementById('ending-modal'),
      camPreview: document.getElementById('cam-preview-container'),
      webcamVideo: document.getElementById('webcam-video'),
      skeletonCanvas: document.getElementById('skeleton-canvas'),
      camStatusLabel: document.getElementById('cam-status-label'),
      modalStatusText: document.getElementById('modal-status-text'),
      btnStart: document.getElementById('btn-start-game'),
      btnReplay: document.getElementById('btn-replay'),
      btnToggleCam: document.getElementById('btn-toggle-cam'),
      btnToggleDebug: document.getElementById('btn-toggle-debug'),
      btnToggleMute: document.getElementById('btn-toggle-mute'),
      btnSkipLevel: document.getElementById('btn-skip-level'),
      statMisses: document.getElementById('stat-total-misses'),
      statTime: document.getElementById('stat-time-taken')
    };

    this.bindEvents();
    this.initVision();
  }

  loadSceneImages() {
    const scenes = ['living_room', 'kitchen', 'garage'];
    scenes.forEach(s => {
      const img = new Image();
      img.src = `assets/scenes/${s}.png`;
      this.sceneImages[s] = img;
    });
  }

  bindEvents() {
    // Canvas Mouse listeners for mouse fallback
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = (e.clientX - rect.left) / rect.width;
      this.mousePos.y = (e.clientY - rect.top) / rect.height;
      this.usingMouse = true;
    });

    this.canvas.addEventListener('mousedown', () => {
      window.soundSynth.ensureContext();
      if (this.state === "PLAYING") {
        this.handleGrabAttempt();
      }
    });

    // Button controls
    this.dom.btnStart.addEventListener('click', () => this.startGame());
    this.dom.btnReplay.addEventListener('click', () => this.restartGame());

    this.dom.btnToggleCam.addEventListener('click', () => {
      this.showCamera = !this.showCamera;
      this.dom.camPreview.classList.toggle('hidden', !this.showCamera);
      this.dom.btnToggleCam.innerText = this.showCamera ? "HIDE CAM" : "SHOW CAM";
    });

    this.dom.btnToggleDebug.addEventListener('click', () => {
      this.showDebug = !this.showDebug;
      this.dom.btnToggleDebug.innerText = this.showDebug ? "HIDE DEBUG" : "SHOW DEBUG";
    });

    this.dom.btnToggleMute.addEventListener('click', () => {
      this.isMuted = !this.isMuted;
      window.soundSynth.setMuted(this.isMuted);
      this.dom.btnToggleMute.innerText = this.isMuted ? "UNMUTE" : "MUTE";
    });

    this.dom.btnSkipLevel.addEventListener('click', () => {
      this.skipLevel();
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 's' || e.key === 'S') this.skipLevel();
      if (e.key === 'm' || e.key === 'M') this.dom.btnToggleMute.click();
      if (e.key === 'c' || e.key === 'C') this.dom.btnToggleCam.click();
      if (e.key === 'd' || e.key === 'D') this.dom.btnToggleDebug.click();
    });
  }

  async initVision() {
    if (window.handTracker) {
      await window.handTracker.initialize(
        this.dom.webcamVideo,
        this.dom.skeletonCanvas,
        (statusMsg) => {
          this.dom.camStatusLabel.innerText = statusMsg;
          if (this.dom.modalStatusText) {
            this.dom.modalStatusText.innerText = statusMsg;
          }
        }
      );
    }
  }

  startGame() {
    window.soundSynth.ensureContext();
    this.state = "PLAYING";
    this.currentLevelIndex = 0;
    this.missCount = 0;
    this.startTime = Date.now();
    this.dom.startModal.style.display = 'none';
    this.dom.endingModal.classList.remove('ending-active');
    
    this.loadLevel(this.currentLevelIndex);
    this.gameLoop();
  }

  restartGame() {
    this.startGame();
  }

  skipLevel() {
    if (this.state !== "PLAYING" && this.state !== "LEVEL_CLEAR") return;
    window.soundSynth.playLevelUp();
    if (this.currentLevelIndex < GAME_LEVELS.length - 1) {
      this.currentLevelIndex++;
      this.loadLevel(this.currentLevelIndex);
    } else {
      this.showVictoryScreen();
    }
  }

  loadLevel(levelIndex) {
    const config = GAME_LEVELS[levelIndex];
    this.remainingSeconds = config.timerSeconds;
    this.levelStartTime = Date.now();
    
    // Update HUD
    this.dom.levelNum.innerText = config.level;
    this.dom.levelName.innerText = config.name;
    this.dom.targetName.innerText = config.targetItem;
    this.dom.missCount.innerText = this.missCount;

    // Update Stage transform for cruelty screen flip
    if (config.modifiers.screenFlipped) {
      this.canvas.classList.add('screen-flipped');
    } else {
      this.canvas.classList.remove('screen-flipped');
    }

    // Update hand tracking pinch threshold
    if (window.handTracker) {
      window.handTracker.updatePinchThreshold(config.pinchThreshold);
    }

    // Spawn items
    this.spawnItems(config);
    this.state = "PLAYING";
  }

  spawnItems(config) {
    this.items = [];
    const w = this.canvas.width;
    const h = this.canvas.height;
    const padding = 100;

    // 1. Create Target Item ("The Sadhanam")
    const targetX = padding + Math.random() * (w - padding * 2);
    const targetY = padding + 60 + Math.random() * (h - padding * 2 - 60);
    
    this.targetItem = {
      id: 'target',
      name: config.targetItem,
      shape: config.targetShape,
      isTarget: true,
      x: targetX,
      y: targetY,
      baseX: targetX,
      baseY: targetY,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      phase: Math.random() * Math.PI * 2,
      radius: 28,
      alpha: config.modifiers.semiTransparent ? 0.45 : 1.0,
      teleportCooldown: 0
    };

    // 2. Create Decoy Items
    const availableDecoys = ITEM_TYPES.filter(it => !it.target);
    const decoyCount = config.decoyCount;

    for (let i = 0; i < decoyCount; i++) {
      let decoyTemplate;
      
      // Level 5 & 9 Mimic Decoys (look identical/similar to target shape)
      if (config.modifiers.hasMimic && i < Math.min(6, decoyCount / 2)) {
        decoyTemplate = {
          name: 'Fake ' + config.targetItem,
          shape: config.targetShape,
          color: '#f59e0b'
        };
      } else {
        decoyTemplate = availableDecoys[i % availableDecoys.length];
      }

      const dx = padding + Math.random() * (w - padding * 2);
      const dy = padding + 60 + Math.random() * (h - padding * 2 - 60);

      this.items.push({
        id: `decoy_${i}`,
        name: decoyTemplate.name,
        shape: decoyTemplate.shape || 'duck',
        isTarget: false,
        x: dx,
        y: dy,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        phase: Math.random() * Math.PI * 2,
        radius: 26,
        alpha: 1.0,
        color: config.modifiers.heavyCamouflage ? '#4b5563' : (decoyTemplate.color || '#94a3b8')
      });
    }

    // Insert target into item list (hidden behind clutter on Level 3+)
    if (config.modifiers.hiddenBehindClutter) {
      // Place target behind middle layer
      const insertIdx = Math.floor(this.items.length / 2);
      this.items.splice(insertIdx, 0, this.targetItem);
    } else {
      // Place target near top layer
      this.items.push(this.targetItem);
    }
  }

  gameLoop() {
    if (this.state !== "PLAYING" && this.state !== "LEVEL_CLEAR") return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    const now = Date.now();
    const config = GAME_LEVELS[this.currentLevelIndex];

    // 1. Process Vision & Gestures
    let isPinchingNow = false;
    let currentGestureName = "MOUSE";

    if (window.handTracker && window.handTracker.isTracking) {
      const frameData = window.handTracker.processFrame(now);
      if (frameData && frameData.gesture !== "NONE") {
        this.usingMouse = false;
        this.cursorPos = { ...frameData.cursor };
        isPinchingNow = frameData.isPinching;
        currentGestureName = frameData.gesture;

        // Auto-start game if player opens hand on Start screen
        if (this.state === "START" && currentGestureName === "OPEN_HAND") {
          this.startGame();
        }
      }
    }

    if (this.usingMouse) {
      this.cursorPos = { ...this.mousePos };
    }

    // Handle Inverted Controls Modifier (Level 6+)
    let effectiveCursorX = this.cursorPos.x;
    let effectiveCursorY = this.cursorPos.y;
    if (config.modifiers.controlsInverted) {
      effectiveCursorX = 1.0 - effectiveCursorX;
      effectiveCursorY = 1.0 - effectiveCursorY;
    }

    const cursorPxX = effectiveCursorX * this.canvas.width;
    const cursorPxY = effectiveCursorY * this.canvas.height;

    // 2. Gesture Hysteresis (Pinch trigger on edge down)
    if (isPinchingNow && !this.wasPinching) {
      this.handleGrabAttempt();
    }
    this.wasPinching = isPinchingNow;

    // Update HUD gesture badge
    this.updateGestureBadge(currentGestureName, isPinchingNow);

    // 3. Update Timer Bar
    const elapsedSec = (now - this.levelStartTime) / 1000;
    this.remainingSeconds = Math.max(0, config.timerSeconds - elapsedSec);
    const pct = (this.remainingSeconds / config.timerSeconds) * 100;
    this.dom.timerBar.style.width = `${pct}%`;
    this.dom.timerBar.classList.toggle('timer-low', pct < 25);

    // Timeout Check
    if (this.remainingSeconds <= 0 && this.state === "PLAYING") {
      this.handleTimeout();
      return;
    }

    // 4. Update Item Positions & Cruelty Modifiers
    this.items.forEach(item => {
      // Drifting Target (Level 2+)
      if (config.modifiers.driftingTarget) {
        item.phase += 0.03;
        item.x += Math.cos(item.phase) * 1.5;
        item.y += Math.sin(item.phase * 0.7) * 1.2;
      }

      // Boundaries wrap/bounce
      if (item.x < 60) item.x = 60;
      if (item.x > this.canvas.width - 60) item.x = this.canvas.width - 60;
      if (item.y < 90) item.y = 90;
      if (item.y > this.canvas.height - 60) item.y = this.canvas.height - 60;
    });

    // Cruelty Modifier: Cursor Evasion (Level 5+)
    if (config.modifiers.cursorEvasion && this.targetItem) {
      const dist = Math.hypot(cursorPxX - this.targetItem.x, cursorPxY - this.targetItem.y);
      if (dist < 120) {
        const angle = Math.atan2(this.targetItem.y - cursorPxY, this.targetItem.x - cursorPxX);
        this.targetItem.x += Math.cos(angle) * 3.5;
        this.targetItem.y += Math.sin(angle) * 3.5;
      }
    }

    // Cruelty Modifier: Quantum Teleport (Level 8+)
    if (config.modifiers.targetTeleports && this.targetItem) {
      const dist = Math.hypot(cursorPxX - this.targetItem.x, cursorPxY - this.targetItem.y);
      if (dist < 90 && (!this.targetItem.teleportCooldown || now - this.targetItem.teleportCooldown > 400)) {
        window.soundSynth.playTeleport();
        this.targetItem.x = 100 + Math.random() * (this.canvas.width - 200);
        this.targetItem.y = 120 + Math.random() * (this.canvas.height - 240);
        this.targetItem.teleportCooldown = now;
      }
    }

    // Store current calculated cursor pixel coords
    this.currentCursorPx = { x: cursorPxX, y: cursorPxY };
  }

  updateGestureBadge(gesture, isPinching) {
    const badge = this.dom.gestureBadge;
    badge.className = 'hud-badge';

    if (isPinching) {
      badge.innerText = 'GESTURE: PINCH (GRAB)';
      badge.classList.add('gesture-pinch');
    } else if (gesture === 'OPEN_HAND') {
      badge.innerText = 'GESTURE: OPEN HAND';
      badge.classList.add('gesture-open');
    } else if (gesture === 'POINT') {
      badge.innerText = 'GESTURE: POINT (AIM)';
      badge.classList.add('gesture-point');
    } else {
      badge.innerText = 'GESTURE: MOUSE';
    }
  }

  handleGrabAttempt() {
    if (this.state !== "PLAYING" || !this.currentCursorPx) return;

    const config = GAME_LEVELS[this.currentLevelIndex];
    const { x: cx, y: cy } = this.currentCursorPx;

    // Hit test against Target Item
    const distToTarget = Math.hypot(cx - this.targetItem.x, cy - this.targetItem.y);

    if (distToTarget <= config.grabRadius) {
      // SUCCESS! Real Sadhanam Grabbed!
      this.handleSuccess();
    } else {
      // WRONG GRAB!
      this.handleWrongGrab(config);
    }
  }

  handleSuccess() {
    this.state = "LEVEL_CLEAR";
    window.soundSynth.playChime();
    window.soundSynth.playLevelUp();

    // Brief level-up animation before next level
    setTimeout(() => {
      if (this.currentLevelIndex < GAME_LEVELS.length - 1) {
        this.currentLevelIndex++;
        this.loadLevel(this.currentLevelIndex);
      } else {
        this.showVictoryScreen();
      }
    }, 1200);
  }

  handleWrongGrab(config) {
    this.missCount++;
    this.dom.missCount.innerText = this.missCount;

    // Level 10 Cruelty: False chime deception!
    if (config.modifiers.falseChimesOnWrongGrabs) {
      window.soundSynth.playFalseChime();
      setTimeout(() => window.soundSynth.playBuzzer(), 180);
    } else {
    window.soundSynth.playFaah();
  }

    // Visual Punishment: Screen Shake & Red Flash
    const wrapper = document.getElementById('stage-wrapper');
    wrapper.classList.remove('shake-effect');
    void wrapper.offsetWidth; // Trigger reflow
    wrapper.classList.add('shake-effect');

    this.dom.flashOverlay.classList.add('flash-active');
    setTimeout(() => this.dom.flashOverlay.classList.remove('flash-active'), 150);

    // Show Deadpan Taunt Banner
    const tauntMsg = WRONG_GRAB_TAUNTS[Math.floor(Math.random() * WRONG_GRAB_TAUNTS.length)];
    this.showTaunt(tauntMsg);
  }

  handleTimeout() {
    this.missCount++;
    this.dom.missCount.innerText = this.missCount;
    window.soundSynth.playBuzzer();

    const tauntMsg = TIMEOUT_TAUNTS[Math.floor(Math.random() * TIMEOUT_TAUNTS.length)];
    this.showTaunt(tauntMsg);

    // Reset level timer
    this.loadLevel(this.currentLevelIndex);
  }

  showTaunt(msg) {
    this.dom.tauntText.innerText = msg;
    this.dom.tauntOverlay.classList.add('taunt-show');

    if (this.tauntTimeout) clearTimeout(this.tauntTimeout);
    this.tauntTimeout = setTimeout(() => {
      this.dom.tauntOverlay.classList.remove('taunt-show');
    }, 1800);
  }

  showVictoryScreen() {
    this.state = "VICTORY";
    window.soundSynth.playEnding();

    const totalTimeSec = Math.round((Date.now() - this.startTime) / 1000);
    this.dom.statMisses.innerText = this.missCount;
    this.dom.statTime.innerText = `${totalTimeSec}s`;
    this.dom.endingModal.classList.add('ending-active');
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const config = GAME_LEVELS[this.currentLevelIndex];

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Photographic Scene Backdrop
    const activeSceneKey = config.scene.split('/').pop().replace('.png', '');
    const sceneImg = this.sceneImages[activeSceneKey];

    if (sceneImg && sceneImg.complete && sceneImg.naturalWidth !== 0) {
      ctx.drawImage(sceneImg, 0, 0, w, h);
      // Dark vignette overlay for cinematic dark aesthetic
      ctx.fillStyle = 'rgba(11, 10, 9, 0.4)';
      ctx.fillRect(0, 0, w, h);
    } else {
      // Fallback dark gradient
      const grad = ctx.createRadialGradient(w/2, h/2, 100, w/2, h/2, w/2);
      grad.addColorStop(0, '#1f1d1a');
      grad.addColorStop(1, '#0b0a09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Render Items
    this.items.forEach(item => {
      ctx.save();
      ctx.globalAlpha = item.alpha || 1.0;
      ctx.translate(item.x, item.y);

      this.drawItemShape(ctx, item);

      ctx.restore();
    });

    // 3. Debug Overlay (Togglable)
    if (this.showDebug && this.targetItem) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.targetItem.x, this.targetItem.y, config.grabRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = '12px Courier New';
      ctx.fillText(`TARGET GRAB RADIUS (${config.grabRadius}px)`, this.targetItem.x - 60, this.targetItem.y - 35);
      ctx.restore();
    }

    // 4. Render Fingertip Cursor
    if (this.currentCursorPx) {
      const { x: cx, y: cy } = this.currentCursorPx;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, this.wasPinching ? 8 : 12, 0, Math.PI * 2);
      ctx.fillStyle = this.wasPinching ? '#ef4444' : 'rgba(245, 158, 11, 0.85)';
      ctx.shadowColor = this.wasPinching ? '#ef4444' : '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Outer cursor ring
      ctx.beginPath();
      ctx.arc(cx, cy, config.grabRadius, 0, Math.PI * 2);
      ctx.strokeStyle = this.wasPinching ? '#ef4444' : 'rgba(242, 236, 225, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();

      ctx.restore();
    }
  }

  drawItemShape(ctx, item) {
    const r = item.radius || 26;
    const color = item.color || '#94a3b8';

    switch (item.shape) {
      case 'key':
        // Golden Key ("Sadhanam")
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-10, -8, 9, 0, Math.PI * 2);
        ctx.fillRect(-5, -11, 24, 6);
        ctx.fillRect(8, -5, 4, 7);
        ctx.fillRect(15, -5, 4, 7);
        ctx.fill();
        // Inner keyhole circle cutout
        ctx.fillStyle = '#0b0a09';
        ctx.beginPath();
        ctx.arc(-10, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case 'usb':
        // Secret USB Drive
        ctx.fillStyle = color;
        ctx.fillRect(-14, -10, 20, 20);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(6, -7, 10, 14);
        ctx.fillStyle = '#0b0a09';
        ctx.fillRect(10, -4, 3, 3);
        ctx.fillRect(10, 1, 3, 3);
        // Status LED
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-10, -3, 4, 6);
        break;

      case 'teapot':
        // Brass Teapot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 3, 15, 0, Math.PI);
        ctx.fillRect(-13, -6, 26, 9);
        ctx.fill();
        // Spout
        ctx.beginPath();
        ctx.moveTo(12, -2);
        ctx.quadraticCurveTo(20, -10, 22, -12);
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.stroke();
        // Handle
        ctx.beginPath();
        ctx.arc(-14, 0, 7, Math.PI * 0.5, Math.PI * 1.5);
        ctx.lineWidth = 3;
        ctx.stroke();
        // Lid Knob
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -9, 3.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'orb':
        // Glowing Orb
        const orbGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
        orbGrad.addColorStop(0, '#ffffff');
        orbGrad.addColorStop(0.4, color);
        orbGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ring':
        // Diamond Ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 4, 11, 0, Math.PI * 2);
        ctx.stroke();
        // Gemstone Facets
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(6, -7);
        ctx.lineTo(0, 0);
        ctx.lineTo(-6, -7);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case 'watch':
        // Pocket Watch
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 2, 15, 0, Math.PI * 2);
        ctx.fill();
        // Dial Face
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 2, 11, 0, Math.PI * 2);
        ctx.fill();
        // Clock Hands
        ctx.strokeStyle = '#0b0a09';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, -5);
        ctx.moveTo(0, 2);
        ctx.lineTo(5, 2);
        ctx.stroke();
        // Top Winding Crown
        ctx.fillStyle = color;
        ctx.fillRect(-3, -16, 6, 4);
        break;

      case 'banana':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0.2 * Math.PI, 1.1 * Math.PI);
        ctx.quadraticCurveTo(-2, -6, 12, 10);
        ctx.fill();
        break;

      case 'duck':
        ctx.fillStyle = color;
        // Body
        ctx.beginPath();
        ctx.arc(-2, 4, 12, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(7, -6, 8, 0, Math.PI * 2);
        ctx.fill();
        // Beak
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(14, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'shoe':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-14, -2, 28, 12, 4);
        ctx.fill();
        ctx.fillRect(-14, -10, 14, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-14, 7, 28, 3); // Sole
        break;

      case 'glasses':
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-8, 0, 7, 0, Math.PI * 2);
        ctx.arc(8, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-1, 0);
        ctx.lineTo(1, 0);
        ctx.stroke();
        break;

      case 'battery':
        ctx.fillStyle = color;
        ctx.fillRect(-8, -12, 16, 24);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-4, -15, 8, 3);
        ctx.fillStyle = '#0b0a09';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('AA', -5, 4);
        break;

      case 'paper':
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.lineTo(6, -12);
        ctx.lineTo(12, -6);
        ctx.lineTo(12, 12);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        break;

      case 'remote':
        ctx.fillStyle = '#1e293b';
        ctx.roundRect(-8, -14, 16, 28, 3);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-5, -11, 4, 4); // Power button
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(1, -11, 4, 4);
        ctx.fillRect(-5, -4, 10, 12); // Button grid
        break;

      case 'mug':
        ctx.fillStyle = color;
        ctx.fillRect(-9, -8, 18, 18);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(9, 1, 6, -Math.PI/2, Math.PI/2);
        ctx.stroke();
        break;

      case 'apple':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(-4, 0, 9, 0, Math.PI * 2);
        ctx.arc(4, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d'; // Leaf
        ctx.fillRect(0, -12, 4, 4);
        break;

      case 'scissors':
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
        ctx.moveTo(10, -10); ctx.lineTo(-10, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-11, -11, 4, 0, Math.PI * 2);
        ctx.arc(11, -11, 4, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'spoon':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, -8, 6, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-2, -1, 4, 16);
        break;

      case 'cactus':
        ctx.fillStyle = '#78350f'; // Pot
        ctx.fillRect(-8, 4, 16, 10);
        ctx.fillStyle = color; // Plant
        ctx.fillRect(-5, -12, 10, 16);
        ctx.fillRect(-10, -6, 6, 5);
        ctx.fillRect(4, -9, 6, 5);
        break;

      case 'car':
        ctx.fillStyle = color;
        ctx.fillRect(-14, -2, 28, 10);
        ctx.fillRect(-8, -8, 16, 6);
        ctx.fillStyle = '#0b0a09'; // Wheels
        ctx.beginPath();
        ctx.arc(-8, 8, 4, 0, Math.PI * 2);
        ctx.arc(8, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'sock':
        ctx.fillStyle = color;
        ctx.fillRect(-6, -12, 12, 14);
        ctx.fillRect(-6, 0, 18, 8);
        break;

      case 'onion':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 3, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-2, -12, 4, 8);
        break;

      case 'toast':
        ctx.fillStyle = color;
        ctx.roundRect(-11, -10, 22, 22, 4);
        ctx.fill();
        ctx.fillStyle = '#d97706'; // Crust
        ctx.strokeRect(-11, -10, 22, 22);
        break;

      case 'paperclip':
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -7, 5, Math.PI, 0);
        ctx.lineTo(5, 7);
        ctx.arc(1, 7, 4, 0, Math.PI);
        ctx.lineTo(-3, -3);
        ctx.stroke();
        break;

      case 'comb':
        ctx.fillStyle = color;
        ctx.fillRect(-14, -8, 28, 6);
        for (let x = -13; x <= 13; x += 3) {
          ctx.fillRect(x, -2, 1.5, 12);
        }
        break;

      case 'feather':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 14, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'donut':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0a09';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'floppy':
        ctx.fillStyle = color;
        ctx.fillRect(-13, -13, 26, 26);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-8, -13, 16, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-9, 1, 18, 11);
        break;

      case 'dice':
        ctx.fillStyle = '#f8fafc';
        ctx.roundRect(-12, -12, 24, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#0b0a09';
        ctx.beginPath();
        ctx.arc(-5, -5, 2.5, 0, Math.PI * 2);
        ctx.arc(5, 5, 2.5, 0, Math.PI * 2);
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        // Generic fallback shape
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0a09';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name ? item.name.substring(0, 3).toUpperCase() : '?', 0, 0);
        break;
    }
  }
}

// Initialize game on window load
window.addEventListener('load', () => {
  window.sadhanamGame = new SadhanamGame();
});
