// Optimized JavaScript - removed unused variables and functions
const flashSection = document.getElementById("flashSection")
const statusSection = document.getElementById("statusSection")
const installButton = document.getElementById("installButton")
const tabBtns = document.querySelectorAll(".tab-btn")
const tabPanes = document.querySelectorAll(".tab-pane")
const chipTabBtns = document.querySelectorAll(".chip-tab-btn")
const chipTabContents = document.querySelectorAll(".chip-tab-content")
const progressFill = document.getElementById("progressFill")
const mainGuideTabBtns = document.querySelectorAll(".main-guide-tab-btn")
const mainGuideTabContents = document.querySelectorAll(".main-guide-tab-content")
const fwCards = document.querySelectorAll(".fw-button")
const chipGrid = document.getElementById("chipGrid")
const chipSelection = document.getElementById("chipSelection")
const oledSelection = document.getElementById("oledSelection")
const oledButtons = document.querySelectorAll(".oled-button")

let selectedChip = null
let selectedFw = null
let selectedOled = null

const chipOptions = {
  mochi_nav: [
    { chip: "esp32", label: "ESP32" },
    { chip: "esp32c3", label: "ESP32-C3" },
  ],
  xiaozhi: [
    { chip: "esp32s3", label: "ESP32-S3 N16R8 or Mạch Tím (WakeUp) - Hi, Lily" },
    { chip: "esp32s3_mini", label: "ESP32-S3 Mini (WakeUp) - Hi, Lily" },
    { chip: "esp32s3_zero", label: "ESP32-S3 Zero (WakeUp) - Hi, Lily" },
  ],
}

// Map thư mục & tiền tố tên file cho từng chip Xiaozhi
const XIAOZHI_CHIP_MAP = {
  esp32s3: { dir: "esp32s3", filePrefix: "xiaozhi_esp32s3" },
  esp32s3_mini: { dir: "esp32s3mini", filePrefix: "xiaozhi_esp32s3mini" },
  esp32s3_zero: { dir: "esp32s3zero", filePrefix: "xiaozhi_esp32s3zero" }, // NEW
};


function initializeApp() {
  try {
    setupEventListeners()
    console.log("Ứng dụng đã khởi tạo thành công")
  } catch (error) {
    showError("Không thể khởi tạo ứng dụng.")
    console.error("Lỗi khởi tạo ứng dụng:", error)
  }
}


// Function to generate firmware binary file name and path
function generateFirmwarePath(fw, chip, oled = null) {
  let binaryFileName = ""
  let folderPath = ""

  if (fw === "mochi_nav") {
    // MochiNav: mochi_nav_esp32.bin, mochi_nav_esp32c3.bin
    binaryFileName = `mochi_nav_${chip}.bin`
    folderPath = `../firmware/${fw}/${chip}`
  } else if (fw === "xiaozhi") {
    const map = XIAOZHI_CHIP_MAP[chip];
    if (!map) throw new Error(`Chip chưa được hỗ trợ: ${chip}`);

    // Tên file theo chip cụ thể
    binaryFileName = `${map.filePrefix}_oled${oled}.bin`;
    // Đường dẫn có ngôn ngữ + thư mục chip riêng
    folderPath = `../firmware/${fw}/${map.dir}/oled${oled}`;
  }

  return {
    binaryFileName,
    folderPath,
    fullPath: `${folderPath}/${binaryFileName}`,
  }
}

// Function to check if firmware binary file exists
async function checkFirmwareExists(fw, chip, oled = null) {
  try {
    const { fullPath } = generateFirmwarePath(fw, chip, oled)

    console.log(`Checking firmware: ${fullPath}`)

    const response = await fetch(fullPath, { method: "HEAD" })
    const exists = response.ok

    if (exists) {
      console.log(`✅ Firmware found: ${fullPath}`)
    } else {
      console.log(`❌ Firmware not found: ${fullPath}`)
    }

    return exists
  } catch (error) {
    console.log(`❌ Error checking firmware: ${fw}/${chip}${oled ? `/oled${oled}` : ""} - ${error.message}`)
    return false
  }
}

