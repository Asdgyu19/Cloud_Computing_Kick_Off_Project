# API Contract Simple v1 - Cloud Computing Project

**Versi**: 1.0  
**Status**: Versi A (GAS + Google Sheets)  
**Last Updated**: 2026-02-22  

---

## Format Standar Response

### ✅ Success Response
```json
{
  "ok": true,
  "data": {
    // response data di sini
  }
}
```

### ❌ Error Response
```json
{
  "ok": false,
  "error": "error_code_atau_message"
}
```

---

## Modul 1: Presensi QR Dinamis

### 1.1 Generate QR Token

**Endpoint**:
```
POST {{BASE_URL}}/presence/qr/generate
```

**Request**:
```json
{
  "course_id": "cloud-101",
  "session_id": "sesi-02",
  "ts": "2026-02-18T10:00:00Z"
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "data": {
    "qr_token": "TKN-8F2A19",
    "expires_at": "2026-02-18T10:02:00Z"
  }
}
```

**Error Cases**:
- `missing_field: course_id` - Jika course_id tidak ada
- `missing_field: session_id` - Jika session_id tidak ada

**Notes**:
- Token berlaku 2 menit
- Payload `ts` opsional, jika tidak ada menggunakan server time

---

### 1.2 Check-in (Scan QR)

**Endpoint**:
```
POST {{BASE_URL}}/presence/checkin
```

**Request**:
```json
{
  "user_id": "2023xxxx",
  "device_id": "dev-001",
  "course_id": "cloud-101",
  "session_id": "sesi-02",
  "qr_token": "TKN-8F2A19",
  "ts": "2026-02-18T10:01:10Z"
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "data": {
    "presence_id": "PR-0001",
    "status": "checked_in"
  }
}
```

**Error Cases**:
- `missing_field: user_id` - Jika user_id tidak ada
- `missing_field: device_id` - Jika device_id tidak ada
- `missing_field: course_id` - Jika course_id tidak ada
- `missing_field: session_id` - Jika session_id tidak ada
- `missing_field: qr_token` - Jika qr_token tidak ada
- `token_invalid` - Token tidak ditemukan di database
- `token_expired` - Token sudah expired
- `token_mismatch` - Course/session tidak sesuai token

**Notes**:
- `device_id` gunakan untuk multi-device detection
- `presence_id` unique identifier untuk record presensi ini

---

### 1.3 Cek Status Presensi

**Endpoint**:
```
GET {{BASE_URL}}/presence/status?user_id=2023xxxx&course_id=cloud-101&session_id=sesi-02
```

**Query Parameters**:
| Param | Required | Deskripsi |
|-------|----------|-----------|
| user_id | ✅ | User identifier |
| course_id | ✅ | Course identifier |
| session_id | ✅ | Session identifier |

**Response (Success if checked_in)**:
```json
{
  "ok": true,
  "data": {
    "user_id": "2023xxxx",
    "course_id": "cloud-101",
    "session_id": "sesi-02",
    "status": "checked_in",
    "last_ts": "2026-02-18T10:01:10Z"
  }
}
```

**Response (Success if absent)**:
```json
{
  "ok": true,
  "data": {
    "user_id": "2023xxxx",
    "course_id": "cloud-101",
    "session_id": "sesi-02",
    "status": "absent",
    "last_ts": null
  }
}
```

**Error Cases**:
- `missing_field: user_id` - Jika user_id tidak ada
- `missing_field: course_id` - Jika course_id tidak ada
- `missing_field: session_id` - Jika session_id tidak ada

---

## Modul 2: Accelerometer Telemetry

### 2.1 Kirim Data Accelerometer (Batch)

**Endpoint**:
```
POST {{BASE_URL}}/telemetry/accel
```

**Request**:
```json
{
  "device_id": "dev-001",
  "ts": "2026-02-18T10:15:30Z",
  "samples": [
    {
      "t": "2026-02-18T10:15:29.100Z",
      "x": 0.12,
      "y": 0.01,
      "z": 9.70
    },
    {
      "t": "2026-02-18T10:15:29.300Z",
      "x": 0.15,
      "y": 0.02,
      "z": 9.68
    }
  ]
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "data": {
    "accepted": 2
  }
}
```

**Error Cases**:
- `missing_field: device_id` - Jika device_id tidak ada
- `missing_field: samples` - Jika samples array kosong

**Notes**:
- Semua field `x`, `y`, `z` dalam G (gravitational acceleration)
- `t` adalah timestamp client (kapan sample diambil)
- `ts` adalah timestamp server (kapan dikirim)

---

### 2.2 Ambil Data Accelerometer Terbaru

**Endpoint**:
```
GET {{BASE_URL}}/telemetry/accel/latest?device_id=dev-001
```

**Query Parameters**:
| Param | Required | Deskripsi |
|-------|----------|-----------|
| device_id | ✅ | Device identifier |

**Response (Success)**:
```json
{
  "ok": true,
  "data": {
    "t": "2026-02-18T10:15:29.300Z",
    "x": 0.15,
    "y": 0.02,
    "z": 9.68
  }
}
```

