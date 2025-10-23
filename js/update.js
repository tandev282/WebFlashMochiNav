const btnConnectUpdate = document.getElementById('btnConnectUpdate');
const btnCheckUpdate = document.getElementById('btnCheckUpdate');
const btnFactoryReset = document.getElementById('btnFactoryReset');
const installBtn = document.getElementById('installBtn');   // nếu có dùng
const deviceInfo = document.getElementById('deviceInfo');
const versionsBox = document.getElementById('versions');
const versionList = document.getElementById('versionList');
const logBox = document.getElementById('log');
const logCard = document.getElementById('logCard');


// === utils: strip markdown + rút gọn mô tả từ release body ===
function stripMarkdown(md = "") {
    if (!md) return "";
    // code fence
    md = md.replace(/```[\s\S]*?```/g, "");
    // inline code
    md = md.replace(/`[^`]*`/g, "");
    // images ![alt](url)
    md = md.replace(/!\[[^\]]*\]\([^)]+\)/g, "");
    // links [text](url)
    md = md.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    // headings/quotes/emphasis
    md = md.replace(/^>+\s?/gm, "");
    md = md.replace(/^#+\s?/gm, "");
    md = md.replace(/(\*\*|__)(.*?)\1/g, "$2");
    md = md.replace(/(\*|_)(.*?)\1/g, "$2");
    // lists/tables markers
    md = md.replace(/^\s*[-*+]\s+/gm, "");
    md = md.replace(/^\s*\d+\.\s+/gm, "");
    // collapse whitespace
    md = md.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n");
    return md.trim();
}

function pickFirstParagraph(text = "") {
    if (!text) return "";
    const cleaned = stripMarkdown(text);
    // lấy đoạn đầu tiên (tới dòng trống hoặc ~180 ký tự)
    const para = cleaned.split(/\n{2,}/)[0].trim();
    return para || cleaned.split("\n")[0].trim();
}

function ellipsis(s = "", max = 160) {
    s = (s || "").trim();
    return s.length > max ? (s.slice(0, max - 1).trimEnd() + "…") : s;
}


function showDetecting(on, msg) {
    const overlay = document.getElementById('detecting');
    if (msg) overlay.querySelector('.msg').textContent = msg;
    if (on) {
        overlay.classList.add('show');
        btnConnectUpdate.setAttribute('disabled', 'disabled');
    } else {
        overlay.classList.remove('show');
        btnConnectUpdate.removeAttribute('disabled');
    }
}

async function listVersions() {
    const releases = await fetchReleases();
    let items = [];

    releases.forEach(r => {
        r.assets?.forEach(a => {
            if (chipType === "zero" && a.name.endsWith(".json") && a.name.includes("zero")) {
                const ver = (a.name.match(/xiaozhi-zero-(.+)\.json/) || [])[1];
                if (ver) items.push({ version: ver, url: a.browser_download_url });
            }
            if (chipType === "mini" && a.name.endsWith(".json") && a.name.includes("mini")) {
                const ver = (a.name.match(/xiaozhi-mini-(.+)\.json/) || [])[1];
                if (ver) items.push({ version: ver, url: a.browser_download_url });
            }
        });
    });

    if (items.length === 0) {
        versionsDiv.textContent = "Không tìm thấy bản firmware cho loại chip này.";
        versionsDiv.classList.remove("hidden");
        return;
    }

    versionsDiv.innerHTML = `
      <div class="versions-wrap">
        ${items.map(i => `
          <div class="ver-card" data-manifest="${i.url}">
            <span class="ver-name">v${i.version}</span>
            <button class="ver-install-btn">Cài đặt</button>
          </div>
        `).join("")}
      </div>
    `;
    versionsDiv.classList.remove("hidden");
    btnUpdate.classList.add("hidden");
    installBtn.classList.add("hidden");

    versionsDiv.querySelectorAll(".ver-install-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.currentTarget.closest(".ver-card");
            const manifestUrl = card?.dataset.manifest;
            if (!manifestUrl) return;

            installBtn.manifest = manifestUrl;
            installBtn.setAttribute("erase-first", "");
            installBtn.classList.remove("hidden");
            installBtn.click();
        });
    });
}

let chipType = null;
let lastLog = "";

function setProgress(_) { /* progress removed */ }
function setInfo(msg, kind = "") { deviceInfo.textContent = msg; deviceInfo.className = "result " + (kind || ""); }
function showLog(show) {
    logCard.classList.toggle("hidden", !show);
}

const MAX_LOG_LINES = 600;
let _logBuf = "";
const MAX_RAW_BYTES = 512 * 1024;
const BREAK_TOKENS = [
    "ESP-ROM:", "Build:", "rst:", "Saved PC:", "SPIWP:", "mode:",
    "clock div:", "load:", "entry", "I (", "W (", "E ("
];

function ensureLogContainer() {
    let c = document.getElementById("logLines");
    if (!c) {
        c = document.createElement("div");
        c.id = "logLines";
        c.className = "log-lines";
        logBox.innerHTML = "";
        logBox.appendChild(c);
    }
    return c;
}

function normalizeChunk(s) {
    s = s.replace(/\r\n?/g, "\n");

    const pattern = new RegExp("\\s+(?=(" + BREAK_TOKENS
        .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|") + "))", "g");
    s = s.replace(pattern, "\n");
    return s;
}

function levelOf(line) {
    if (/\bE\s*\(/.test(line)) return "e";
    if (/\bW\s*\(/.test(line)) return "w";
    if (/\bI\s*\(/.test(line)) return "i";
    return "n";
}

function appendLog(chunk) {
    lastLog += chunk;
    if (lastLog.length > MAX_RAW_BYTES) {
        lastLog = lastLog.slice(-MAX_RAW_BYTES);
    }

    const container = ensureLogContainer();
    _logBuf += normalizeChunk(chunk);

    const parts = _logBuf.split("\n");
    _logBuf = parts.pop() ?? "";

    for (const raw of parts) {
        const line = raw.trimEnd();
        if (!line) continue;
        const div = document.createElement("div");
        div.className = "log-line " + levelOf(line);
        div.textContent = line;
        container.appendChild(div);
    }

    while (container.children.length > MAX_LOG_LINES) {
        container.removeChild(container.firstChild);
    }
    const scroller = document.getElementById("logLines") || logBox;
    scroller.scrollTop = scroller.scrollHeight;

}

function parseDeviceInfo(log) {
    const verMatch = log.match(/App version:\s+([^\n]+)/i);
    const version = verMatch ? verMatch[1].trim() : "Không rõ";
    const has2MB = /esp_psram:\s+Found\s+2MB/i.test(log);
    const board = has2MB ? "ESP32-S3 Zero" : "ESP32-S3 Super Mini";
    chipType = has2MB ? "zero" : "mini";
    return { version, board };
}

async function pulseResetEN(port) {
    try {
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await new Promise(r => setTimeout(r, 100));
        await port.setSignals({ dataTerminalReady: true, requestToSend: false });
        await new Promise(r => setTimeout(r, 120));
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    } catch (e) { console.warn("pulseResetEN:", e); }
}

async function connectAndDetect() {
    if (!("serial" in navigator)) {
        setInfo("Trình duyệt không hỗ trợ Web Serial. Hãy dùng Chrome/Edge.", "err");
        return;
    }

    btnConnectUpdate.setAttribute('disabled', 'disabled');

    setProgress(5);
    lastLog = ""; logBox.textContent = ""; showLog(true);
    setInfo("Yêu cầu quyền truy cập cổng serial...");

    let port;
    try {
        port = await navigator.serial.requestPort({});
    } catch (e) {
        setInfo("Bạn đã hủy chọn cổng hoặc quyền truy cập serial bị từ chối.", "warn");
        btnConnectUpdate.removeAttribute('disabled');
        return;
    }

    showDetecting(true, 'Đang kiểm tra thiết bị…');

    try {
        await port.open({ baudRate: 115200 });
        setProgress(20);

        setInfo("Đang kiểm tra thiết bị…", "warn");
        await pulseResetEN(port);
        setProgress(35);

        const reader = port.readable.getReader();
        const decoder = new TextDecoder();
        const t0 = Date.now(); const timeoutMs = 3500;
        try {
            while (Date.now() - t0 < timeoutMs) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) appendLog(decoder.decode(value));
            }
        } finally { try { reader.releaseLock(); } catch (_) { } }

        const cutIdx = lastLog.indexOf("main_task: Calling app_main()");
        const bootLog = cutIdx > -1 ? lastLog.slice(0, cutIdx) : lastLog;

        const { version, board } = parseDeviceInfo(bootLog);
        setInfo(`Thiết bị: ESP32 S3 Super Mini\nPhiên bản hiện tại: ${version}`, "ok");

        try { await port.close(); } catch (_) { }

        btnConnectUpdate.textContent = "🔄 Kết nối lại";
        btnCheckUpdate.classList.remove("hidden");
        btnFactoryReset.classList.remove("hidden");
        setProgress(60);
    } finally {
        showDetecting(false);
        btnConnectUpdate.removeAttribute('disabled');
    }
}

async function fetchReleases() {
    const res = await fetch("https://api.github.com/repos/tandev282/xiaozhi-update/releases");
    if (!res.ok) throw new Error("GitHub API error: " + res.status);
    return res.json();
}

const normVer = v => (v || "").toString().trim().replace(/^v/i, "");

function toItemsFromReleases(rels, chip) {
    const want = chip === "zero" ? "zero" : "mini";
    const items = [];
    for (const r of rels) {
        const v = normVer(r.tag_name || r.name || "");
        if (!v) continue;
        const json = `xiaozhi-${want}-${v}.json`;
        const url = `https://cdn.jsdelivr.net/gh/tandev282/xiaozhi-update@${v}/${json}`;

        // Lấy mô tả ngắn từ release body (Describe this release)
        const shortDesc = ellipsis(pickFirstParagraph(r.body || r.name || ""), 180);

        items.push({
            version: v,
            url,
            relDate: r.published_at || r.created_at || "",
            desc: shortDesc,
            relUrl: r.html_url || ""
        });
    }
    return items.sort(
        (a, b) =>
            (new Date(b.relDate) - new Date(a.relDate)) ||
            b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: "base" })
    );
}

