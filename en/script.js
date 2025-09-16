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
    { chip: "esp32s3", label: "ESP32-S3 (WakeUp Word)" },
    { chip: "esp32s3_mini", label: "ESP32-S3 Mini (No WakeUp Word)" },
    { chip: "esp32s3_zero", label: "ESP32-S3 Zero (WakeUp Word) - Comming Soon" },
  ],
}

function initializeApp() {
  try {
    setupEventListeners()
    console.log("Ứng dụng đã khởi tạo thành công")
  } catch (error) {
    showError("Không thể khởi tạo ứng dụng.")
    console.error("Lỗi khởi tạo ứng dụng:", error)
  }
}

function getXiaozhiLang() {
  // Ưu tiên đọc từ path: /en/ hoặc /vi/ (không cần dấu / cuối)
  // Ví dụ khớp: /en, /en/, /en/something, /vi, /vi/, /vi/abc
  const path = (typeof location !== "undefined" ? location.pathname : "") || "";
  const m = path.match(/^\/(en|vi)(?:\/|$)/i);
  if (m && m[1]) return m[1].toLowerCase();

  // Cho phép override thủ công nếu cần: window.XIAOZHI_LANG = 'en' | 'vi'
  if (typeof window !== "undefined" && (window.XIAOZHI_LANG === "en" || window.XIAOZHI_LANG === "vi")) {
    return window.XIAOZHI_LANG;
  }

  // Fallback cuối: đọc từ thẻ <html lang="..."> nếu có, mặc định 'vi'
  const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  if (htmlLang === "en" || htmlLang === "vi") return htmlLang;

  return "vi";
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
    const lang = getXiaozhiLang()
    const chipDir = chip === "esp32s3_mini" ? "esp32s3mini" : chip

    // Tên file giữ nguyên quy ước cũ
    if (chip === "esp32s3_mini") {
      binaryFileName = `xiaozhi_esp32s3mini_oled${oled}.bin`
    } else {
      binaryFileName = `xiaozhi_esp32s3_oled${oled}.bin`
    }

    // ĐƯỜNG DẪN MỚI: thêm {lang}
    folderPath = `../firmware/${fw}/${lang}/${chipDir}/oled${oled}`
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
      <p>Checking firmware...</p>
    </div>
  `
}

function showFirmwareNotAvailableMessage() {
  const espWebToolsContainer = document.getElementById("espWebToolsContainer")

  // Create firmware name for display
  const firmwareName = selectedFw === "mochi_nav" ? "MochiNav" : "Xiaozhi"
  const chipName = selectedChip.toUpperCase().replace("_", "-")
  const oledInfo = selectedOled ? ` with OLED ${selectedOled}"` : ""
  const { binaryFileName, folderPath } = generateFirmwarePath(selectedFw, selectedChip, selectedOled)

  espWebToolsContainer.innerHTML = `
    <div class="firmware-not-available">
      <div class="not-available-icon">⚠️</div>
      <h4>Firmware Not Available</h4>
      <p>The firmware <strong>${firmwareName}</strong> for chip <strong>${chipName}</strong>${oledInfo} is currently under development.</p>
      <p class="coming-soon">Message us on Zalo or Facebook to get the latest program file! 🚀</p>
    </div>
  `
}