async function updateFlashButtonVisibility() {
  const shouldShow =
    (selectedFw === "mochi_nav" && selectedChip) || (selectedFw === "xiaozhi" && selectedChip && selectedOled)

  if (!shouldShow) {
    flashSection.style.display = "none"
    return
  }

  // Show loading state while checking
  flashSection.style.display = "block"
  showFirmwareCheckingState()

  // Check if firmware binary exists
  const firmwareExists = await checkFirmwareExists(selectedFw, selectedChip, selectedOled)

  if (firmwareExists) {
    // Show connect button if firmware exists
    setupEspWebToolsWithManifest(selectedChip)
  } else {
    // Show message if firmware doesn't exist
    showFirmwareNotAvailableMessage()
  }
}

function showFirmwareCheckingState() {
  const espWebToolsContainer = document.getElementById("espWebToolsContainer")

  espWebToolsContainer.innerHTML = `
    <div class="firmware-checking">
      <div class="checking-icon">🔍</div>
      <p>Đang kiểm tra firmware...</p>
    </div>
  `
}

function showFirmwareNotAvailableMessage() {
  const espWebToolsContainer = document.getElementById("espWebToolsContainer")

  // Create firmware name for display
  const firmwareName = selectedFw === "mochi_nav" ? "MochiNav" : "Xiaozhi"
  const chipName = selectedChip.toUpperCase().replace("_", "-")
  const oledInfo = selectedOled ? ` với OLED ${selectedOled}"` : ""
  const { binaryFileName, folderPath } = generateFirmwarePath(selectedFw, selectedChip, selectedOled)

  espWebToolsContainer.innerHTML = `
    <div class="firmware-not-available">
      <div class="not-available-icon">⚠️</div>
      <h4>Firmware Chưa Sẵn Sàng</h4>
      <p>Hiện tại firmware <strong>${firmwareName}</strong> cho chip <strong>${chipName}</strong>${oledInfo} đang được phát triển.</p>
    </div>
  `
}

function setupEspWebToolsWithManifest(chipType) {
  let manifestPath = ""

  if (selectedFw === "mochi_nav") {
    manifestPath = `../firmware/${selectedFw}/${chipType}/manifest.json`
  } else if (selectedFw === "xiaozhi") {
    const map = XIAOZHI_CHIP_MAP[chipType];
    if (!map) throw new Error(`Chip chưa được hỗ trợ: ${chipType}`);

    manifestPath = `../firmware/${selectedFw}/${map.dir}/oled${selectedOled}/manifest.json`;
  }



  // Reset container content to show ESP Web Tools button
  const espWebToolsContainer = document.getElementById("espWebToolsContainer")
  espWebToolsContainer.innerHTML = `
    <esp-web-install-button class="invisible" id="installButton"></esp-web-install-button>
  `

  // Re-get the button element after innerHTML reset
  const newInstallButton = document.getElementById("installButton")
  newInstallButton.manifest = manifestPath
  newInstallButton.setAttribute("erase-first", "")
  newInstallButton.classList.remove("invisible")

  newInstallButton.innerHTML = `
    <button slot="activate" class="btn btn-primary" style="margin: 0 auto; display: block;">
      Kết nối
    </button>
  `

  // Remove existing listeners to prevent duplicates
  newInstallButton.removeEventListener("state-changed", handleFlashStateChange)
  newInstallButton.addEventListener("state-changed", handleFlashStateChange)
}

