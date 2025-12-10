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
const oledGrid = document.getElementById("oledGrid")


let selectedChip = null
let selectedFw = null
let selectedOled = null

const chipOptions = {
  mochi_nav: [
    { chip: "esp32c3", label: "ESP32-C3", img: "/img/chips/esp32c3.png" },
  ],
  xiaozhi: [
    { chip: "esp32s3", label: "ESP32-S3 N16R8 / Mạch Tím", img: "/img/chips/esp32s3_devkit.png" },
    { chip: "esp32s3_mini", label: "ESP32-S3 Super Mini", img: "/img/chips/esp32s3_mini.png" },
    { chip: "esp32s3_zero", label: "ESP32-S3 Zero", img: "/img/chips/esp32s3_zero.png" },
    { chip: "esp32c3", label: "Xmini-C3", img: "/img/chips/xmini_c3.png" },
    { chip: "esp32c3_v3", label: "Xmini-C3 V3", img: "/img/chips/xmini_c3_v3.png" },
    { chip: "esp32s3_cube", label: "XingZhi Cube 1.54", img: "/img/chips/xingzhi_cube.png" },
    { chip: "esp32s3_n28p", label: "ES32N28P", img: "/img/chips/es32n28p.png" },
    { chip: "esp32c3_esphi", label: "ESP Hi", img: "/img/chips/esp_hi.png" },
    { chip: "custom", label: "Custom", img: "/img/chips/custom.png" },
  ],
};


// Map thư mục & tiền tố tên file cho từng chip Xiaozhi
const XIAOZHI_CHIP_MAP = {
  esp32s3: { dir: "esp32s3", filePrefix: "xiaozhi_esp32s3" },
  esp32s3_mini: { dir: "esp32s3mini", filePrefix: "xiaozhi_esp32s3mini" },
  esp32s3_zero: { dir: "esp32s3zero", filePrefix: "xiaozhi_esp32s3zero" }, // NEW
  esp32c3: { dir: "esp32c3", filePrefix: "xiaozhi_esp32c3" },
  esp32c3_v3: { dir: "esp32c3v3", filePrefix: "xiaozhi_esp32c3v3" }, // NEW
  esp32s3_cube: { dir: "esp32s3cube", filePrefix: "xiaozhi_esp32s3cube" }, // NEW
  esp32s3_n28p: { dir: "esp32s3n28p", filePrefix: "xiaozhi_esp32s3n28p" }, // NEW
  esp32c3_esphi: { dir: "esp32c3esphi", filePrefix: "xiaozhi_esp32c3esphi" }, // NEW
  custom: { dir: "custom", filePrefix: "xiaozhi_custom" }, // NEW
};

// Các lựa chọn màn hình mặc định cho đa số board Xiaozhi
const DEFAULT_OLED_OPTIONS = [
  { value: "0.91", label: "OLED 0.91inch" },
  { value: "0.96", label: "OLED 0.96inch" },
  { value: "1.3", label: "OLED 1.3inch" },
]

// Các chip có layout màn hình riêng
const CHIP_OLED_OPTIONS = {
  // N28P có 2 kiểu màn 2.8"
  esp32s3_n28p: [
    { value: "2.8", label: "Màn 2.8 IPS" },
    { value: "2.8-nonips", label: "Màn 2.8 Non-IPS" },
  ],
}