function setupEspWebToolsWithManifest(chipType) {
  let manifestPath = ""

  if (selectedFw === "mochi_nav") {
    manifestPath = `../firmware/${selectedFw}/${chipType}/manifest.json`
  } else if (selectedFw === "xiaozhi") {
    const lang = getXiaozhiLang()
    const chipDir = chipType === "esp32s3_mini" ? "esp32s3mini" : chipType
    manifestPath = `../firmware/${selectedFw}/${lang}/${chipDir}/oled${selectedOled}/manifest.json`
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
    Connect
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
      title: "Preparing...",
      message: "Preparing to flash firmware",
      progress: "10%",
    },
    erasing: {
      icon: "🔄",
      title: "Erasing Flash...",
      message: "Removing old firmware",
      progress: "30%",
    },
    writing: {
      icon: "📝",
      title: "Writing Firmware...",
      message: "Installing new firmware",
      progress: "70%",
    },
    finished: {
      icon: "✅",
      title: "Success!",
      message: "Firmware has been successfully installed",
      progress: "100%",
      notification: { message: "Firmware has been successfully installed!", type: "success" },
      hideAfter: 3000,
    },
    error: {
      icon: "❌",
      title: "Error",
      message: "Unable to install firmware",
      progress: "0%",
      notification: { message: "Unable to install firmware", type: "error" },
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
let currentMac = ""; // Store MAC to use when signing

// --- UI utilities ---
const $ = s => document.querySelector(s);
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const log = (m, cls = "") => {
  const el = $("#log");
  const t = new Date().toLocaleTimeString();
  el.innerHTML += `<div class="${cls}">[${t}] ${escapeHtml(m)}</div>`;
  el.scrollTop = el.scrollHeight;
};

// --- UI update ---
function setStatusUI(isSigned, reason = "") {
  const badge = $("#statusBadge");
  if (isSigned) {
    badge.className = "badge ok";
    badge.textContent = "SIGNED • Full features";
  } else {
    badge.className = "badge err";
    badge.textContent = reason ? `NOT SIGNED • ${reason}` : "NOT SIGNED";
  }
}

// Update header title with MAC
function setMacTitle(mac) {
  currentMac = (mac || "").toUpperCase();
  $("#title").textContent = currentMac ? `MAC: ${currentMac}` : "MAC: Not connected";
}

// --- line waiters ---
const waiters = [];
function notifyLine(line) {
  let m;

  // 1) Update license status
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

  // 2) Extract DID/MAC to show in title
  if ((m = line.match(/^(?:DID|MAC):\s*([0-9A-F]{2}(?::[0-9A-F]{2}){5})$/i))) {
    setMacTitle(m[1]);
  }

  // 3) Resolve pending waiters
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
      reject(new Error("Timeout waiting for line: " + re));
    }, timeoutMs);
    waiters.push({ re, resolve: (line) => { clearTimeout(timer); resolve(line); } });
  });
}

// --- read pump: read serial & notify lines ---
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
  if (!("serial" in navigator)) { alert("Your browser does not support Web Serial."); return; }
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  // ESP32-S3 USB-CDC usually requires DTR=true
  try { await port.setSignals?.({ dataTerminalReady: true, requestToSend: false }); } catch { }

  reader = port.readable.getReader();
  writer = port.writable.getWriter();
  startReadPump();

  log("Serial connected.");
  $("#btnGetDid").disabled = false;
  $("#btnActivate").disabled = false;
  $("#btnReboot").disabled = false;

  // On connect: request HELLO to fetch STATUS + MAC
  await sendLine("HELLO");
  waitForLine(/^STATUS:/i, 1500).catch(() => { });
  waitForLine(/^(?:DID|MAC):\s*[0-9A-F]{2}(?::[0-9A-F]{2}){5}$/i, 1500).catch(() => { });
}

async function sendLine(line) {
  const enc = new TextEncoder();
  await writer.write(enc.encode(line + "\r\n")); // CRLF
  log(">> " + line);
}

// --- business logic ---
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
      log(`MAC not found (attempt ${attempt})`, "err");
    }
  }
  throw new Error("No MAC/DID received from ESP32");
}

function showPayload(license) {
  try {
    const payloadB64 = license.split(".")[0];
    const json = JSON.parse(atob(payloadB64));
    log("Payload: " + JSON.stringify(json, null, 2), "ok");
  } catch (e) { log("Payload decode error: " + e, "err"); }
}

async function activate() {
  const activationKey = $("#inpKey").value.trim();
  if (!currentMac) { alert("Please click 'Connect' or 'Get MAC' first."); return; }
  if (!activationKey) { alert("Enter activation key!"); return; }

  log("Requesting signing server...");
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId: currentMac, activationKey })
  });
  const js = await res.json().catch(() => ({}));
  if (!res.ok) { log("Signing error: " + JSON.stringify(js), "err"); return; }

  const license = js.license;
  log("License received OK.");
  showPayload(license);

  await sendLine("LIC:" + license);

  try {
    const ok = await waitForLine(/^\[(OK|ERR:.*)\]$/i, 5000);
    if (/^\[OK\]$/i.test(ok)) {
      log("ESP32 accepted the license.", "ok");
      setStatusUI(true);
    } else {
      log("ESP32 rejected the license: " + ok, "err");
    }
  } catch {
    log("No response from ESP32 after sending license.", "err");
  }
}

async function reboot() { await sendLine("REBOOT"); }

// --- bind events ---
$("#btnConnect").onclick = () => openSerial().catch(e => log(String(e), "err"));
$("#btnGetDid").onclick = () => getDid().catch(e => log(String(e), "err"));
$("#btnActivate").onclick = () => activate().catch(e => log(String(e), "err"));
$("#btnReboot").onclick = () => reboot().catch(e => log(String(e), "err"));

// --- cleanup on page close ---
window.addEventListener("beforeunload", async () => {
  try { await reader?.releaseLock(); await writer?.releaseLock(); await port?.close(); } catch { }
  setMacTitle(""); // reset title
  setStatusUI(false, "Not connected");
});


// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  initializePopups()
})
