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
    { chip: "esp32s3", label: "ESP32-S3" },
    { chip: "esp32s3_mini", label: "ESP32-S3 Mini" },
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

// Function to generate firmware binary file name and path
function generateFirmwarePath(fw, chip, oled = null) {
  let binaryFileName = ""
  let folderPath = ""

  if (fw === "mochi_nav") {
    binaryFileName = `mochi_nav_${chip}.bin`
    folderPath = `firmware/${fw}/${chip}`
  } else if (fw === "xiaozhi") {
    if (chip === "esp32s3_mini") {
      binaryFileName = `xiaozhi_esp32s3mini_oled${oled}.bin`
      folderPath = `firmware/${fw}/esp32s3mini/oled${oled}`
    } else {
      binaryFileName = `xiaozhi_esp32s3_oled${oled}.bin`
      folderPath = `firmware/${fw}/${chip}/oled${oled}`
    }
  }

  // For checkFirmwareExists, we still check the main binary file.
  // The manifest will handle the multi-part flashing.
  return {
    binaryFileName,
    folderPath,
    fullPath: `${folderPath}/${binaryFileName}`,
  }
}

// Function to check if firmware binary file exists
async function checkFirmwareExists(fw, chip, oled = null) {
  try {
    // When using multi-part flashing, the manifest.json is the primary file.
    // However, the current generateFirmwarePath returns the main binary path.
    // We can keep this check as a basic validation that the main binary exists.
    // The esp-web-tools will fetch the manifest and then its parts.
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
      <p class="coming-soon">Sẽ có sớm trong thời gian tới! 🚀</p>
    </div>
  `
}

function setupEspWebToolsWithManifest(chipType) {
  let manifestPath = ""

  if (selectedFw === "mochi_nav") {
    manifestPath = `firmware/${selectedFw}/${chipType}/manifest.json`
  } else if (selectedFw === "xiaozhi") {
    if (chipType === "esp32s3_mini") {
      manifestPath = `firmware/${selectedFw}/esp32s3mini/oled${selectedOled}/manifest.json`
    } else {
      manifestPath = `firmware/${selectedFw}/${chipType}/oled${selectedOled}/manifest.json`
    }
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

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  initializePopups()
})