// Chip chỉ có đúng 1 màn → auto chọn, bỏ bước chọn
const CHIP_FIXED_SCREEN = {
  esp32s3_cube: "1.54", // XingZhi Cube 1.54"
  esp32c3: "0.96",    // Xmini-C3 chỉ có OLED 1.3"
  esp32c3_v3: "0.96", // Xmini-C3 V3 chỉ có OLED 1.3"
  esp32c3_esphi: "0.5", // ESP Hi chỉ có OLED 1.3"
  custom: "Nhắn tin để được hỗ trợ build riêng",
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

// Function to generate firmware binary file name and path
function generateFirmwarePath(fw, chip, oled = null) {
  let binaryFileName = ""
  let folderPath = ""

  if (fw === "mochi_nav") {
    // MochiNav: mochi_nav_esp32.bin, mochi_nav_esp32c3.bin
    binaryFileName = `mochi_nav_${chip}.bin`
    folderPath = `/firmware/${fw}/${chip}`
  } else if (fw === "xiaozhi") {
    const map = XIAOZHI_CHIP_MAP[chip];
    if (!map) throw new Error(`Chip chưa được hỗ trợ: ${chip}`);

    // Tên file theo chip cụ thể
    binaryFileName = `${map.filePrefix}_oled${oled}.bin`;
    // Đường dẫn có ngôn ngữ + thư mục chip riêng
    folderPath = `/firmware/${fw}/${map.dir}/oled${oled}`;
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

// === DOWNLOAD FW: dùng manifest; fallback file .bin cùng folder ===
async function downloadSelectedFirmware(manifestPath, chipType) {
  // Resolve URL tuyệt đối từ manifestPath (dù bạn dùng đường dẫn tương đối)
  const manifestUrl = new URL(manifestPath, document.baseURI).href;
  const baseDir = manifestUrl.substring(0, manifestUrl.lastIndexOf("/") + 1);

  // Helper: tạo URL cùng thư mục manifest
  const sameDir = (name) => new URL(name.replace(/^\.\//, ""), baseDir).href;

  // Helper: kiểm tra tồn tại file mà không tải toàn bộ (HEAD; có server không hỗ trợ HEAD -> fallback GET nhẹ)
  const exists = async (url) => {
    try {
      let r = await fetch(url, { method: "HEAD", cache: "no-cache" });
      if (r.ok) return true;
      // Live Server đôi khi không hỗ trợ HEAD → thử GET 1 lần
      r = await fetch(url, { method: "GET", cache: "no-cache" });
      return r.ok;
    } catch {
      return false;
    }
  };

  try {
    // 1) Cố đọc manifest
    let manifest = null;
    try {
      const res = await fetch(manifestUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      manifest = await res.json();
    } catch (e) {
      console.warn("[FW] Không đọc/parse được manifest, sẽ fallback tên file mặc định:", e);
    }

    // 2) Nếu có 'parts' → chọn file chính từ parts
    if (manifest) {
      const builds = Array.isArray(manifest.builds) ? manifest.builds : null;
      let parts = null;

      if (builds && builds.length) {
        const pickByChip = (needle) =>
          builds.find((b) => (b.chipFamily || "").toLowerCase().includes((needle || "").toLowerCase()));
        const build = pickByChip("esp32-s3") || pickByChip(chipType) || builds[0];
        parts = build && Array.isArray(build.parts) ? build.parts : null;
      } else if (Array.isArray(manifest.parts)) {
        parts = manifest.parts;
      }

      if (parts && parts.length) {
        // Ưu tiên file có tên hợp lý; nếu không có, chọn part offset lớn nhất
        const mainPart =
          parts.find((p) => /\/?(xiaozhi|firmware|factory|application|app)\.bin$/i.test(p.path || "")) ||
          parts.slice().sort((a, b) => (a.offset || 0) - (b.offset || 0)).pop() ||
          parts[0];

        if (mainPart?.path) {
          const fileUrl = sameDir(String(mainPart.path));
          const filename = String(mainPart.path).split("/").pop() || "firmware.bin";
          const a = document.createElement("a");
          a.href = fileUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          return; // xong
        }
      }
    }

    // 3) Fallback: thử những tên file phổ biến trong cùng thư mục manifest
    const guesses = ["xiaozhi.bin", "firmware.bin", "application.bin", "app.bin", "factory.bin"];
    for (const name of guesses) {
      const url = sameDir(name);
      // Có thể bỏ exists() để click luôn; nhưng check trước cho sạch
      if (await exists(url)) {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return; // xong
      }
    }

    throw new Error("Không tìm thấy file .bin cạnh manifest.");
  } catch (err) {
    console.error("[FW] Download failed:", err);
    alert("Không thể tải FW từ manifest.\n" + err.message);
  }
}

function setupEspWebToolsWithManifest(chipType) {
  let manifestPath = "";

  if (selectedFw === "mochi_nav") {
    manifestPath = `/firmware/${selectedFw}/${chipType}/manifest.json`;
  } else if (selectedFw === "xiaozhi") {
    const map = XIAOZHI_CHIP_MAP[chipType];
    if (!map) throw new Error(`Chip chưa được hỗ trợ: ${chipType}`);
    manifestPath = `/firmware/${selectedFw}/${map.dir}/oled${selectedOled}/manifest.json`;
  }

  // Reset container với nút Kết nối + nút Tải FW
  const espWebToolsContainer = document.getElementById("espWebToolsContainer");
  espWebToolsContainer.innerHTML = `
  <div style="
    display:grid;
    grid-template-columns: 1fr 1fr;
    align-items:center;
    gap:12px;
  ">
    <esp-web-install-button class="invisible" id="installButton" style="justify-self:start;">
      <button slot="activate" class="btn btn-primary">Cài Đặt Ngay</button>
    </esp-web-install-button>

    <!-- đổi btn-outline -> btn-primary để giống hệt -->
    <button id="downloadFwBtn" class="btn btn-primary" style="justify-self:end;">
      Tải Firmware (.bin)
    </button>

    <small id="fwUpdateStamp"
      style="grid-column:1 / -1; text-align:center; margin-top:4px; font-size:14px; color: #d1d5db;">
    </small>
  </div>
`;


  // Re-get elements
  const newInstallButton = document.getElementById("installButton");
  newInstallButton.manifest = manifestPath;
  newInstallButton.setAttribute("erase-first", "");
  newInstallButton.classList.remove("invisible");

  // Thời gian bạn tự điền
  const fwUpdatedAt = "20:00 - 03-12-2025";
  document.getElementById("fwUpdateStamp").textContent =
    `Chương trình được cập nhật lúc ${fwUpdatedAt}`;

  // Nút tải FW
  document.getElementById("downloadFwBtn").onclick =
    () => downloadSelectedFirmware(manifestPath, chipType);


  // Listener trạng thái flash
  newInstallButton.removeEventListener("state-changed", handleFlashStateChange);
  newInstallButton.addEventListener("state-changed", handleFlashStateChange);

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

function switchChipTab(chipTabId, scopeEl) {
  const content = document.getElementById(chipTabId + "-content");
  if (!content) return;

  // Giới hạn phạm vi trong cùng 1 wiring-section / tab-pane
  const root =
    scopeEl ||
    content.closest(".wiring-section, .tab-pane, .main-guide-tab-content") ||
    document;

  // Chỉ tắt / bật chip-tab-content trong nhóm này
  root.querySelectorAll(".chip-tab-content").forEach((c) => {
    c.classList.remove("active");
  });
  content.classList.add("active");

  // Chỉ toggle .chip-tab-btn trong nhóm này
  root.querySelectorAll(".chip-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.chipTab === chipTabId);
  });
}


function switchMainTab(tabId) {
  // 1. Bật/tắt nội dung main tab
  mainGuideTabContents.forEach((content) => {
    content.classList.toggle("active", content.id === tabId);
  });

  // 2. Active nút main ở trên
  mainGuideTabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mainTab === tabId);
  });

  // 3. Xử lý tab con bên trong main tab vừa chọn
  const currentMain = document.getElementById(tabId);
  if (!currentMain) return;

  const innerTabBtns = currentMain.querySelectorAll(".tab-btn");

  if (innerTabBtns.length > 0) {
    // Nếu trong group này đang có nút nào active thì ưu tiên dùng lại
    let btnToActivate = Array.from(innerTabBtns).find((b) =>
      b.classList.contains("active")
    );

    // Nếu không có thì chọn nút đầu tiên làm default
    if (!btnToActivate) {
      btnToActivate = innerTabBtns[0];
    }

    if (btnToActivate && btnToActivate.dataset.tab) {
      switchTab(btnToActivate.dataset.tab);
    }
  } else {
    // Main tab này không có tab con → clear trạng thái tab con cũ
    tabPanes.forEach((pane) => pane.classList.remove("active"));
    tabBtns.forEach((btn) => btn.classList.remove("active"));
  }
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

function renderOledOptionsForChip(chip) {
  // Nếu chip chỉ có 1 loại màn → auto chọn + ẩn UI
  const fixed = CHIP_FIXED_SCREEN[chip]
  if (fixed) {
    oledSelection.style.display = "none"
    oledGrid.innerHTML = ""
    selectedOled = fixed
    // Chip này đủ thông tin để flash luôn
    updateFlashButtonVisibility()
    return
  }

  // Xác định danh sách màn hình cho chip này
  const options = CHIP_OLED_OPTIONS[chip] || DEFAULT_OLED_OPTIONS

  oledSelection.style.display = "block"
  oledGrid.innerHTML = ""
  selectedOled = null

  options.forEach((opt) => {
    const btn = document.createElement("button")
    btn.className = "oled-button"
    btn.dataset.oled = opt.value
    btn.textContent = opt.label

    btn.addEventListener("click", async () => {
      // clear active cũ
      oledGrid.querySelectorAll(".oled-button").forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")

      selectedOled = opt.value
      await updateFlashButtonVisibility()
    })

    oledGrid.appendChild(btn)
  })
}

function createChipButton(opt) {
  const btn = document.createElement("button");
  btn.className = "chip-button";
  btn.dataset.chip = opt.chip;

  const imgSrc = opt.img || "/img/chips/default.png";

  btn.innerHTML = `
    <div class="chip-thumb">
      <img src="${imgSrc}" alt="${opt.label}">
    </div>
    <div class="chip-label">${opt.label}</div>
  `;

  btn.addEventListener("click", async () => {
    document.querySelectorAll(".chip-button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    selectedChip = opt.chip;

    if (selectedFw === "xiaozhi") {
      renderOledOptionsForChip(selectedChip);
    } else {
      oledSelection.style.display = "none";
      oledGrid.innerHTML = "";
      selectedOled = null;
    }

    await updateFlashButtonVisibility();
  });

  return btn;
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

  // Tab navigation
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab))
  })

  // Chip tab navigation (theo nhóm)
  chipTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const scope =
        btn.closest(".wiring-section") ||
        btn.closest(".tab-pane") ||
        btn.closest(".main-guide-tab-content") ||
        document;

      switchChipTab(btn.dataset.chipTab, scope);
    });
  });


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

    fbPopup.style.display = "flex";
    document.body.classList.add("no-scroll");


    closeBtn?.addEventListener("click", () => (fbPopup.style.display = "none",
      document.body.classList.remove("no-scroll")));
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