function handleFlashStateChange(event) {
  const state = event.detail.state
  const statusIcon = document.getElementById("statusIcon")
  const statusTitle = document.getElementById("statusTitle")
  const statusMessage = document.getElementById("statusMessage")

  const stateConfig = {
    preparing: {
      icon: "⏳",
      title: "Đang chuẩn bị...",
      message: "Đang chuẩn bị nạp firmware",
      progress: "10%",
    },
    erasing: {
      icon: "🔄",
      title: "Đang xóa Flash...",
      message: "Đang xóa firmware cũ",
      progress: "30%",
    },
    writing: {
      icon: "📝",
      title: "Đang ghi Firmware...",
      message: "Đang cài đặt firmware mới",
      progress: "70%",
    },
    finished: {
      icon: "✅",
      title: "Thành công!",
      message: "Firmware đã được cài đặt thành công",
      progress: "100%",
      notification: { message: "Firmware đã được cài đặt thành công!", type: "success" },
      hideAfter: 3000,
    },
    error: {
      icon: "❌",
      title: "Lỗi",
      message: "Không thể cài đặt firmware",
      progress: "0%",
      notification: { message: "Không thể cài đặt firmware", type: "error" },
      hideAfter: 5000,
    },
  }

  const config = stateConfig[state]
  if (!config) return

  if (state === "preparing") showStatusSection()

  statusIcon.textContent = config.icon
  statusTitle.textContent = config.title
  statusMessage.textContent = config.message
  progressFill.style.width = config.progress

  if (config.notification) {
    showNotification(config.notification.message, config.notification.type)
  }

  if (config.hideAfter) {
    setTimeout(hideStatusSection, config.hideAfter)
  }
}

function showStatusSection() {
  statusSection.style.display = "block"
  statusSection.classList.add("fade-in")
}

function hideStatusSection() {
  statusSection.style.display = "none"
  statusSection.classList.remove("fade-in")
}

function switchTab(tabId) {
  tabPanes.forEach((pane) => pane.classList.remove("active"))
  document.getElementById(tabId).classList.add("active")

  tabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId)
  })
}

function switchChipTab(chipTabId) {
  chipTabContents.forEach((content) => content.classList.remove("active"))
  document.getElementById(chipTabId + "-content").classList.add("active")

  chipTabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.chipTab === chipTabId)
  })
}

function switchMainTab(tabId) {
  mainGuideTabContents.forEach((content) => content.classList.remove("active"))
  document.getElementById(tabId).classList.add("active")

  mainGuideTabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mainTab === tabId)
  })
}

function resetSelections() {
  chipSelection.style.display = "block"
  chipGrid.innerHTML = ""
  oledSelection.style.display = "none"
  flashSection.style.display = "none"
  statusSection.style.display = "none"
  selectedChip = null
  selectedOled = null
}

function createChipButton(opt) {
  const btn = document.createElement("button")
  btn.className = "chip-button"
  btn.dataset.chip = opt.chip
  btn.textContent = opt.label

  btn.addEventListener("click", async () => {
    document.querySelectorAll(".chip-button").forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")
    selectedChip = opt.chip

    if (selectedFw === "xiaozhi") {
      oledSelection.style.display = "block"
      oledButtons.forEach((b) => b.classList.remove("active"))
      selectedOled = null
    } else {
      oledSelection.style.display = "none"
    }

    await updateFlashButtonVisibility()
  })

  return btn
}

function setupEventListeners() {
  // Firmware selection
  fwCards.forEach((card) => {
    card.addEventListener("click", () => {
      fwCards.forEach((btn) => btn.classList.remove("active"))
      card.classList.add("active")
      selectedFw = card.dataset.fw

      resetSelections()

      chipOptions[selectedFw].forEach((opt) => {
        chipGrid.appendChild(createChipButton(opt))
      })
    })
  })

  // OLED selection
  oledButtons.forEach((oledBtn) => {
    oledBtn.addEventListener("click", async () => {
      oledButtons.forEach((b) => b.classList.remove("active"))
      oledBtn.classList.add("active")
      selectedOled = oledBtn.dataset.oled
      await updateFlashButtonVisibility()
    })
  })

  // Tab navigation
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab))
  })

  // Chip tab navigation
  chipTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchChipTab(btn.dataset.chipTab))
  })

  // Main guide tabs
  mainGuideTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchMainTab(btn.dataset.mainTab))
  })

  // Escape key handler
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && flashSection.style.display === "block") {
      flashSection.style.display = "none"
      document
        .querySelectorAll(".chip-button, .fw-button, .oled-button")
        .forEach((card) => card.classList.remove("active"))
      selectedChip = null
      selectedFw = null
      selectedOled = null
    }
  })
}

