

const API_BASE = 'https://script.google.com/macros/s/AKfycbyHS84TjZWi1S1d-qK6SHawbYFlQENIrKh7mG5TbZbJs-hgebyqvrYXhvjn6E7QPqSY7A/exec';
const DEVICE_ID = 'dev-001';

// ===== Kirim Data Accelerometer =====
async function sendAccelData(x, y, z) {
  const payload = {
    device_id: DEVICE_ID,
    ts: new Date().toISOString(),
    samples: [{
      t: new Date().toISOString(),
      x: x,
      y: y,
      z: z
    }]
  };
  
  try {
    const response = await fetch(API_BASE + '?action=telemetry/accel', {
      method: 'POST',
      payload: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Accel response:', data);
    return data;
  } catch (error) {
    console.error('Error sending accel:', error);
  }
}

// ===== Ambil Data Accelerometer Terbaru =====
async function getLatestAccel() {
  try {
    const response = await fetch(
      API_BASE + '?action=telemetry/accel/latest&device_id=' + DEVICE_ID
    );
    const data = await response.json();
    console.log('Latest accel:', data.data);
    return data;
  } catch (error) {
    console.error('Error fetching accel:', error);
  }
}

// ===== Kirim Data GPS =====
async function sendGpsData(lat, lng, accuracy) {
  const payload = {
    device_id: DEVICE_ID,
    ts: new Date().toISOString(),
    lat: lat,
    lng: lng,
    accuracy_m: accuracy
  };
  
  try {
    const response = await fetch(API_BASE + '?action=telemetry/gps', {
      method: 'POST',
      payload: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('GPS response:', data);
    return data;
  } catch (error) {
    console.error('Error sending GPS:', error);
  }
}

// ===== Ambil GPS Terbaru =====
async function getLatestGps() {
  try {
    const response = await fetch(
      API_BASE + '?action=telemetry/gps/latest?device_id=' + DEVICE_ID
    );
    const data = await response.json();
    console.log('Latest GPS:', data.data);
    return data;
  } catch (error) {
    console.error('Error fetching GPS:', error);
  }
}

// ===== Ambil GPS History untuk Polyline =====
async function getGpsHistory(limit = 200) {
  try {
    const response = await fetch(
      API_BASE + '?action=telemetry/gps/history&device_id=' + DEVICE_ID + '&limit=' + limit
    );
    const data = await response.json();
    console.log('GPS History:', data.data.items);
    return data;
  } catch (error) {
    console.error('Error fetching GPS history:', error);
  }
}

// ===== Simulasi Accelerometer Realtime =====
function startAccelSimulation(intervalMs = 1000) {
  return setInterval(() => {
    // Simulasi data accelerometer dengan noise
    const x = Math.random() * 0.3 - 0.15;
    const y = Math.random() * 0.3 - 0.15;
    const z = 9.8 + Math.random() * 0.1 - 0.05;
    
    sendAccelData(x, y, z);
  }, intervalMs);
}

// ===== Simulasi GPS Realtime =====
function startGpsSimulation(intervalMs = 5000) {
  let lat = -7.2575;
  let lng = 112.7521;
  
  return setInterval(() => {
    // Simulasi pergerakan GPS
    lat += (Math.random() - 0.5) * 0.0005;
    lng += (Math.random() - 0.5) * 0.0005;
    
    sendGpsData(lat, lng, Math.random() * 20 + 5);
  }, intervalMs);
}

// Contoh penggunaan:
// sendAccelData(0.12, 0.01, 9.70);
// getLatestAccel();
// sendGpsData(-7.2575, 112.7521, 12.5);
// getLatestGps();
// getGpsHistory(50);


// ===== MODUL 1: PRESENSI QR DINAMIS =====

// Admin/Dosen: Generate QR Token
async function generateQrToken(courseId, sessionId) {
  const payload = {
    course_id: courseId,
    session_id: sessionId,
    ts: new Date().toISOString()
  };
  
  try {
    const response = await fetch(API_BASE + '?action=presence/qr/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('QR Generated:', data.data.qr_token);
    return data;
  } catch (error) {
    console.error('Error generating QR:', error);
  }
}

// Mahasiswa: Check-in dengan QR Token yang sudah di-scan
async function checkinWithQr(userId, deviceId, courseId, sessionId, qrToken) {
  const payload = {
    user_id: userId,
    device_id: deviceId,
    course_id: courseId,
    session_id: sessionId,
    qr_token: qrToken,
    ts: new Date().toISOString()
  };
  
  try {
    const response = await fetch(API_BASE + '?action=presence/checkin', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Check-in response:', data);
    return data;
  } catch (error) {
    console.error('Error checking in:', error);
  }
}

// Dosen: Cek status presensi
async function getPresenceStatus(userId, courseId, sessionId) {
  try {
    const response = await fetch(
      API_BASE + `?action=presence/status&user_id=${userId}&course_id=${courseId}&session_id=${sessionId}`
    );
    const data = await response.json();
    console.log('Presence status:', data.data);
    return data;
  } catch (error) {
    console.error('Error fetching presence status:', error);
  }
}

// Contoh penggunaan Presensi:
// generateQrToken('cloud-101', 'sesi-02');
// checkinWithQr('2023xxxx', 'dev-001', 'cloud-101', 'sesi-02', 'TKN-ABC123');
// getPresenceStatus('2023xxxx', 'cloud-101', 'sesi-02');


// ========================================
// 2. PYTHON CLIENT
// ========================================

/*
import requests
import json
from datetime import datetime
import time

API_BASE = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
DEVICE_ID = 'dev-001'

class TelemetryClient:
    def __init__(self, base_url, device_id):
        self.base_url = base_url
        self.device_id = device_id
    
    def send_accel(self, x, y, z):
        '''Kirim data accelerometer'''
        payload = {
            'device_id': self.device_id,
            'ts': datetime.utcnow().isoformat() + 'Z',
            'samples': [{
                't': datetime.utcnow().isoformat() + 'Z',
                'x': x,
                'y': y,
                'z': z
            }]
        }
        
        response = requests.post(
            f'{self.base_url}?action=telemetry/accel',
            json=payload
        )
        return response.json()
    
    def get_latest_accel(self):
        '''Ambil data accelerometer terbaru'''
        response = requests.get(
            f'{self.base_url}?action=telemetry/accel/latest&device_id={self.device_id}'
        )
        return response.json()
    
    def send_gps(self, lat, lng, accuracy_m=None):
        '''Kirim data GPS'''
        payload = {
            'device_id': self.device_id,
            'ts': datetime.utcnow().isoformat() + 'Z',
            'lat': lat,
            'lng': lng,
            'accuracy_m': accuracy_m
        }
        
        response = requests.post(
            f'{self.base_url}?action=telemetry/gps',
            json=payload
        )
        return response.json()
    
    def get_latest_gps(self):
        '''Ambil data GPS terbaru'''
        response = requests.get(
            f'{self.base_url}?action=telemetry/gps/latest?device_id={self.device_id}'
        )
        return response.json()
    
    def get_gps_history(self, limit=200):
        '''Ambil riwayat GPS'''
        response = requests.get(
            f'{self.base_url}?action=telemetry/gps/history&device_id={self.device_id}&limit={limit}'
        )
        return response.json()
    
    def generate_qr_token(self, course_id, session_id):
        '''Generate QR Token untuk presensi'''
        payload = {
            'course_id': course_id,
            'session_id': session_id,
            'ts': datetime.utcnow().isoformat() + 'Z'
        }
        
        response = requests.post(
            f'{self.base_url}?action=presence/qr/generate',
            json=payload
        )
        return response.json()
    
    def checkin_presence(self, user_id, course_id, session_id, qr_token):
        '''Check-in dengan QR Token'''
        payload = {
            'user_id': user_id,
            'device_id': self.device_id,
            'course_id': course_id,
            'session_id': session_id,
            'qr_token': qr_token,
            'ts': datetime.utcnow().isoformat() + 'Z'
        }
        
        response = requests.post(
            f'{self.base_url}?action=presence/checkin',
            json=payload
        )
        return response.json()
    
    def get_presence_status(self, user_id, course_id, session_id):
        '''Cek status presensi'''
        response = requests.get(
            f'{self.base_url}?action=presence/status&user_id={user_id}&course_id={course_id}&session_id={session_id}'
        )
        return response.json()

# Penggunaan:
client = TelemetryClient(API_BASE, DEVICE_ID)

# Kirim accel
result = client.send_accel(0.12, 0.01, 9.70)
print(result)

# Ambil accel terbaru
result = client.get_latest_accel()
print(result)

# Kirim GPS
result = client.send_gps(-7.2575, 112.7521, 12.5)
print(result)

# Ambil GPS terbaru
result = client.get_latest_gps()
print(result)

# Ambil GPS history
result = client.get_gps_history(50)
print(result)

# Presensi QR
# Generate token (admin/dosen)
result = client.generate_qr_token('cloud-101', 'sesi-02')
qr_token = result['data']['qr_token']
print(f"QR Token: {qr_token}")

# Check-in (mahasiswa)
result = client.checkin_presence('2023xxxx', 'cloud-101', 'sesi-02', qr_token)
print(result)

# Get status (dosen)
result = client.get_presence_status('2023xxxx', 'cloud-101', 'sesi-02')
print(result)


// ========================================
// 3. cURL / BASH EXAMPLES
// ========================================

/*
# Ganti dengan deployment ID kamu
DEPLOYMENT_ID='YOUR_DEPLOYMENT_ID'
BASE_URL="https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec"
DEVICE_ID='dev-001'

# 1. Kirim Accelerometer Data
curl -X POST "${BASE_URL}?action=telemetry/accel" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "'${DEVICE_ID}'",
    "ts": "2026-02-23T10:15:30Z",
    "samples": [{
      "t": "2026-02-23T10:15:29.100Z",
      "x": 0.12,
      "y": 0.01,
      "z": 9.70
    }]
  }'

# 2. Ambil Accel Terbaru
curl -X GET "${BASE_URL}?action=telemetry/accel/latest&device_id=${DEVICE_ID}"

# 3. Kirim GPS Data
curl -X POST "${BASE_URL}?action=telemetry/gps" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "'${DEVICE_ID}'",
    "ts": "2026-02-23T10:15:30Z",
    "lat": -7.2575,
    "lng": 112.7521,
    "accuracy_m": 12.5
  }'

# 4. Ambil GPS Terbaru
curl -X GET "${BASE_URL}?action=telemetry/gps/latest?device_id=${DEVICE_ID}"

# 5. Ambil GPS History
curl -X GET "${BASE_URL}?action=telemetry/gps/history?device_id=${DEVICE_ID}&limit=50"

# ===== PRESENSI QR =====

# 6. Generate QR Token (Admin/Dosen)
curl -X POST "${BASE_URL}?action=presence/qr/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "cloud-101",
    "session_id": "sesi-02",
    "ts": "2026-02-23T10:15:30Z"
  }'

# Simpan QR_TOKEN dari response di atas

# 7. Check-in dengan QR (Mahasiswa)
curl -X POST "${BASE_URL}?action=presence/checkin" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "2023xxxx",
    "device_id": "'${DEVICE_ID}'",
    "course_id": "cloud-101",
    "session_id": "sesi-02",
    "qr_token": "TKN-XXXXXX",
    "ts": "2026-02-23T10:15:30Z"
  }'

# 8. Cek Status Presensi (Dosen)
curl -X GET "${BASE_URL}?action=presence/status&user_id=2023xxxx&course_id=cloud-101&session_id=sesi-02"


// ========================================
// 4. KOTLIN / ANDROID CLIENT
// ========================================

/*
// Di build.gradle tambahkan:
// implementation 'com.squareup.okhttp3:okhttp:4.9.1'
// implementation 'com.google.code.gson:gson:2.8.9'

import okhttp3.*
import com.google.gson.Gson
import java.text.SimpleDateFormat
import java.util.*

class TelemetryClient(val deviceId: String, val deploymentId: String) {
    
    private val baseUrl = "https://script.google.com/macros/s/$deploymentId/exec"
    private val client = OkHttpClient()
    private val gson = Gson()
    
    fun sendAccelerometerData(x: Float, y: Float, z: Float, callback: (Boolean) -> Unit) {
        val payload = mapOf(
            "device_id" to deviceId,
            "ts" to getCurrentTimestamp(),
            "samples" to listOf(
                mapOf(
                    "t" to getCurrentTimestamp(),
                    "x" to x,
                    "y" to y,
                    "z" to z
                )
            )
        )
        
        val jsonPayload = gson.toJson(payload)
        val requestBody = RequestBody.create(MediaType.parse("application/json"), jsonPayload)
        
        val request = Request.Builder()
            .url("$baseUrl?action=telemetry/accel")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                val success = response.isSuccessful
                callback(success)
                response.close()
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(false)
                e.printStackTrace()
            }
        })
    }
    
    fun sendGpsData(lat: Double, lng: Double, accuracy: Float, callback: (Boolean) -> Unit) {
        val payload = mapOf(
            "device_id" to deviceId,
            "ts" to getCurrentTimestamp(),
            "lat" to lat,
            "lng" to lng,
            "accuracy_m" to accuracy
        )
        
        val jsonPayload = gson.toJson(payload)
        val requestBody = RequestBody.create(MediaType.parse("application/json"), jsonPayload)
        
        val request = Request.Builder()
            .url("$baseUrl?action=telemetry/gps")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                val success = response.isSuccessful
                callback(success)
                response.close()
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(false)
                e.printStackTrace()
            }
        })
    }
    
    fun getLatestGps(callback: (Map<String, Any>?) -> Unit) {
        val request = Request.Builder()
            .url("$baseUrl?action=telemetry/gps/latest&device_id=$deviceId")
            .get()
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    val jsonStr = response.body?.string()
                    val data = gson.fromJson(jsonStr, Map::class.java)
                    callback(data)
                } else {
                    callback(null)
                }
                response.close()
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
                e.printStackTrace()
            }
        })
    }
    
    fun getGpsHistory(limit: Int = 200, callback: (List<Map<String, Any>>?) -> Unit) {
        val request = Request.Builder()
            .url("$baseUrl?action=telemetry/gps/history&device_id=$deviceId&limit=$limit")
            .get()
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    val jsonStr = response.body?.string()
                    val data = gson.fromJson(jsonStr, Map::class.java)
                    // Extract items dari response
                    callback(null)
                } else {
                    callback(null)
                }
                response.close()
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
                e.printStackTrace()
            }
        })
    }
    
    fun generateQrToken(courseId: String, sessionId: String, callback: (String?) -> Unit) {
        val payload = mapOf(
            "course_id" to courseId,
            "session_id" to sessionId,
            "ts" to getCurrentTimestamp()
        )
        
        val jsonPayload = gson.toJson(payload)
        val requestBody = RequestBody.create(MediaType.parse("application/json"), jsonPayload)
        
        val request = Request.Builder()
            .url("$baseUrl?action=presence/qr/generate")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    val jsonStr = response.body?.string()
                    val data = gson.fromJson(jsonStr, Map::class.java)
                    // Extract qr_token dari response
                    callback(null)
                } else {
                    callback(null)
                }
                response.close()
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
                e.printStackTrace()
            }
        })
    }
    
    fun checkinPresence(userId: String, courseId: String, sessionId: String, qrToken: String, callback: (Boolean) -> Unit) {
        val payload = mapOf(
            "user_id" to userId,
            "device_id" to deviceId,
            "course_id" to courseId,
            "session_id" to sessionId,
            "qr_token" to qrToken,
            "ts" to getCurrentTimestamp()
        )
        
        val jsonPayload = gson.toJson(payload)
        val requestBody = RequestBody.create(MediaType.parse("application/json"), jsonPayload)
        
        val request = Request.Builder()
            .url("$baseUrl?action=presence/checkin")
            .post(requestBody)
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                callback(response.isSuccessful)
                response.close()
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(false)
                e.printStackTrace()
            }
        })
    }
    
    fun getPresenceStatus(userId: String, courseId: String, sessionId: String, callback: (Map<String, Any>?) -> Unit) {
        val request = Request.Builder()
            .url("$baseUrl?action=presence/status&user_id=$userId&course_id=$courseId&session_id=$sessionId")
            .get()
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    val jsonStr = response.body?.string()
                    val data = gson.fromJson(jsonStr, Map::class.java)
                    callback(data)
                } else {
                    callback(null)
                }
                response.close()
            }
            
            override fun onFailure(call: Call, e: IOException) {
                callback(null)
                e.printStackTrace()
            }
        })
    }
    
    private fun getCurrentTimestamp(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }
}

// Penggunaan:
val telemetry = TelemetryClient("dev-001", "YOUR_DEPLOYMENT_ID")

// Kirim accelerometer
telemetry.sendAccelerometerData(0.12f, 0.01f, 9.70f) { success ->
    println("Accel sent: $success")
}

// Kirim GPS
telemetry.sendGpsData(-7.2575, 112.7521, 12.5f) { success ->
    println("GPS sent: $success")
}

// Ambil GPS terakhir
telemetry.getLatestGps { data ->
    println("Latest GPS: $data")
}

// Ambil GPS history
telemetry.getGpsHistory(50) { items ->
    println("GPS History: $items")
}

// Presensi QR
// Generate token (Admin)
telemetry.generateQrToken("cloud-101", "sesi-02") { token ->
    println("QR Token: $token")
    
    // Check-in (Mahasiswa)
    if (token != null) {
        telemetry.checkinPresence("2023xxxx", "cloud-101", "sesi-02", token) { success ->
            println("Check-in: $success")
        }
    }
}

// Get status (Dosen)
telemetry.getPresenceStatus("2023xxxx", "cloud-101", "sesi-02") { data ->
    println("Presence Status: $data")
}
*/

// ========================================
// CATATAN PENTING
// ========================================

/*
1. GANTI YOUR_DEPLOYMENT_ID di semua contoh dengan:
   https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
   
   DEPLOYMENT_ID didapat dari step deploy di Google Apps Script

2. DEVICE_ID bisa disesuaikan sesuai kebutuhan:
   - dev-001, dev-002, smartphone-1, etc

3. TIMESTAMP harus dalam format ISO 8601:
   - 2026-02-23T10:15:30Z
   - 2026-02-23T10:15:29.100Z

4. Untuk real-time data:
   - Accelerometer: kirim setiap 100-1000ms
   - GPS: kirim setiap 5-10 detik

5. Testing dengan Postman:
   - Import sebagai raw JSON body
   - Set Content-Type: application/json
   - Pastikan URL lengkap dengan parameter action

6. Rate limiting:
   - Google Apps Script: ~6 request/second per user
   - Untuk production, pertimbangkan caching & batching
*/