// ====== GET MAC bằng cách đọc LOG boot: "wifi:mode : sta (...)" =============
// ============ CONNECT → GET MAC (read-first-then-reset) ======================
const UNLINK_BOOTLOG = {
  baud: 115200,
  attemptTimeoutMs: 7000,
  reWifiModeSta: /wifi\s*:\s*mode\s*:\s*sta\s*\(\s*([0-9a-f]{2}([:\-])[0-9a-f]{2}(?:\2[0-9a-f]{2}){4})\s*\)/i,
  reAnyMac: /([0-9a-f]{2}([:\-])[0-9a-f]{2}(?:\2[0-9a-f]{2}){4})/i,
};

let _unlink_port = null;
let _unlink_readerStop = null;
let _unlink_runningReader = false;

function _unlink_sanitizeLogChunk(s) {
  if (!s) return "";
  s = s.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return s;
}
function _unlink_sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function _unlink_notify(msg, type = "info") {
  if (typeof showNotification === "function") showNotification(msg, type);
  const el = document.getElementById("unlinkResult");
  if (el) { el.textContent = msg; el.style.color = (type === "error") ? "#ef4444" : ""; }
}

// Popup progress + nút Hủy/Restart
function _unlink_showProgress(text = "Đang lấy MAC thiết bị…") {
  let el = document.getElementById("unlinkProgressModal");
  if (!el) {
    el = document.createElement("div");
    el.id = "unlinkProgressModal";
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.background = "rgba(0,0,0,0.5)";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.zIndex = "9999";
    el.innerHTML = `
      <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px 24px;max-width:480px;width:92%;color:#fff;text-align:center;font-size:15px;line-height:1.5">
        <div style="margin-bottom:10px;font-weight:600">Đang lấy MAC thiết bị</div>
        <div id="unlinkProgressText" style="opacity:.9;margin-bottom:14px">${text}</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button id="unlinkProgressRestart" class="btn-secondary" style="padding:8px 14px;border-radius:8px">↻ Khởi động lại & bắt lại</button>
          <button id="unlinkProgressCancel"  class="btn-secondary" style="padding:8px 14px;border-radius:8px">Hủy</button>
        </div>
      </div>`;
    document.body.appendChild(el);
  } else {
    const t = document.getElementById("unlinkProgressText");
    if (t) t.textContent = text;
    el.style.display = "flex";
  }
}