function showError(message) {
  console.error(message)
  showNotification(message, "error")
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  const colors = {
    info: "#0ea5e9",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  }

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    color: "white",
    fontWeight: "600",
    zIndex: "1000",
    backgroundColor: colors[type] || colors.info,
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
  })

  document.body.appendChild(notification)

  setTimeout(() => (notification.style.transform = "translateX(0)"), 100)

  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Popup management
function initializePopups() {
  const fbPopup = document.getElementById("fbJoinPopup")
  const keyPopup = document.getElementById("keyWarningPopup")

  // Facebook popup
  if (fbPopup) {
    const closeBtn = fbPopup.querySelector("#closePopupBtn")
    const joinBtn = fbPopup.querySelector("#joinButton")

    fbPopup.style.display = "flex"

    closeBtn?.addEventListener("click", () => (fbPopup.style.display = "none"))
    joinBtn?.addEventListener("click", () => {
      window.open("https://www.facebook.com/share/g/1G743kz7iZ/", "_blank")
      fbPopup.style.display = "none"
    })
  }

  // Key warning popup
  if (keyPopup && !localStorage.getItem("hideKeyWarning")) {
    const closeBtn = keyPopup.querySelector("#closePopupBtn")
    const dontShowAgain = keyPopup.querySelector("#dontShowAgain")

    keyPopup.style.display = "flex"

    closeBtn?.addEventListener("click", () => {
      if (dontShowAgain?.checked) {
        localStorage.setItem("hideKeyWarning", "true")
      }
      keyPopup.style.display = "none"
    })
  }
}


const WORKER_URL = "https://license-signer.tandev.workers.dev/sign";
let port, reader, writer;
let currentMac = ""; // Lưu MAC đã đọc để dùng khi ký

// --- tiện ích UI ---
const $ = s => document.querySelector(s);
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const log = (m, cls = "") => {
  const el = $("#log");
  const t = new Date().toLocaleTimeString();
  el.innerHTML += `<div class="${cls}">[${t}] ${escapeHtml(m)}</div>`;
  el.scrollTop = el.scrollHeight;
};

// --- tiện ích UI ---
function setStatusUI(isSigned, reason = "") {
  const badge = $("#statusBadge");
  if (isSigned) {
    badge.className = "badge ok";
    badge.textContent = "ĐÃ KÝ • Full features";
  } else {
    badge.className = "badge err";
    badge.textContent = reason ? `CHƯA KÝ • ${reason}` : "CHƯA KÝ";
  }
}

// Cập nhật tiêu đề theo MAC (chỉ để MAC, không ảnh hưởng badge)
function setMacTitle(mac) {
  currentMac = (mac || "").toUpperCase();
  $("#title").textContent = currentMac ? `MAC: ${currentMac}` : "MAC: Chưa kết nối";
}


// --- hàng đợi chờ dòng phù hợp ---
const waiters = [];
function notifyLine(line) {
  let m;

  // 1) Cập nhật trạng thái ký
  if ((m = line.match(/^STATUS:\s*SIGNED\b/i))) {
    setStatusUI(true);
  } else if ((m = line.match(/^STATUS:\s*UNSIGNED(?:\s*\((.*)\))?/i))) {
    const reason = m[1] ? m[1] : "";
    setStatusUI(false, reason);
  } else if (/^SIGNED\b/i.test(line)) {
    setStatusUI(true);
  } else if ((m = line.match(/^UNSIGNED\b(?::\s*(.*))?/i))) {
    const reason = m[1] ? m[1] : "";
    setStatusUI(false, reason);
  }

  // 2) Bắt DID/MAC để hiển thị lên title
  // Hỗ trợ cả hai dạng tiền tố: "DID:" hoặc "MAC:"
  if ((m = line.match(/^(?:DID|MAC):\s*([0-9A-F]{2}(?::[0-9A-F]{2}){5})$/i))) {
    setMacTitle(m[1]);
  }

  // 3) Đánh thức các waiter
  for (let i = waiters.length - 1; i >= 0; i--) {
    const { re, resolve } = waiters[i];
    if (re.test(line)) { waiters.splice(i, 1); resolve(line); }
  }
}

function waitForLine(re, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = waiters.findIndex(w => w.resolve === resolve);
      if (idx >= 0) waiters.splice(idx, 1);
      reject(new Error("timeout waiting for line: " + re));
    }, timeoutMs);
    waiters.push({ re, resolve: (line) => { clearTimeout(timer); resolve(line); } });
  });
}

