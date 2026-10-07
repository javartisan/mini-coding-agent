const LINES = [
  { text: "不想上班.jpg", color: "#ffc400" },
  { text: "我其实很慌", color: "#ff69b4" },
  { text: "假装在听…", color: "#40c4ff" },
  { text: "今天吃啥？", color: "#ff8c3c" },
  { text: "别看我别看我", color: "#ff5078" },
  { text: "社死倒计时 3…", color: "#ff4646" },
  { text: "OK OK 懂了（没懂）", color: "#50dc78" },
  { text: "电量不足请充电", color: "#788cff" },
  { text: "我是不是很好看", color: "#ffb428" },
  { text: "嘴在说话 脑在放假", color: "#50b4ff" },
  { text: "CPU 已烧焦", color: "#dc50ff" },
  { text: "摸鱼被抓模拟中…", color: "#28dc8c" },
];

const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");
const stage = document.getElementById("stage");
const placeholder = document.getElementById("placeholder");
const badge = document.getElementById("badge");
const thought = document.getElementById("thought");
const sweat = document.getElementById("sweat");
const banner = document.getElementById("banner");
const danmakuLayer = document.getElementById("danmakuLayer");
const mouthBar = document.getElementById("mouthBar");
const modeLabel = document.getElementById("modeLabel");

const state = {
  mode: "idle",
  mouth: 0,
  openSince: 0,
  lastSpawn: 0,
  faceLandmarker: null,
  running: false,
  manual: null,
};

function setMode(mode) {
  if (state.mode === mode && mode !== "leak") return;
  state.mode = mode;

  stage.classList.toggle("sos", mode === "sos");
  banner.classList.toggle("show", mode === "sos");
  thought.classList.toggle("hide", mode !== "idle");
  sweat.classList.toggle("hide", mode === "idle");

  badge.classList.remove("leak", "sos", "cute");
  if (mode === "idle") {
    badge.textContent = "表面淡定 · 内心平静";
    modeLabel.textContent = "IDLE · 表面淡定";
  } else if (mode === "leak") {
    badge.textContent = "⚠ 内心戏泄漏中";
    badge.classList.add("leak");
    modeLabel.textContent = "LEAK · 弹幕外泄";
  } else if (mode === "sos") {
    badge.textContent = "🚨 社死模式 ON";
    badge.classList.add("sos");
    modeLabel.textContent = "SOS · 全面社死";
  } else if (mode === "cute") {
    badge.textContent = "装可爱加载中…";
    badge.classList.add("cute");
    modeLabel.textContent = "CUTE · 强颜欢笑";
  }
}

function spawnDanmaku(count = 1, forceSos = false) {
  const now = performance.now();
  if (!forceSos && now - state.lastSpawn < 280) return;
  state.lastSpawn = now;

  for (let i = 0; i < count; i++) {
    const item = LINES[Math.floor(Math.random() * LINES.length)];
    const el = document.createElement("div");
    el.className = "dm";
    el.textContent = item.text;
    el.style.borderColor = item.color;
    el.style.boxShadow = `0 0 0 1px ${item.color}55, 0 8px 24px rgba(0,0,0,0.25)`;

    const fromLeft = Math.random() > 0.5;
    const top = 18 + Math.random() * 62;
    const duration = 2.8 + Math.random() * 2.2;
    el.style.top = `${top}%`;
    el.style.setProperty("--from-x", fromLeft ? "-120%" : "120%");
    el.style.setProperty("--to-x", fromLeft ? "120%" : "-120%");
    el.style.animationDuration = `${duration}s`;
    danmakuLayer.appendChild(el);
    window.setTimeout(() => el.remove(), duration * 1000 + 40);
  }
}

function updateFromMouth(mouth) {
  state.mouth = mouth;
  mouthBar.style.width = `${Math.min(100, mouth * 100)}%`;

  if (state.manual) return;

  const now = performance.now();
  if (mouth > 0.42) {
    if (!state.openSince) state.openSince = now;
    const held = now - state.openSince;
    if (mouth > 0.62 || held > 1200) {
      setMode("sos");
      spawnDanmaku(2, true);
    } else {
      setMode("leak");
      spawnDanmaku(1);
    }
  } else if (mouth > 0.22) {
    state.openSince = state.openSince || now;
    setMode("leak");
    spawnDanmaku(1);
  } else {
    state.openSince = 0;
    setMode("idle");
  }
}

function mouthOpenScore(landmarks) {
  // Face Landmarker indices: upper inner lip 13, lower inner lip 14
  const upper = landmarks[13];
  const lower = landmarks[14];
  const left = landmarks[234] || landmarks[127];
  const right = landmarks[454] || landmarks[356];
  if (!upper || !lower || !left || !right) return 0;

  const faceH = Math.hypot(left.x - right.x, left.y - right.y) || 1;
  const gap = Math.abs(lower.y - upper.y);
  return Math.max(0, Math.min(1.2, (gap / faceH) * 3.2));
}

async function initCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
  });
  video.srcObject = stream;
  await video.play();
  placeholder.classList.add("hide");
  resizeCanvas();
}

function resizeCanvas() {
  overlay.width = video.videoWidth || stage.clientWidth;
  overlay.height = video.videoHeight || stage.clientHeight;
}

async function initLandmarker() {
  const { FaceLandmarker, FilesetResolver } = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm"
  );
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  state.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });
}

function drawFaceHint(landmarks) {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  if (!landmarks) return;
  const lipIdx = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
  ctx.strokeStyle = state.mode === "sos" ? "rgba(255,80,100,0.9)" : "rgba(255,200,120,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < lipIdx.length; i++) {
    const p = landmarks[lipIdx[i]];
    if (!p) continue;
    const x = p.x * overlay.width;
    const y = p.y * overlay.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function loop() {
  if (!state.running) return;
  const landmarker = state.faceLandmarker;
  if (landmarker && video.readyState >= 2) {
    const result = landmarker.detectForVideo(video, performance.now());
    const face = result.faceLandmarks?.[0];
    if (face) {
      const score = mouthOpenScore(face);
      updateFromMouth(score);
      drawFaceHint(face);
    } else {
      updateFromMouth(0);
      ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
  }
  requestAnimationFrame(loop);
}

async function startCameraFlow() {
  const btn = document.getElementById("btnCam");
  btn.disabled = true;
  btn.textContent = "加载模型中…";
  try {
    await initCamera();
    await initLandmarker();
    state.running = true;
    state.manual = null;
    btn.textContent = "摄像头已开启";
    loop();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "开启失败，可点模拟";
    modeLabel.textContent = "摄像头不可用 · 请用模拟按钮";
  }
}

function bindManual() {
  document.getElementById("btnCam").addEventListener("click", startCameraFlow);

  document.getElementById("btnMouth").addEventListener("click", () => {
    state.manual = "leak";
    placeholder.classList.add("hide");
    setMode("leak");
    mouthBar.style.width = "45%";
    spawnDanmaku(4, true);
  });

  document.getElementById("btnSos").addEventListener("click", () => {
    state.manual = "sos";
    placeholder.classList.add("hide");
    setMode("sos");
    mouthBar.style.width = "92%";
    spawnDanmaku(8, true);
  });

  document.getElementById("btnReset").addEventListener("click", () => {
    state.manual = state.running ? null : "idle";
    setMode("idle");
    mouthBar.style.width = "0%";
    danmakuLayer.innerHTML = "";
    if (!state.running) placeholder.classList.remove("hide");
  });
}

setMode("idle");
sweat.classList.add("hide");
bindManual();
window.addEventListener("resize", resizeCanvas);