function _unlink_hideProgress() {
  const el = document.getElementById("unlinkProgressModal");
  if (el) el.style.display = "none";
}

async function _unlink_resetPulse(port) {
  try {
    await port.setSignals({ dataTerminalReady: false, requestToSend: true });
    await _unlink_sleep(40);
    await port.setSignals({ dataTerminalReady: true, requestToSend: false });
    await _unlink_sleep(80);
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
  } catch (_) { }
}

// Bắt đầu reader liên tục, trả về { stop() }
function _unlink_startReader(port, onData) {
  const textDecoder = new TextDecoderStream();
  const closedPromise = port.readable.pipeTo(textDecoder.writable).catch(() => { });
  const reader = textDecoder.readable.getReader();
  _unlink_runningReader = true;

  (async () => {
    try {
      while (_unlink_runningReader) {
        const { value, done } = await reader.read();
        if (done || !_unlink_runningReader) break;
        if (value) onData(_unlink_sanitizeLogChunk(value));
      }
    } catch { } finally {
      try { reader.releaseLock(); } catch { }
      try { await closedPromise; } catch { }
      _unlink_runningReader = false;
    }
  })();

  return {
    stop: async () => {
      _unlink_runningReader = false;
      try { reader.cancel(); } catch { }
    }
  };
}