// --- read pump: đọc nền, log & phát sự kiện dòng ---
let pumpRunning = false;
async function startReadPump() {
  if (pumpRunning) return;
  pumpRunning = true;
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      buf += dec.decode(value);
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        let line = buf.slice(0, i).replace(/\r/g, "").trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        log("<< " + line);
        notifyLine(line);
      }
    }
  } catch (e) {
    // ignore
  } finally { pumpRunning = false; }
}

// --- serial open / write ---
async function openSerial() {
  if (!("serial" in navigator)) { alert("Trình duyệt không hỗ trợ Web Serial."); return; }
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  // ESP32-S3 USB-CDC thường cần DTR=true
  try { await port.setSignals?.({ dataTerminalReady: true, requestToSend: false }); } catch { }

  reader = port.readable.getReader();
  writer = port.writable.getWriter();
  startReadPump();

  log("Đã kết nối serial.");
  $("#btnGetDid").disabled = false;
  $("#btnActivate").disabled = false;
  $("#btnReboot").disabled = false;

  // Ngay khi kết nối: hỏi HELLO để lấy STATUS + DID/MAC cho UI
  await sendLine("HELLO");
  // chờ phản hồi (không chặn UI nếu timeout)
  waitForLine(/^STATUS:/i, 1500).catch(() => { });
  // Hỗ trợ cả DID:.. hoặc MAC:..
  waitForLine(/^(?:DID|MAC):\s*[0-9A-F]{2}(?::[0-9A-F]{2}){5}$/i, 1500).catch(() => { });
}

async function sendLine(line) {
  const enc = new TextEncoder();
  await writer.write(enc.encode(line + "\r\n")); // CRLF
  log(">> " + line);
}

// --- nghiệp vụ ---
async function getDid() {
  const MAX_TRY = 2;
  for (let attempt = 1; attempt <= MAX_TRY; attempt++) {
    await sendLine("GETDID");
    try {
      const line = await waitForLine(/^(?:DID|MAC):\s*[0-9A-F]{2}(?::[0-9A-F]{2}){5}$/i, 2000);
      const m = line.match(/^(?:DID|MAC):\s*([0-9A-F]{2}(?::[0-9A-F]{2}){5})$/i);
      const mac = m[1].toUpperCase();
      setMacTitle(mac);
      log("MAC: " + mac, "ok");
      return mac;
    } catch (e) {
      log(`Không thấy MAC (lần ${attempt})`, "err");
    }
  }
  throw new Error("Không nhận được MAC/DID từ ESP32");
}

function showPayload(license) {
  try {
    const payloadB64 = license.split(".")[0];
    const json = JSON.parse(atob(payloadB64));
    log("Payload: " + JSON.stringify(json, null, 2), "ok");
  } catch (e) { log("Decode payload lỗi: " + e, "err"); }
}

async function activate() {
  const activationKey = $("#inpKey").value.trim();
  if (!currentMac) { alert("Hãy bấm 'Kết nối' hoặc 'Lấy MAC' trước."); return; }
  if (!activationKey) { alert("Nhập activation key!"); return; }

  log("Gọi server ký...");
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: currentMac, activationKey })
  });
  const js = await res.json().catch(() => ({}));
  if (!res.ok) { log("Sign lỗi: " + JSON.stringify(js), "err"); return; }

  const license = js.license;
  log("Nhận license OK.");
  showPayload(license);

  await sendLine("LIC:" + license);

  // chờ [OK] hoặc [ERR:...]; đồng thời sẽ có dòng SIGNED/UNSIGNED để UI cập nhật
  try {
    const ok = await waitForLine(/^\[(OK|ERR:.*)\]$/i, 5000);
    if (/^\[OK\]$/i.test(ok)) {
      log("ESP32 xác nhận license.", "ok");
      setStatusUI(true);
    } else {
      log("ESP32 từ chối license: " + ok, "err");
    }
  } catch {
    log("Không nhận được phản hồi từ ESP32 sau khi gửi license.", "err");
  }
}

