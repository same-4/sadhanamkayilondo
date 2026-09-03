/**
 * Sadhanam Kayyilundo? - MediaPipe Hand Landmarker & Gesture Detection
 * Uses @mediapipe/tasks-vision@0.10.14 via CDN with WASM + GPU delegate.
 */

class HandTracker {
  constructor() {
    this.handLandmarker = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    this.isTracking = false;
    this.statusText = "Initializing vision...";
    this.lastVideoTime = -1;

    // Smooth cursor state
    this.smoothedCursor = { x: 0.5, y: 0.5 };
    this.lerpFactor = 0.45; // ~0.45 lerp as requested

    // Current classification state
    this.currentGesture = "NONE"; // "NONE", "OPEN_HAND", "POINT", "PINCH"
    this.isPinching = false;
    this.pinchDistance = 1.0;
    this.currentPinchThreshold = 0.075;

    this.onGestureCallbacks = [];
  }

  async initialize(videoEl, canvasEl, onStatusChange) {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
    this.canvasCtx = canvasEl ? canvasEl.getContext('2d') : null;

    const updateStatus = (msg) => {
      this.statusText = msg;
      if (onStatusChange) onStatusChange(msg);
    };

    updateStatus("Loading MediaPipe vision tasks from CDN...");

    try {
      // Import Vision tasks dynamically from CDN
      const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm");
      const { HandLandmarker, FilesetResolver } = vision;

      updateStatus("Downloading WASM binaries...");
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      updateStatus("Initializing Hand Landmarker...");
      this.handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1,
        // Low tracking confidences for bad hackathon lighting resilience (0.4)
        minHandDetectionConfidence: 0.4,
        minHandPresenceConfidence: 0.4,
        minTrackingConfidence: 0.4
      });

      updateStatus("MediaPipe ready. Requesting camera access...");
      await this.startCamera();
      updateStatus("Camera tracking active!");
      this.isTracking = true;
    } catch (err) {
      console.warn("MediaPipe GPU initialization failed or camera denied:", err);
      updateStatus("Camera unavailable - Mouse fallback active! Click/drag to play.");
    }
  }

  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Webcam access not supported in browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      }
    });

    this.videoElement.srcObject = stream;
    await new Promise((resolve) => {
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        resolve();
      };
    });

    if (this.canvasElement) {
      this.canvasElement.width = this.videoElement.videoWidth || 320;
      this.canvasElement.height = this.videoElement.videoHeight || 240;
    }
  }

  updatePinchThreshold(threshold) {
    this.currentPinchThreshold = threshold;
  }

  processFrame(nowTimestamp) {
    if (!this.handLandmarker || !this.videoElement || this.videoElement.paused || this.videoElement.ended) {
      return null;
    }

    if (this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      const results = this.handLandmarker.detectForVideo(this.videoElement, nowTimestamp);
      this.handleResults(results);
    }

    return {
      gesture: this.currentGesture,
      cursor: this.smoothedCursor,
      isPinching: this.isPinching,
      pinchDistance: this.pinchDistance
    };
  }

  handleResults(results) {
    if (this.canvasCtx && this.canvasElement) {
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    if (!results || !results.landmarks || results.landmarks.length === 0) {
      this.currentGesture = "NONE";
      this.isPinching = false;
      return;
    }

    const landmarks = results.landmarks[0];
    this.drawSkeleton(landmarks);

    // Key landmarks:
    // 0: Wrist, 4: Thumb Tip, 8: Index Tip, 12: Middle Tip, 16: Ring Tip, 20: Pinky Tip, 9: Middle MCP
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleMcp = landmarks[9];

    // 1. Calculate mirrored, edge-expanded cursor coordinate from Index Tip (landmark 8)
    // Mirrored X because webcam preview is mirrored
    const rawX = 1 - indexTip.x;
    const rawY = indexTip.y;

    // Edge expansion: Map range [0.15, 0.85] to [0.0, 1.0] so fingertips easily hit screen edges
    const expandedX = Math.min(1.0, Math.max(0.0, (rawX - 0.15) / 0.70));
    const expandedY = Math.min(1.0, Math.max(0.0, (rawY - 0.15) / 0.70));

    // Fingertip smoothing (~0.45 lerp factor)
    this.smoothedCursor.x += (expandedX - this.smoothedCursor.x) * this.lerpFactor;
    this.smoothedCursor.y += (expandedY - this.smoothedCursor.y) * this.lerpFactor;

    // 2. Pinch Distance (2D Euclidean distance between thumb tip and index tip)
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    this.pinchDistance = Math.hypot(dx, dy);

    this.isPinching = this.pinchDistance < this.currentPinchThreshold;

    // 3. Scale-Invariant Gesture Classification
    // Scale reference: palm size (wrist to middle MCP distance)
    const palmSize = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.18;

    const indexDist = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
    const middleDist = Math.hypot(landmarks[12].x - wrist.x, landmarks[12].y - wrist.y);
    const ringDist = Math.hypot(landmarks[16].x - wrist.x, landmarks[16].y - wrist.y);
    const pinkyDist = Math.hypot(landmarks[20].x - wrist.x, landmarks[20].y - wrist.y);

    // Finger is extended if tip-to-wrist distance > 1.25 * palmSize
    const extThreshold = palmSize * 1.25;
    const openFingers = (indexDist > extThreshold ? 1 : 0) + 
                       (middleDist > extThreshold ? 1 : 0) +
                       (ringDist > extThreshold ? 1 : 0) + 
                       (pinkyDist > extThreshold ? 1 : 0);

    if (this.isPinching) {
      this.currentGesture = "PINCH";
    } else if (openFingers >= 3) {
      this.currentGesture = "OPEN_HAND";
    } else if (indexDist > extThreshold && middleDist < indexDist * 0.8) {
      this.currentGesture = "POINT";
    } else {
      this.currentGesture = "POINT"; // Default active gesture
    }
  }

  drawSkeleton(landmarks) {
    if (!this.canvasCtx || !this.canvasElement) return;

    const ctx = this.canvasCtx;
    const w = this.canvasElement.width;
    const h = this.canvasElement.height;

    // Hand connections mapping
    const connections = [
      [0,1],[1,2],[2,3],[3,4],        // Thumb
      [0,5],[5,6],[6,7],[7,8],        // Index
      [5,9],[9,10],[10,11],[11,12],   // Middle
      [9,13],[13,14],[14,15],[15,16], // Ring
      [13,17],[17,18],[18,19],[19,20],[0,17] // Pinky & Palm
    ];

    ctx.strokeStyle = this.isPinching ? '#ef4444' : '#22c55e';
    ctx.lineWidth = 2.5;

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo((1 - p1.x) * w, p1.y * h);
      ctx.lineTo((1 - p2.x) * w, p2.y * h);
      ctx.stroke();
    });

    // Draw joints
    landmarks.forEach((p, idx) => {
      const cx = (1 - p.x) * w;
      const cy = p.y * h;
      ctx.beginPath();
      ctx.arc(cx, cy, (idx === 8 || idx === 4) ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = (idx === 8 || idx === 4) ? '#f59e0b' : '#f2ece1';
      ctx.fill();
    });

    // Draw pinch line indicator between index & thumb
    const thumb = landmarks[4];
    const index = landmarks[8];
    ctx.beginPath();
    ctx.moveTo((1 - thumb.x) * w, thumb.y * h);
    ctx.lineTo((1 - index.x) * w, index.y * h);
    ctx.strokeStyle = this.isPinching ? '#dc2626' : 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = this.isPinching ? 4 : 1.5;
    ctx.stroke();
  }
}

window.handTracker = new HandTracker();
