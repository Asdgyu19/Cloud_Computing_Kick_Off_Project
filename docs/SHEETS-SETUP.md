# Google Sheets Setup Guide

## 1. Buat Spreadsheet Baru

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik **+ Blank** untuk buat sheet baru
3. Rename ke: `Cloud-Computing-Project`
4. **Catat ID sheet** dari URL:
   - URL: `https://docs.google.com/spreadsheets/d/XXXXXXXXX/edit`
   - ID = `XXXXXXXXX` (bagian di antara `/d/` dan `/edit`)

---

## 2. Buat 4 Sheet dengan Struktur Berikut

### Sheet 1: `tokens`
Untuk menyimpan QR token yang aktif.

| qr_token | course_id | session_id | created_at | expires_at | status |
|----------|-----------|-----------|-----------|-----------|--------|
| TKN-ABC123 | cloud-101 | sesi-02 | 2026-02-18T10:00:00Z | 2026-02-18T10:02:00Z | active |

**Langkah:**
1. Klik tab bawah → **+ (Tambah sheet)**
2. Rename ke `tokens`
3. Di baris 1, masukkan header: `qr_token`, `course_id`, `session_id`, `created_at`, `expires_at`, `status`

---

### Sheet 2: `presence`
Untuk menyimpan record presensi (checkin).

| presence_id | user_id | device_id | course_id | session_id | qr_token | ts | status |
|---|---|---|---|---|---|---|---|
| PR-0001 | 2023xxxx | dev-001 | cloud-101 | sesi-02 | TKN-ABC123 | 2026-02-18T10:01:10Z | checked_in |

**Langkah:**
1. Buat sheet baru, rename ke `presence`
2. Header: `presence_id`, `user_id`, `device_id`, `course_id`, `session_id`, `qr_token`, `ts`, `status`

---

### Sheet 3: `accel`
Untuk menyimpan data accelerometer (sensor).

| device_id | ts_server | t | x | y | z |
|---|---|---|---|---|---|
| dev-001 | 2026-02-18T10:15:30Z | 2026-02-18T10:15:29.100Z | 0.12 | 0.01 | 9.70 |

**Langkah:**
1. Buat sheet baru, rename ke `accel`
2. Header: `device_id`, `ts_server`, `t`, `x`, `y`, `z`

---

### Sheet 4: `gps`
Untuk menyimpan data GPS (lokasi).

| device_id | ts | lat | lng | accuracy_m |
|---|---|---|---|---|
| dev-001 | 2026-02-18T10:15:30Z | -7.2575 | 112.7521 | 12.5 |

**Langkah:**
1. Buat sheet baru, rename ke `gps`
2. Header: `device_id`, `ts`, `lat`, `lng`, `accuracy_m`

---

## 3. Setup Apps Script

1. Di Spreadsheet Anda → **Extensions → Apps Script**
2. Hapus kode default di `Code.gs`
3. Copy-paste kode dari [backend/apps-script.gs](../backend/apps-script.gs)
4. **PENTING:** Edit baris ini dan ganti dengan ID sheets Anda:
   ```javascript
   const SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";
   ```
5. Klik **Save** (Ctrl+S)

---

## 4. Deploy Apps Script

1. Klik **Deploy** → **New deployment**
2. Setup:
   - **Type**: Web app
   - **Execute as**: Your email address
   - **Who has access**: Everyone
3. Klik **Deploy**
4. **Copy URL** yang muncul → ini adalah `{{BASE_URL}}`
5. Simpan di file terpisah atau catatan

---

## 5. Selesai! ✅

Sekarang backend sudah siap di-test. Lanjut ke [API-CONTRACT.md](./API-CONTRACT.md) untuk test endpoint-nya.

---

## 📝 Checklist

- [ ] Spreadsheet dibuat
- [ ] 4 sheet dibuat: `tokens`, `presence`, `accel`, `gps`
- [ ] Header di setiap sheet sudah benar
- [ ] `SPREADSHEET_ID` di Apps Script sudah diganti
- [ ] Apps Script ter-deploy
- [ ] Base URL tersimpan dengan aman