async function reboot() { await sendLine("REBOOT"); }

// --- gán sự kiện ---
$("#btnConnect").onclick = () => openSerial().catch(e => log(String(e), "err"));
$("#btnGetDid").onclick = () => getDid().catch(e => log(String(e), "err"));
$("#btnActivate").onclick = () => activate().catch(e => log(String(e), "err"));
$("#btnReboot").onclick = () => reboot().catch(e => log(String(e), "err"));

// --- đóng trang: tự giải phóng serial ---
window.addEventListener("beforeunload", async () => {
  try { await reader?.releaseLock(); await writer?.releaseLock(); await port?.close(); } catch { }
  setMacTitle(""); // về MAC: Chưa kết nối
  setStatusUI(false, "Chưa kết nối");
});


// Lấy tất cả ảnh cần bật viewer
const thumbs = document.querySelectorAll('.wiring-diagram');
const viewer = document.getElementById('imgViewer');
const stage = document.getElementById('ivStage');
const imgEl = document.getElementById('ivImg');
const btnClose = document.getElementById('ivClose');

let natW = 0, natH = 0;          // kích thước ảnh gốc
let baseScale = 1;               // scale vừa khung
let scale = 1;                   // scale hiện tại
let minScale = 0.2, maxScale = 8;

let posX = 0, posY = 0;          // vị trí pan hiện tại
let startX = 0, startY = 0;      // khi bắt đầu kéo
let startPosX = 0, startPosY = 0;
let dragging = false;

// Multi-touch / pinch
const pointers = new Map();
let pinchStartDist = 0;
let pinchStartScale = 1;
let pinchStartMid = { x: 0, y: 0 };
let lastTapTime = 0;

// Mở viewer
function openViewer(src, alt) {
  imgEl.src = src;
  imgEl.alt = alt || '';
  viewer.classList.remove('hidden');
  viewer.setAttribute('aria-hidden', 'false');

  // Chờ ảnh load để tính fit
  imgEl.onload = () => {
    natW = imgEl.naturalWidth;
    natH = imgEl.naturalHeight;
    fitToScreen();
    applyTransform(true);
  };
  disableScroll();
}

// Đóng viewer
function closeViewer() {
  viewer.classList.add('hidden');
  viewer.setAttribute('aria-hidden', 'true');
  imgEl.src = '';
  enableScroll();
  resetState();
}

function resetState() {
  scale = 1; baseScale = 1; posX = 0; posY = 0;
  pointers.clear();
  pinchStartDist = 0;
}

// Tính scale vừa khung
function fitToScreen() {
  const vw = stage.clientWidth;
  const vh = stage.clientHeight;
  baseScale = Math.min(vw / natW, vh / natH);
  scale = baseScale;
  posX = 0; posY = 0;
}

// Áp transform (translate + scale)
function applyTransform(snap = false) {
  const t = `translate(${posX}px, ${posY}px) scale(${scale})`;
  imgEl.style.transform = t;
  imgEl.style.transition = snap ? 'transform 120ms ease-out' : 'none';
}

// Giới hạn pan để không mất ảnh (đơn giản)
function clampPan() {
  const vw = stage.clientWidth, vh = stage.clientHeight;
  const w = natW * scale, h = natH * scale;
  const maxX = Math.max(0, (w - vw) / 2);
  const maxY = Math.max(0, (h - vh) / 2);
  posX = Math.min(maxX, Math.max(-maxX, posX));
  posY = Math.min(maxY, Math.max(-maxY, posY));
}

// Zoom quanh một điểm (clientX/Y)
function zoomAt(delta, cx, cy) {
  const prevScale = scale;
  const zoom = Math.exp(delta); // mượt mà
  scale = Math.min(maxScale, Math.max(minScale, scale * zoom));
  // Giữ điểm (cx,cy) cố định tương đối khi zoom
  const rect = imgEl.getBoundingClientRect();
  const imgCX = cx - rect.left;
  const imgCY = cy - rect.top;
  const nx = (imgCX - rect.width / 2);
  const ny = (imgCY - rect.height / 2);
  const k = scale / prevScale - 1;
  posX -= nx * k;
  posY -= ny * k;

  clampPan();
  applyTransform();
}

