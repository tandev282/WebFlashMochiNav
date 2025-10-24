// === update.js (logic mới, dùng cơ chế lấy .json như bạn cung cấp) ===

const btnCheckUpdate = document.getElementById('btnCheckUpdate');
const btnFactoryReset = document.getElementById('btnFactoryReset');
const versionsBox = document.getElementById('versions');
const versionList = document.getElementById('versionList');
const deviceInfo = document.getElementById('deviceInfo');

// Luôn hiện 2 nút chính
btnCheckUpdate?.classList.remove('hidden');
btnFactoryReset?.classList.remove('hidden');

// --- helpers để rút gọn mô tả như cũ ---
function stripMarkdown(md = "") {
    if (!md) return "";
    md = md.replace(/```[\s\S]*?```/g, "");
    md = md.replace(/`[^`]*`/g, "");
    md = md.replace(/!\[[^\]]*\]\([^)]+\)/g, "");
    md = md.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    md = md.replace(/^>+\s?/gm, "");
    md = md.replace(/^#+\s?/gm, "");
    md = md.replace(/(\*\*|__)(.*?)\1/g, "$2");
    md = md.replace(/(\*|_)(.*?)\1/g, "$2");
    md = md.replace(/^\s*[-*+]\s+/gm, "");
    md = md.replace(/^\s*\d+\.\s+/gm, "");
    md = md.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n");
    return md.trim();
}
function pickFirstParagraph(text = "") {
    if (!text) return "";
    const cleaned = stripMarkdown(text);
    const para = cleaned.split(/\n{2,}/)[0].trim();
    return para || cleaned.split("\n")[0].trim();
}
function ellipsis(s = "", max = 180) {
    s = (s || "").trim();
    return s.length > max ? (s.slice(0, max - 1).trimEnd() + "…") : s;
}

// ====== giữ nguyên cơ chế bạn cung cấp ======
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
// ============================================

// Gộp 2 danh sách (mini & zero) theo version để render 2 nút/phiên bản
function buildVersionPairs(rels) {
    const minis = toItemsFromReleases(rels, "mini");
    const zeros = toItemsFromReleases(rels, "zero");

    const map = new Map();

    for (const m of minis) {
        map.set(m.version, {
            version: m.version,
            miniManifest: m.url,
            zeroManifest: null,
            relDate: m.relDate,
            desc: m.desc,
            relUrl: m.relUrl
        });
    }
    for (const z of zeros) {
        if (map.has(z.version)) {
            const it = map.get(z.version);
            it.zeroManifest = z.url;
            // giữ desc/relDate/relUrl từ mini (2 bản giống nhau), nếu muốn có thể ưu tiên bản có ngày mới hơn
        } else {
            map.set(z.version, {
                version: z.version,
                miniManifest: null,
                zeroManifest: z.url,
                relDate: z.relDate,
                desc: z.desc,
                relUrl: z.relUrl
            });
        }
    }

    // Trả về mảng đã sắp xếp mới nhất lên trên
    return Array.from(map.values()).sort(
        (a, b) =>
            (new Date(b.relDate) - new Date(a.relDate)) ||
            b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: "base" })
    );
}

// HTML mỗi phiên bản (2 nút cột phải). CSS bạn đã thêm sẽ căn đúng.
function versionCardHTML(item) {
    // Nếu thiếu 1 trong 2 manifest (tag cũ), vẫn render nút còn lại
    const miniBtn = item.miniManifest
        ? `<esp-web-install-button manifest="${item.miniManifest}" erase-first>
         <button slot="activate" class="btn-primary">⚙️ Cài đặt FW 1</button>
       </esp-web-install-button>`
        : `<button class="btn-primary" disabled title="Không có manifest Mini">⚙️ Cài đặt FW 1</button>`;

    const zeroBtn = item.zeroManifest
        ? `<esp-web-install-button manifest="${item.zeroManifest}" erase-first>
         <button slot="activate" class="btn-primary">⚙️ Cài đặt FW 2</button>
       </esp-web-install-button>`
        : `<button class="btn-primary" disabled title="Không có manifest Zero">⚙️ Cài đặt FW 2</button>`;

    return `
    <div class="version-item">
      <div class="version-head">
        <span class="version-name">v${item.version}</span>
        ${item.relUrl ? `<a class="muted" href="${item.relUrl}" target="_blank">(ghi chú phát hành)</a>` : ""}
      </div>

      <div class="version-desc">${item.desc || ""}</div>

      <div class="btn-row">
        ${miniBtn}
        ${zeroBtn}
      </div>
    </div>
  `;
}

// Sự kiện
async function listVersions() {
    versionsBox.classList.remove("hidden");
    versionList.innerHTML = "⏳ Đang tải danh sách bản cập nhật...";

    try {
        const releases = await fetchReleases();
        const pairs = buildVersionPairs(releases);

        if (!pairs.length) {
            versionList.textContent = "Không tìm thấy bản firmware.";
            return;
        }

        versionList.innerHTML = pairs.map(versionCardHTML).join("");
        deviceInfo.textContent = "1. Nếu nạp xong thiết bị bị nháy nháy màn hình, hãy thử nạp bản firmware còn lại. \n2. Khi nạp xong, vui lòng khởi động lại thiết bị nếu nó không hiển thị gì (có tiếng nhưng tối thui màn hình).";
        deviceInfo.className = "result ok";
    } catch (err) {
        console.error(err);
        versionList.textContent = "⚠️ Lỗi kiểm tra cập nhật!";
    }
}

btnCheckUpdate?.addEventListener("click", listVersions);
btnFactoryReset?.addEventListener("click", () => {
    alert("Khôi phục cài đặt gốc sẽ được tách thành manifest riêng (sẽ bổ sung sau).");
});