// KẾT NỐI: requestPort + open, đổi nút thành "↻ Get MAC"
async function unlinkConnectSerial() {
  if (!navigator.serial) {
    _unlink_notify("Trình duyệt không hỗ trợ Web Serial. Vui lòng dùng Chrome/Edge trên máy tính.", "error");
    return;
  }
  try {
    _unlink_port = await navigator.serial.requestPort();
    await _unlink_port.open({ baudRate: UNLINK_BOOTLOG.baud });

    const btn = document.getElementById("btnGetMac");
    if (btn) {
      btn.textContent = "↻ Get MAC";
      btn.title = "Bấm để đọc log & reset để lấy MAC";
      // gỡ handler cũ (connect) rồi gắn handler get mac
      btn.replaceWith(btn.cloneNode(true));
      const btn2 = document.getElementById("btnGetMac");
      btn2.addEventListener("click", unlinkGetMacFlow);
    }
    _unlink_notify("Đã kết nối cổng serial. Sẵn sàng lấy MAC.");

  } catch (err) {
    _unlink_notify(`Không thể kết nối: ${err.message || err}`, "error");
  }
}

// GET MAC: bật đọc trước → reset → đợi regex → điền input
async function unlinkGetMacFlow() {
  const macInput = document.getElementById("unlinkMac");
  if (!macInput) { _unlink_notify("Không tìm thấy ô MAC Address (#unlinkMac).", "error"); return; }
  if (!_unlink_port) { _unlink_notify("Chưa kết nối cổng. Hãy bấm 'Kết nối' trước.", "error"); return; }

  let buf = ""; const maxBuf = 8192;
  const findMac = () => {
    let m = buf.match(UNLINK_BOOTLOG.reWifiModeSta); if (m && m[1]) return m[1];
    m = buf.match(UNLINK_BOOTLOG.reAnyMac); if (m && m[1]) return m[1];
    return null;
  };
  const setPopupText = (t) => { const el = document.getElementById("unlinkProgressText"); if (el) el.textContent = t; };

  let abort = false;
  let resetting = false;

  try {
    _unlink_showProgress("Đang lấy MAC thiết bị…");

    // Nút Hủy
    const cancelBtn = document.getElementById("unlinkProgressCancel");
    if (cancelBtn) cancelBtn.onclick = () => { abort = true; };

    // Nút Khởi động lại
    const restartBtn = document.getElementById("unlinkProgressRestart");
    if (restartBtn) restartBtn.onclick = async () => {
      if (resetting) return;
      resetting = true;
      setPopupText("Đang khởi động lại & bắt lại log…");
      await _unlink_resetPulse(_unlink_port);
      resetting = false;
    };

    // 1) Bật reader TRƯỚC
    _unlink_readerStop?.stop?.();
    _unlink_readerStop = _unlink_startReader(_unlink_port, (chunk) => {
      buf += chunk;
      if (buf.length > maxBuf) buf = buf.slice(-maxBuf);
    });

    // 2) Cho decoder “ấm máy” chút rồi reset NGAY
    await _unlink_sleep(40);
    await _unlink_resetPulse(_unlink_port);

    // 3) Đợi match
    const t0 = Date.now();
    while (!abort && (Date.now() - t0) < UNLINK_BOOTLOG.attemptTimeoutMs) {
      const mac = findMac();
      if (mac) {
        const norm = _unlink_normalizeMac(mac);
        macInput.value = norm;
        _unlink_notify(`Đã lấy MAC: ${norm}`);
        setPopupText(`Đã lấy MAC: ${norm}`);
        await _unlink_sleep(700);
        _unlink_hideProgress();
        return;
      }
      await _unlink_sleep(35);
    }

    // Hết hạn 1 lượt → vẫn giữ popup mở, cho người dùng bấm “↻”
    if (!abort) {
      setPopupText("Chưa thấy MAC. Bạn có thể bấm “↻ Khởi động lại & bắt lại”.");
      _unlink_notify("Chưa thấy MAC — bấm ↻ để reset và bắt lại log.", "error");
    } else {
      _unlink_hideProgress();
      _unlink_notify("Đã hủy lấy MAC.", "error");
    }

  } catch (err) {
    _unlink_hideProgress();
    _unlink_notify(`Lỗi lấy MAC: ${err.message || err}`, "error");
  }
}