// Sự kiện click vào thumbnail
thumbs.forEach(el => {
  el.style.cursor = 'zoom-in';
  el.addEventListener('click', () => openViewer(el.src, el.alt));
});

// Đóng
btnClose.addEventListener('click', closeViewer);
viewer.addEventListener('click', (e) => {
  // click nền (không phải ảnh) thì đóng
  if (e.target === viewer || e.target === stage) closeViewer();
});

// Wheel zoom (desktop)
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = -e.deltaY * 0.0015; // âm là zoom in
  zoomAt(delta, e.clientX, e.clientY);
}, { passive: false });

// Double click / double tap: toggle fit <-> 2x
stage.addEventListener('dblclick', (e) => {
  e.preventDefault();
  if (scale <= baseScale * 1.05) {
    scale = Math.min(maxScale, baseScale * 2);
  } else {
    scale = baseScale; posX = 0; posY = 0;
  }
  clampPan();
  applyTransform(true);
});

// Single-tap double detection (mobile)
stage.addEventListener('pointerup', (e) => {
  const now = Date.now();
  if (now - lastTapTime < 300 && pointers.size === 0) {
    // xử lý như dblclick
    if (scale <= baseScale * 1.05) {
      scale = Math.min(maxScale, baseScale * 2);
    } else {
      scale = baseScale; posX = 0; posY = 0;
    }
    clampPan();
    applyTransform(true);
  }
  lastTapTime = now;
});

// Drag / Pan + Pinch bằng Pointer Events
stage.addEventListener('pointerdown', (e) => {
  stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    dragging = true;
    stage.classList.add('dragging');
    startX = e.clientX; startY = e.clientY;
    startPosX = posX; startPosY = posY;
  } else if (pointers.size === 2) {
    // bắt đầu pinch
    const [p1, p2] = [...pointers.values()];
    pinchStartDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    pinchStartScale = scale;
    pinchStartMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }
});

stage.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1 && dragging) {
    posX = startPosX + (e.clientX - startX);
    posY = startPosY + (e.clientY - startY);
    clampPan();
    applyTransform();
  } else if (pointers.size === 2) {
    const [p1, p2] = [...pointers.values()];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (pinchStartDist > 0) {
      const factor = dist / pinchStartDist;
      const targetScale = Math.min(maxScale, Math.max(minScale, pinchStartScale * factor));
      // zoom quanh midpoint ban đầu
      const rect = imgEl.getBoundingClientRect();
      const prevScale = scale;
      scale = targetScale;

      const cx = pinchStartMid.x, cy = pinchStartMid.y;
      const imgCX = cx - rect.left;
      const imgCY = cy - rect.top;
      const nx = (imgCX - rect.width / 2);
      const ny = (imgCY - rect.height / 2);
      const k = scale / prevScale - 1;
      posX -= nx * k;
      posY -= ny * k;

      // Pan theo dịch chuyển midpoint hiện tại so với ban đầu
      const curMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      posX += (curMid.x - pinchStartMid.x);
      posY += (curMid.y - pinchStartMid.y);

      clampPan();
      applyTransform();
    }
  }
});

stage.addEventListener('pointerup', (e) => {
  stage.releasePointerCapture?.(e.pointerId);
  pointers.delete(e.pointerId);
  if (pointers.size < 2) {
    pinchStartDist = 0;
  }
  if (pointers.size === 0) {
    dragging = false;
    stage.classList.remove('dragging');
  }
});

stage.addEventListener('pointercancel', (e) => {
  pointers.delete(e.pointerId);
  dragging = false;
  stage.classList.remove('dragging');
  pinchStartDist = 0;
});

// Đóng bằng ESC
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !viewer.classList.contains('hidden')) {
    closeViewer();
  }
});

// Helper: khóa cuộn nền khi mở modal
let scrollY = 0;
function disableScroll() {
  scrollY = window.scrollY || document.documentElement.scrollTop;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = '0'; document.body.style.right = '0';
  document.body.style.width = '100%';
}
function enableScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollY);
}


// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  initializePopups()
})