async function listVersions() {
    if (!chipType) { setInfo("Chưa kiểm tra thiết bị. Hãy Kết nối trước.", "warn"); return; }
    setProgress(70);
    versionsBox.classList.remove("hidden");
    versionList.innerHTML = "⏳ Đang tải danh sách bản cập nhật...";

    try {
        const releases = await fetchReleases();
        const items = toItemsFromReleases(releases, chipType);
        if (!items.length) { versionList.textContent = "Không tìm thấy bản firmware cho thiết bị này."; return; }

        versionList.innerHTML = items.map(i => `
  <esp-web-install-button
    class="ver-install"
    manifest="${i.url}"
    erase-first
  >
    <div class="version-item" slot="activate">
      <span class="version-name">v${i.version}</span>
      ${i.desc}
      <span class="inline-install">Cài đặt</span>
    </div>
  </esp-web-install-button>
`).join("");


        setProgress(85);
    } catch (e) {
        console.error(e);
        versionList.textContent = "⚠️ Lỗi kiểm tra cập nhật!.";
    }
}

btnFactoryReset.addEventListener("click", () => {
    alert("Đang phát triển tính năng này. Vui lòng chờ bản cập nhật sau.");
});

btnConnectUpdate.addEventListener("click", connectAndDetect);
btnCheckUpdate.addEventListener("click", listVersions);