// KHỞI TẠO NÚT: ban đầu là “🔌 Kết nối”, sau khi kết nối sẽ thành “↻ Get MAC”
function initUnlinkConnectMacButton() {
  const btn = document.getElementById("btnGetMac");
  if (!btn) return;
  if (!navigator.serial) {
    btn.disabled = true;
    btn.title = "Yêu cầu Chrome/Edge trên máy tính";
    return;
  }
  btn.textContent = "🔌 Kết nối để lấy MAC";
  btn.title = "Chọn cổng COM để kết nối";
  btn.addEventListener("click", unlinkConnectSerial);
}

// GỌI init … (thêm dòng này trong DOMContentLoaded cùng initUnlinkEmailHandlers)
/// initUnlinkConnectMacButton();


// ====== UNLINK helpers (cập nhật) ======

function _unlink_isValidMac(mac) {
  if (!mac) return false;
  const v = mac.trim();
  // AA:BB:CC:DD:EE:FF | AA-BB-CC-DD-EE-FF | AABBCCDDEEFF
  return /^([0-9A-Fa-f]{2}[:\-]){5}([0-9A-Fa-f]{2})$/.test(v) || /^[0-9A-Fa-f]{12}$/.test(v);
}

function _unlink_normalizeMac(mac) {
  let v = mac.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
  if (v.length === 12) return v.match(/.{1,2}/g).join(":");
  return mac.toUpperCase();
}

