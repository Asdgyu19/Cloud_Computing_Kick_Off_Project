# 📚 Setup Step-by-Step Guide

Ikuti langkah-langkah ini dengan teliti untuk setup Backend (Versi A) dengan Google Apps Script.

---

## ✅ Step 1: Persiapan Awal

### 1.1 Periksa Syarat
- ✅ Punya akun Google (Gmail)
- ✅ Punya akses ke Google Sheets dan Google Apps Script
- ✅ Browser modern (Chrome, Firefox, Edge)
- ✅ Clone/Download project ini

### 1.2 Pahami Struktur Project
```
Cloud_Computing_Kick_Off_Project/
├── README.md                    # Overview project
├── STEP-BY-STEP.md             # File ini
├── docs/
│   ├── SHEETS-SETUP.md         # Panduan buat sheets
│   ├── API-CONTRACT.md         # Dokumentasi API
├── backend/
│   └── apps-script.gs          # Kode backend (main)
├── client/
│   └── index.html              # Test client
└── postman/
    └── Cloud-Computing-v1.postman_collection.json
```

---

## ✅ Step 2: Buat Google Spreadsheet

Durasi: **5 menit**

### 2.1 Buat Sheet Baru
1. Buka [Google Sheets](https://sheets.google.com)
2. Klik **+ Blank** (buat sheet baru)
3. Rename nama sheet:
   - Klik nama otomatis di atas (kiri atas)
   - Ketik: `Cloud-Computing-Backend`
   - Press Enter

### 2.2 Catat Spreadsheet ID
1. Lihat URL di browser:
   ```
   https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
   ```
2. ID adalah bagian ini: `1a2b3c4d5e6f7g8h9i0j`
3. **CATAT ID INI!** (akan dipakai nanti)

### 2.3 Buat 4 Sheet Baru

**Di setiap step, klik `+` di bawah → Pilih "Blank"**

#### Sheet 1: `tokens`
- Buat sheet baru, rename ke `tokens`
- Copy header ke baris 1:
  ```
  qr_token    course_id    session_id    created_at    expires_at    status
  ```
- Format: 6 kolom (A-F)

#### Sheet 2: `presence`
- Buat sheet baru, rename ke `presence`
- Copy header ke baris 1:
  ```
  presence_id    user_id    device_id    course_id    session_id    qr_token    ts    status
  ```
- Format: 8 kolom (A-H)

#### Sheet 3: `accel`
- Buat sheet baru, rename ke `accel`
- Copy header ke baris 1:
  ```
  device_id    ts_server    t    x    y    z
  ```
- Format: 6 kolom (A-F)

#### Sheet 4: `gps`
- Buat sheet baru, rename ke `gps`
- Copy header ke baris 1:
  ```
  device_id    ts    lat    lng    accuracy_m
  ```
- Format: 5 kolom (A-E)

**Sekarang sheets sudah siap!** ✅

---

## ✅ Step 3: Setup Google Apps Script

Durasi: **10 menit**

### 3.1 Buka Apps Script Editor
1. Di spreadsheet Anda → **Extensions → Apps Script**
2. Tab baru akan terbuka
3. Di sidebar kiri, klik tab **`Code.gs`**

### 3.2 Copy-Paste Backend Code
1. **Hapus semua** kode default di `Code.gs`
2. Buka file [backend/apps-script.gs](../backend/apps-script.gs)
3. Copy **SEMUA** kode
4. Paste ke `Code.gs`
5. **CTRL+S** (Save)

### 3.3 Ganti Spreadsheet ID
1. Cari baris ini (baris 7-9):
   ```javascript
   // ============ CONFIG ============
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
   ```
2. Ganti `"YOUR_SPREADSHEET_ID"` dengan ID Anda (dari Step 2.2)
   ```javascript
   const SPREADSHEET_ID = "1a2b3c4d5e6f7g8h9i0j";
   ```
3. **CTRL+S** (Save)

**Kode Apps Script sudah ready!** ✅

---

## ✅ Step 4: Deploy Apps Script

Durasi: **5 menit**

### 4.1 Deploy Web App
1. Di Apps Script editor, klik **Deploy** (tombol biru di atas)
2. Pilih **New deployment**
3. Setup configuration:
   - **Type**: Pilih "Web app"
   - **Execute as**: Pilih email Anda (Gmail)
   - **Who has access**: Pilih "Everyone"
4. Klik **Deploy** (tombol biru)

### 4.2 Copy URL Deployment
1. Pop-up window akan muncul
2. Klik **Copy** (biru) untuk copy URL
3. **CATAT URL INI!** Ini adalah `BASE_URL`:
   ```
   https://script.google.com/macros/s/AKfycbz...xxxxxxx.../exec
   ```
4. Close pop-up

**URL deployment sudah siap!** ✅

---

## ✅ Step 5: Test Backend

Durasi: **10 menit**

### 5.1 Test dengan Client HTML
1. Buka file [client/index.html](../client/index.html) di browser
2. Di bagian **Konfigurasi**, isi **Base URL**:
   ```
   https://script.google.com/macros/s/AKfycbz...xxxxxxx.../exec
   ```
3. Klik tombol dibawah untuk test setiap endpoint

### 5.2 Test Modul 1: Presensi QR
**A. Generate QR Token**
- Isi: Course ID: `cloud-101`, Session ID: `sesi-02`
- Klik **Generate QR Token**
- ✅ Harus muncul token dan QR code

**B. Check-in**
- Token otomatis terisi dari step sebelumnya
- Isi: User ID: `2023001`, Device ID: `dev-001`
- Klik **Check-in**
- ✅ Harus return `presence_id` dan status `checked_in`

**C. Cek Status**
- Isi: User ID: `2023001`, Course ID: `cloud-101`, Session ID: `sesi-02`
- Klik **Cek Status**
- ✅ Harus return status `checked_in`

### 5.3 Test Modul 2: Accelerometer
**A. Kirim Data**
- Isi: Device ID: `dev-001`, X: `0.12`, Y: `0.01`, Z: `9.70`
- Klik **Kirim Data Accelerometer**
- ✅ Harus return `accepted: 2` (atau 1)

**B. Ambil Terbaru**
- Isi: Device ID: `dev-001`
- Klik **Ambil Data Terbaru**
- ✅ Harus return data x, y, z terbaru

### 5.4 Test Modul 3: GPS
**A. Log GPS Point**
- Isi: Device ID: `dev-001`, Lat: `-7.2575`, Lng: `112.7521`
- Klik **Log GPS Point**
- ✅ Harus return `accepted: true`

**B. Ambil GPS Terbaru**
- Isi: Device ID: `dev-001`
- Klik **Ambil GPS Terbaru**
- ✅ Harus return data lat, lng terbaru

**C. Ambil GPS History**
- Isi: Device ID: `dev-001`, Limit: `200`
- Klik **Ambil GPS History**
- ✅ Harus return array of points

---

## ✅ Step 6: Test dengan Postman (Opsional tapi Recommended)

Durasi: **10 menit**

### 6.1 Install Postman
- Download dari [postman.com](https://www.postman.com/downloads/)
- Install dan buka

### 6.2 Import Collection
1. Klik **File → Import**
2. Cari file: [postman/Cloud-Computing-v1.postman_collection.json](../postman/Cloud-Computing-v1.postman_collection.json)
3. Klik **Import**
4. Collection akan muncul di sidebar kiri

### 6.3 Setup Environment Variable
1. Klik **Environment** (di sidebar kanan)
2. Klik **+** untuk buat environment baru
3. Beri nama: `Prod`
4. Tambah variable:
   - **Name**: `BASE_URL`
   - **Value**: `https://script.google.com/macros/s/AKfycbz.../exec`
5. Klik **Save**

### 6.4 Run Request
1. Pilih environment `Prod` di atas
2. Buka folder **1. Presensi QR → Generate QR Token**
3. Klik **Send**
4. Response akan muncul di bawah
5. ✅ Harus return `ok: true` dengan `qr_token`

---

## ✅ Step 7: Cek Sheets (Verify Data)

Durasi: **3 menit**

### 7.1 Check Data Tersimpan
1. Kembali ke Spreadsheet Anda
2. Klik sheet **`tokens`** → Harus ada 1 baris data
3. Klik sheet **`presence`** → Harus ada 1 baris data
4. Klik sheet **`accel`** → Harus ada 1-2 baris data
5. Klik sheet **`gps`** → Harus ada 1 baris data

✅ **Semua data tersimpan dengan baik!**

---

## ✅ Step 8: Ready untuk Kelompok!

**Backend Versi A SELESAI!** 🎉

### Siapa yang bisa mulai sekarang:
1. **Backend Dev**: Bisa mulai refine code atau bikin feature tambahan
2. **Client Dev**: Bisa mulai bikin frontend (Web/Mobile) pakai API ini
3. **QA**: Bisa mulai test dengan Postman

### Next Step:
- [ ] Bagikan `BASE_URL` ke seluruh kelompok
- [ ] Bagikan [API-CONTRACT.md](./API-CONTRACT.md) untuk dokumentasi
- [ ] Kelompok lain bisa test API Anda (swap test)
- [ ] BikinClient/Frontend yang consume API ini
- [ ] (Bonus) Upgrade ke Versi B dengan Firebase

---

## 🆘 Troubleshooting

### Error: "Cannot find property SPREADSHEET_ID"
- ✅ Pastikan `SPREADSHEET_ID` di `apps-script.gs` sudah diganti dengan ID sheets Anda
- ✅ ID harus di dalam quotes: `"1a2b3c4d5e6f7g8h9i0j"`

### Error: "Sheet not found"
- ✅ Pastikan semua 4 sheet (`tokens`, `presence`, `accel`, `gps`) sudah dibuat
- ✅ Nama sheet harus **exactly sama** (case-sensitive)

### Error: "Cannot read property '0' of undefined"
- ✅ Pastikan header sudah ada di baris 1 setiap sheet
- ✅ Header harus sesuai dengan yang di dokumentasi

### Endpoint return 404
- ✅ Pastikan URL deployment benar (copy murni dari Apps Script)
- ✅ Coba refresh page atau clear browser cache
- ✅ Re-deploy Apps Script jika perlu

### Test Client tidak connect
- ✅ Pastikan Base URL di-paste dengan benar di Client HTML
- ✅ Check browser console (F12) untuk error detail

---

## 📌 Checklist Sebelum Kirim Kelompok

- [ ] 4 Sheets dibuat dan header sudah benar
- [ ] `SPREADSHEET_ID` di `apps-script.gs` sudah diganti
- [ ] Apps Script ter-deploy
- [ ] Test semua 9 endpoint → semua return `ok: true`
- [ ] Data tersimpan di Sheets (verify manual)
- [ ] `BASE_URL` dicatat dan dibagikan
- [ ] [API-CONTRACT.md](./API-CONTRACT.md) sudah di-share
- [ ] Client di-test mencoba call API Anda

---

**Selamat! Backend Versi A Anda sudah siap untuk diproduksi!** 🚀
