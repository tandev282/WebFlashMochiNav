// DOM Elements
const chipCards = document.querySelectorAll(".chip-card")
const flashSection = document.getElementById("flashSection")
const statusSection = document.getElementById("statusSection")
const selectedInfo = document.getElementById("selectedInfo")
const themeToggle = document.getElementById("themeToggle")
const backButton = document.getElementById("backButton")
const installButton = document.getElementById("installButton")

// State
let selectedChip = null

// Initialize the application
function initializeApp() {
  try {
    // Initialize theme
    initializeTheme()

    // Set up event listeners
    setupEventListeners()

    console.log("App initialized successfully")
  } catch (error) {
    showError("Failed to initialize application.")
    console.error("Error initializing app:", error)
  }
}

// Select chip and go directly to flash section
function selectChip(chipType) {
  selectedChip = chipType

  // Update chip card selection
  chipCards.forEach((card) => {
    card.classList.remove("selected")
    if (card.dataset.chip === chipType) {
      card.classList.add("selected")
    }
  })

  // Show flash section directly
  showFlashSection(chipType)
}

// Show flash section with selected chip
function showFlashSection(chipType) {
  flashSection.style.display = "block"
  statusSection.style.display = "none"

  // Update selected info
  selectedInfo.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div>
        <strong>${chipType.toUpperCase()}</strong>
        <br>
        <small>Ready to flash</small>
      </div>
    </div>
  `

  // Setup ESP Web Tools with manifest file
  setupEspWebToolsWithManifest(chipType)

  // Smooth scroll to flash section
  flashSection.scrollIntoView({ behavior: "smooth" })
}

// Setup ESP Web Tools with manifest file
function setupEspWebToolsWithManifest(chipType) {
  // Set the manifest path based on chip
  const manifestPath = `./firmware/${chipType}/manifest.json`

  // Configure the install button
  installButton.manifest = manifestPath
  installButton.classList.remove("invisible")

  // Update button text
  installButton.innerHTML = `
    <button slot="activate" class="btn btn-primary">
      Install Firmware for ${chipType.toUpperCase()}
    </button>
  `

  // Add event listeners for flash state changes
  installButton.addEventListener("state-changed", handleFlashStateChange)
}

// Handle flash state changes
function handleFlashStateChange(event) {
  const state = event.detail.state
  const statusIcon = document.getElementById("statusIcon")
  const statusTitle = document.getElementById("statusTitle")
  const statusMessage = document.getElementById("statusMessage")
  const progressFill = document.getElementById("progressFill")

  switch (state) {
    case "preparing":
      showStatusSection()
      statusIcon.textContent = "⏳"
      statusTitle.textContent = "Preparing..."
      statusMessage.textContent = "Getting ready to flash firmware"
      progressFill.style.width = "10%"
      break

    case "erasing":
      statusIcon.textContent = "🔄"
      statusTitle.textContent = "Erasing Flash..."
      statusMessage.textContent = "Erasing existing firmware"
      progressFill.style.width = "30%"
      break

    case "writing":
      statusIcon.textContent = "📝"
      statusTitle.textContent = "Writing Firmware..."
      statusMessage.textContent = "Installing new firmware"
      progressFill.style.width = "70%"
      break

    case "finished":
      statusIcon.textContent = "✅"
      statusTitle.textContent = "Success!"
      statusMessage.textContent = "Firmware installed successfully"
      progressFill.style.width = "100%"
      showNotification("Firmware installed successfully!", "success")
      setTimeout(() => {
        hideStatusSection()
      }, 3000)
      break

    case "error":
      statusIcon.textContent = "❌"
      statusTitle.textContent = "Error"
      statusMessage.textContent = "Failed to install firmware"
      progressFill.style.width = "0%"
      showNotification("Failed to install firmware", "error")
      setTimeout(() => {
        hideStatusSection()
      }, 5000)
      break
  }
}

// Show status section
function showStatusSection() {
  statusSection.style.display = "block"
  statusSection.classList.add("fade-in")
  statusSection.scrollIntoView({ behavior: "smooth" })
}

// Hide status section
function hideStatusSection() {
  statusSection.style.display = "none"
  statusSection.classList.remove("fade-in")
}

// Initialize theme
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)
  updateThemeIcon(savedTheme)
}

// Toggle theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme")
  const newTheme = currentTheme === "dark" ? "light" : "dark"

  document.documentElement.setAttribute("data-theme", newTheme)
  localStorage.setItem("theme", newTheme)
  updateThemeIcon(newTheme)
}

// Update theme icon
function updateThemeIcon(theme) {
  const themeIcon = themeToggle.querySelector(".theme-icon")
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙"
}

// Set up event listeners
function setupEventListeners() {
  // Chip selection
  chipCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectChip(card.dataset.chip)
    })
  })

  // Back button
  backButton.addEventListener("click", () => {
    // Hide flash section
    flashSection.style.display = "none"

    // Reset chip selection
    chipCards.forEach((card) => card.classList.remove("selected"))
    selectedChip = null

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  })

  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme)
}

// Show error message
function showError(message) {
  console.error(message)
  showNotification(message, "error")
}

// Utility function for notifications
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  // Style the notification
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

  // Set background color based on type
  const colors = {
    info: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
  }
  notification.style.backgroundColor = colors[type] || colors.info

  // Add to DOM
  document.body.appendChild(notification)

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  // Remove after delay
  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Add keyboard navigation
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (flashSection.style.display === "block") {
      // Hide flash section
      flashSection.style.display = "none"

      // Reset chip selection
      chipCards.forEach((card) => card.classList.remove("selected"))
      selectedChip = null

      // Scroll back to top
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
})

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeApp)