// Chỉ cho phép bất kỳ số nào (không giới hạn 6 chữ số)
function _unlink_isValidDeviceId(did) {
  return /^\d+$/.test(did);  // Kiểm tra chỉ số, không giới hạn độ dài
}

function _unlink_buildBody(mac, did) {
  const lines = [
    "尊敬的 Xiaozhi 支持团队：",
    "由于我不记得之前用于登录的账户信息，现请求将我的 Xiaozhi 设备从旧账户中解除绑定。",
    `+ MAC Address：${mac}`,
  ];

  if (did) {
    lines.push(`+ Device ID：${did}`);
  }

  lines.push(
    "请协助将上述设备从旧账户解除绑定；处理完成后，请通过此邮箱回复确认。",
    "谢谢！"
  );

  return lines.join("\n");
}

// NEW: build subject theo yêu cầu
function _unlink_buildSubject(mac, did) {
  if (did) {
    return `【解绑设备，设备ID ${did}，MAC地址 ${mac}】`;
  }
  return `【解绑设备，MAC地址 ${mac}】`;
}

function _unlink_openGmailCompose(to, subject, body) {
  const url =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(to)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  return !!win;
}

function _unlink_openMailto(to, subject, body) {
  const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

// ====== Handler (cập nhật) ======
function sendUnlinkEmail() {
  const macInput = document.getElementById("unlinkMac");
  const didInput = document.getElementById("unlinkDeviceId");
  const resultEl = document.getElementById("unlinkResult"); // optional

  const macRaw = macInput ? macInput.value.trim() : "";
  const didRaw = didInput ? didInput.value.trim() : "";

  const say = (msg, type = "info") => {
    if (typeof showNotification === "function") showNotification(msg, type);
    if (resultEl) {
      resultEl.textContent = msg;
      resultEl.style.color = (type === "error") ? "#ef4444" : "";
    }
  };

  if (!macRaw) {
    say("Vui lòng nhập MAC Address.", "error");
    return;
  }

  if (!_unlink_isValidMac(macRaw)) {
    say("Định dạng MAC không hợp lệ. Ví dụ: AA:BB:CC:DD:EE:FF", "error");
    return;
  }

  const mac = _unlink_normalizeMac(macRaw);
  const deviceId = didRaw.replace(/\s+/g, "");  // có thể rỗng

  if (deviceId && !_unlink_isValidDeviceId(deviceId)) {
    say("Device ID chỉ được chứa các chữ số (0–9).", "error");
    return;
  }

  const to = "xiaozhi.ai@tenclass.com";
  const subject = _unlink_buildSubject(mac, deviceId);
  const body = _unlink_buildBody(mac, deviceId);

  // Ưu tiên DI ĐỘNG: mailto -> mở app Gmail / trình chọn email
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    _unlink_openMailto(to, subject, body);
    say("Đang mở ứng dụng email để soạn thư…");
    return;
  }

  // Ưu tiên DESKTOP: Gmail web -> fallback mailto
  const opened = _unlink_openGmailCompose(to, subject, body);
  if (!opened) _unlink_openMailto(to, subject, body);
  say("Đang mở cửa sổ soạn thư…");
}

// ====== Init (giữ nguyên nếu bạn đã có) ======
function initUnlinkEmailHandlers() {
  const btn = document.getElementById("btnSendUnlinkEmail");
  const macInput = document.getElementById("unlinkMac");
  const didInput = document.getElementById("unlinkDeviceId");
  if (!btn) return;

  btn.addEventListener("click", sendUnlinkEmail);
  [macInput, didInput].forEach((el) => {
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendUnlinkEmail();
    });
  });
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  initializePopups()
  initUnlinkEmailHandlers();
  initUnlinkConnectMacButton();

})

