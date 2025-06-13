const chipCards = document.querySelectorAll(".chip-card")
const flashSection = document.getElementById("flashSection")
const statusSection = document.getElementById("statusSection")
const installButton = document.getElementById("installButton")
const tabBtns = document.querySelectorAll(".tab-btn")
const tabPanes = document.querySelectorAll(".tab-pane")
const chipTabBtns = document.querySelectorAll(".chip-tab-btn")
const chipTabContents = document.querySelectorAll(".chip-tab-content")
const progressFill = document.getElementById("progressFill") // Declare progressFill variable

let selectedChip = null

function initializeApp() {
  try {
    setupEventListeners()
    console.log("Ứng dụng đã khởi tạo thành công")
  } catch (error) {
    showError("Không thể khởi tạo ứng dụng.")
    console.error("Lỗi khởi tạo ứng dụng:", error)
  }
}

function selectChip(chipType) {
  selectedChip = chipType

  chipCards.forEach((card) => {
    card.classList.remove("selected")
    if (card.dataset.chip === chipType) {
      card.classList.add("selected")
    }
  })

  showFlashSection(chipType)
}

function showFlashSection(chipType) {
  flashSection.style.display = "block"
  statusSection.style.display = "none"

  setupEspWebToolsWithManifest(chipType)
}

function setupEspWebToolsWithManifest(chipType) {
  const manifestPath = `./firmware/${chipType}/manifest.json`

  installButton.manifest = manifestPath
  installButton.setAttribute("erase-first", "")
  installButton.classList.remove("invisible")

 
  installButton.innerHTML = `
    <button slot="activate" class="btn btn-primary" style="margin: 0 auto; display: block;">
      Kêt nối
    </button>
  `

  installButton.addEventListener("state-changed", handleFlashStateChange)
}

function handleFlashStateChange(event) {
  const state = event.detail.state
  const statusIcon = document.getElementById("statusIcon")
  const statusTitle = document.getElementById("statusTitle")
  const statusMessage = document.getElementById("statusMessage")

  switch (state) {
    case "preparing":
      showStatusSection()
      statusIcon.textContent = "⏳"
      statusTitle.textContent = "Đang chuẩn bị..."
      statusMessage.textContent = "Đang chuẩn bị nạp firmware"
      progressFill.style.width = "10%"
      break

    case "erasing":
      statusIcon.textContent = "🔄"
      statusTitle.textContent = "Đang xóa Flash..."
      statusMessage.textContent = "Đang xóa firmware cũ"
      progressFill.style.width = "30%"
      break

    case "writing":
      statusIcon.textContent = "📝"
      statusTitle.textContent = "Đang ghi Firmware..."
      statusMessage.textContent = "Đang cài đặt firmware mới"
      progressFill.style.width = "70%"
      break

    case "finished":
      statusIcon.textContent = "✅"
      statusTitle.textContent = "Thành công!"
      statusMessage.textContent = "Firmware đã được cài đặt thành công"
      progressFill.style.width = "100%"
      showNotification("Firmware đã được cài đặt thành công!", "success")
      setTimeout(() => {
        hideStatusSection()
      }, 3000)
      break

    case "error":
      statusIcon.textContent = "❌"
      statusTitle.textContent = "Lỗi"
      statusMessage.textContent = "Không thể cài đặt firmware"
      progressFill.style.width = "0%"
      showNotification("Không thể cài đặt firmware", "error")
      setTimeout(() => {
        hideStatusSection()
      }, 5000)
      break
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
  // Hide all tab panes
  tabPanes.forEach((pane) => {
    pane.classList.remove("active")
  })

  // Show the selected tab pane
  document.getElementById(tabId).classList.add("active")

  // Update active state of tab buttons
  tabBtns.forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add("active")
    } else {
      btn.classList.remove("active")
    }
  })
}

function switchChipTab(chipTabId) {
  // Hide all chip tab contents
  chipTabContents.forEach((content) => {
    content.classList.remove("active")
  })

  // Show the selected chip tab content
  document.getElementById(chipTabId + "-content").classList.add("active")

  // Update active state of chip tab buttons
  chipTabBtns.forEach((btn) => {
    if (btn.dataset.chipTab === chipTabId) {
      btn.classList.add("active")
    } else {
      btn.classList.remove("active")
    }
  })
}

function setupEventListeners() {
  // Chip selection
  chipCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectChip(card.dataset.chip)
    })
  })

  // Tab navigation
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab)
    })
  })

  // Chip tab navigation
  chipTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchChipTab(btn.dataset.chipTab)
    })
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

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    color: "white",
    fontWeight: "600",
    zIndex: "1000",
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
  })

  const colors = {
    info: "#0ea5e9",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  }
  notification.style.backgroundColor = colors[type] || colors.info

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (flashSection.style.display === "block") {
      flashSection.style.display = "none"
      chipCards.forEach((card) => card.classList.remove("selected"))
      selectedChip = null
    }
  }
})

document.addEventListener("DOMContentLoaded", initializeApp)