**Error Cases**:
- `missing_field: device_id` - Jika device_id tidak ada
- `device_not_found` - Belum ada data untuk device ini

**Notes**:
- Mengembalikan sample terakhir yang dikirim
- Gunakan untuk update real-time di client

---

## Modul 3: GPS Tracking + Peta

### 3.1 Log GPS Point

**Endpoint**:
```
POST {{BASE_URL}}/telemetry/gps
```

**Request**:
```json
{
  "device_id": "dev-001",
  "ts": "2026-02-18T10:15:30Z",
  "lat": -7.2575,
  "lng": 112.7521,
  "accuracy_m": 12.5
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "data": {
    "accepted": true
  }
}
```

**Error Cases**:
- `missing_field: device_id` - Jika device_id tidak ada
- `missing_field: lat` - Jika latitude tidak ada
- `missing_field: lng` - Jika longitude tidak ada

**Notes**:
- Latitude & longitude menggunakan format WGS84 (standar GPS)
- `accuracy_m` dalam meter (opsional, default 0)
- Timestamp dalam ISO-8601

---

### 3.2 Ambil GPS Terbaru (untuk Marker Peta)

**Endpoint**:
```
GET {{BASE_URL}}/telemetry/gps/latest?device_id=dev-001
```

**Query Parameters**:
| Param | Required | Deskripsi |
|-------|----------|-----------|
| device_id | ✅ | Device identifier |

**Response (Success)**:
```json
{
  "ok": true,
  "data": {
    "ts": "2026-02-18T10:15:30Z",
    "lat": -7.2575,
    "lng": 112.7521,
    "accuracy_m": 12.5
  }
}
```

**Error Cases**:
- `missing_field: device_id` - Jika device_id tidak ada
- `device_not_found` - Belum ada GPS data untuk device ini

**Notes**:
- Gunakan untuk menampilkan marker di peta
- Merupakan posisi terbaru device

---

### 3.3 Ambil GPS History (untuk Polyline Peta)

**Endpoint**:
```
GET {{BASE_URL}}/telemetry/gps/history?device_id=dev-001&limit=200
```

**Query Parameters**:
| Param | Required | Default | Deskripsi |
|-------|----------|---------|-----------|
| device_id | ✅ | - | Device identifier |
| limit | ❌ | 200 | Jumlah maksimal points |

**Response (Success)**:
```json
{
  "ok": true,
  "data": {
    "device_id": "dev-001",
    "items": [
      {
        "ts": "2026-02-18T10:15:00Z",
        "lat": -7.2570,
        "lng": 112.7515
      },
      {
        "ts": "2026-02-18T10:15:10Z",
        "lat": -7.2572,
        "lng": 112.7518
      },
      {
        "ts": "2026-02-18T10:15:30Z",
        "lat": -7.2575,
        "lng": 112.7521
      }
    ]
  }
}
```

**Error Cases**:
- `missing_field: device_id` - Jika device_id tidak ada
- `device_not_found` - Belum ada GPS data untuk device ini

**Notes**:
- `items` array berisi history dari yang terlama ke terbaru
- Gunakan untuk menggambar polyline di peta
- `limit` parameter gunakan untuk batasi jumlah points (performa peta)

---

## Error Code Reference

| Error Code | HTTP Status | Deskripsi |
|-----------|----------|-----------|
| missing_field: * | 400 | Required field tidak ada |
| token_invalid | 401 | QR token tidak valid |
| token_expired | 401 | QR token sudah expired |
| token_mismatch | 401 | Token course/session tidak match |
| device_not_found | 404 | Device belum punya data |
| unknown_endpoint | 404 | Endpoint tidak ada |

---

## Timestamp Format

Semua timestamp menggunakan **ISO-8601** format:
```
2026-02-18T10:15:30Z
```

Breakdown:
- `2026-02-18` = YYYY-MM-DD
- `T` = Separator
- `10:15:30` = HH:MM:SS
- `Z` = UTC timezone

---

## Testing Checklist

### Presensi QR
- [ ] POST /presence/qr/generate → Generate token berhasil
- [ ] POST /presence/checkin → Check-in berhasil, presence_id unik
- [ ] GET /presence/status → Return checked_in setelah checkin
- [ ] GET /presence/status → Return absent jika belum checkin
- [ ] POST /presence/checkin dengan token expired → Error token_expired

### Accelerometer
- [ ] POST /telemetry/accel → Batch diterima
- [ ] GET /telemetry/accel/latest → Return data terbaru
- [ ] GET /telemetry/accel/latest → Data updated setelah POST baru

### GPS
- [ ] POST /telemetry/gps → GPS point tersimpan
- [ ] GET /telemetry/gps/latest → Return data terbaru
- [ ] GET /telemetry/gps/history → Return array points (oldest → newest)
- [ ] GET /telemetry/gps/history?limit=10 → Limit works

---

**Versi A** ✅ Selesai! Siap untuk **Versi B (Firebase)** 🚀
