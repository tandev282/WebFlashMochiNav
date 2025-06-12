# ESP32 Firmware Flasher - Combined Firmware

## Cấu trúc thư mục đơn giản:

\`\`\`
project/
├── index.html
├── script.js
├── styles.css
└── firmware/
    ├── esp32/
    │   ├── firmware.bin       <-- Combined firmware file
    │   └── manifest.json      <-- Manifest với offset 0
    └── esp32c3/
        ├── firmware.bin       <-- Combined firmware file
        └── manifest.json      <-- Manifest với offset 0
\`\`\`

## Combined Firmware vs Separate Files:

### ✅ Combined Firmware (Đơn giản hơn):
- **1 file duy nhất** tại offset 0
- **Đã merge** bootloader + partitions + app
- **Dễ quản lý** và ít lỗi
- **Flash nhanh hơn**

### ⚠️ Separate Files (Phức tạp hơn):
- **3 files riêng biệt** với offset khác nhau
- **Cần đúng offset** cho từng file
- **Dễ bị lỗi** nếu offset sai
- **Flash chậm hơn**

## Cách tạo Combined Firmware:

### Arduino IDE:
1. Compile project
2. Vào thư mục build
3. Tìm file \`.bin\` có kích thước lớn nhất
4. Đó là combined firmware

### PlatformIO:
\`\`\`ini
[env:esp32]
board_build.embed_files = 
board_build.filesystem = littlefs
board_build.partitions = default.csv
board_upload.flash_size = 4MB
board_upload.maximum_size = 4194304
\`\`\`

### ESP-IDF:
\`\`\`bash
idf.py build
# File combined sẽ ở build/firmware.bin
\`\`\`

## Lưu ý quan trọng:

1. **Combined firmware** phải được tạo đúng cách
2. **Offset 0** sẽ ghi đè toàn bộ flash
3. **Erase device** sẽ được thực hiện tự động
4. **Kích thước file** thường lớn hơn (vì chứa tất cả)

## Kiểm tra Combined Firmware:
- File size thường > 1MB
- Chứa bootloader + partitions + app
- Có thể flash trực tiếp tại offset 0
\`\`\`
