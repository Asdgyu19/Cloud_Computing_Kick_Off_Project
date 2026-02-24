// ========================================
// GOOGLE APPS SCRIPT BACKEND - COMPLETE
// Modul 2: Accelerometer + Modul 3: GPS
// ========================================

// ===== KONFIGURASI AWAL =====
const SPREADSHEET_ID = 'GANTI_DENGAN_SPREADSHEET_ID_KAMU'; // Ganti dengan ID spreadsheet kamu

function doPost(e) {
  try {
    const path = e.parameter.action || '';
    const payload = JSON.parse(e.postData.contents);
    
    if (path === 'telemetry/accel') {
      return handleAccelerometerPost(payload);
    } else if (path === 'telemetry/gps') {
      return handleGpsPost(payload);
    } else if (path === 'presence/qr/generate') {
      return handlePresenceQrGenerate(payload);
    } else if (path === 'presence/checkin') {
      return handlePresenceCheckin(payload);
    } else if (path === 'presence/checkin_mobile') {
      return handlePresenceCheckinMobile(payload);
    }
    
    return responseError('Unknown endpoint');
  } catch (error) {
    return responseError(error.toString());
  }
}

function doGet(e) {
  try {
    
    const path = e.parameter.action || '';
    
    if (path === 'telemetry/accel/latest') {
      const deviceId = e.parameter.device_id;
      return handleAccelerometerLatest(deviceId);
    } else if (path === 'telemetry/gps/latest') {
      const deviceId = e.parameter.device_id;
      return handleGpsLatest(deviceId);
    } else if (path === 'telemetry/gps/history') {
      const deviceId = e.parameter.device_id;
      const limit = parseInt(e.parameter.limit) || 200;
      return handleGpsHistory(deviceId, limit);
    } else if (path === 'presence/status') {
      const userId = e.parameter.user_id;
      const courseId = e.parameter.course_id;
      const sessionId = e.parameter.session_id;
      return handlePresenceStatus(userId, courseId, sessionId);
    } else if (path === 'html') {
      return HtmlService.createHtmlOutput(getHtmlDashboard());
    }
    
    return responseError('Unknown endpoint');
  } catch (error) {
    return responseError(error.toString());
  }
}

// ===== ACCELEROMETER HANDLERS =====

function handleAccelerometerPost(payload) {
  const { device_id, ts, samples } = payload;
  
  if (!device_id || !samples || !Array.isArray(samples)) {
    return responseError('Missing device_id or samples');
  }
  
  const sheet = getOrCreateSheet('Accelerometer');
  let accepted = 0;
  
  samples.forEach(sample => {
    const { t, x, y, z } = sample;
    sheet.appendRow([device_id, ts, t, x, y, z, new Date()]);
    accepted++;
  });
  
  return responseSuccess({
    accepted: accepted
  });
}

function handleAccelerometerLatest(deviceId) {
  const sheet = getOrCreateSheet('Accelerometer');
  const data = sheet.getDataRange().getValues();
  
  // Cari baris terakhir untuk device ini
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === deviceId) {
      return responseSuccess({
        t: data[i][2],
        x: data[i][3],
        y: data[i][4],
        z: data[i][5]
      });
    }
  }
  
  return responseError('No data found for device');
}

// ===== GPS HANDLERS =====

function handleGpsPost(payload) {
  const { device_id, ts, lat, lng, accuracy_m } = payload;
  
  if (!device_id || lat === undefined || lng === undefined || !ts) {
    return responseError('Missing device_id, ts, lat, or lng');
  }
  
  const sheet = getOrCreateSheet('GPS');
  sheet.appendRow([device_id, ts, lat, lng, accuracy_m || null, new Date()]);
  
  return responseSuccess({
    accepted: true
  });
}

function handleGpsLatest(deviceId) {
  const sheet = getOrCreateSheet('GPS');
  const data = sheet.getDataRange().getValues();
  
  // Cari baris terakhir untuk device ini
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === deviceId) {
      return responseSuccess({
        ts: data[i][1],
        lat: parseFloat(data[i][2]),
        lng: parseFloat(data[i][3]),
        accuracy_m: data[i][4] ? parseFloat(data[i][4]) : null
      });
    }
  }
  
  return responseError('No GPS data found for device');
}

function handleGpsHistory(deviceId, limit) {
  const sheet = getOrCreateSheet('GPS');
  const data = sheet.getDataRange().getValues();
  
  const items = [];
  for (let i = data.length - 1; i >= 1 && items.length < limit; i--) {
    if (data[i][0] === deviceId) {
      items.unshift({
        ts: data[i][1],
        lat: parseFloat(data[i][2]),
        lng: parseFloat(data[i][3]),
        accuracy_m: data[i][4] ? parseFloat(data[i][4]) : null
      });
    }
  }
  
  return responseSuccess({
    device_id: deviceId,
    items: items
  });
}

// ===== PRESENCE HANDLERS =====

function handlePresenceQrGenerate(payload) {
  const { course_id, session_id, ts } = payload;
  
  if (!course_id || !session_id || !ts) {
    return responseError('missing_field: course_id, session_id, or ts');
  }
  
  // Generate token
  const qr_token = generateQrToken();
  const expires_at = new Date(new Date().getTime() + 2 * 60000).toISOString(); // 2 menit
  
  const sheet = getOrCreateSheet('Tokens');
  sheet.appendRow([qr_token, course_id, session_id, expires_at, 'active', ts, new Date()]);
  
  return responseSuccess({
    qr_token: qr_token,
    expires_at: expires_at
  });
}

function handlePresenceCheckin(payload) {
  const { user_id, device_id, course_id, session_id, qr_token, ts } = payload;
  
  if (!user_id || !device_id || !course_id || !session_id || !qr_token || !ts) {
    return responseError('missing_field: user_id, device_id, course_id, session_id, qr_token, or ts');
  }
  
  // Validasi token
  const tokenSheet = getOrCreateSheet('Tokens');
  const tokenData = tokenSheet.getDataRange().getValues();
  
  let tokenValid = false;
  for (let i = 1; i < tokenData.length; i++) {
    if (tokenData[i][0] === qr_token && 
        tokenData[i][1] === course_id && 
        tokenData[i][2] === session_id) {
      const expiresAt = new Date(tokenData[i][3]);
      if (new Date() <= expiresAt && tokenData[i][4] === 'active') {
        tokenValid = true;
        break;
      }
    }
  }
  
  if (!tokenValid) {
    return responseError('token_invalid');
  }
  
  // Simpan presensi
  const presenceSheet = getOrCreateSheet('Presence');
  const presence_id = 'PR-' + String(presenceSheet.getLastRow()).padStart(4, '0');
  presenceSheet.appendRow([
    presence_id,
    user_id,
    device_id,
    course_id,
    session_id,
    qr_token,
    'checked_in',
    ts,
    new Date()
  ]);
  
  return responseSuccess({
    presence_id: presence_id,
    status: 'checked_in'
  });
}

function handlePresenceCheckinMobile(payload) {
  const { user_id, device_id, course_id, session_id, qr_token, ts, location, accelerometer } = payload;
  
  if (!user_id || !device_id || !qr_token) {
    return responseError('missing_field: user_id, device_id, or qr_token');
  }
  
  // Validasi token
  const tokenSheet = getOrCreateSheet('Tokens');
  const tokenData = tokenSheet.getDataRange().getValues();
  
  let tokenValid = false;
  for (let i = 1; i < tokenData.length; i++) {
    if (tokenData[i][0] === qr_token) {
      const expiresAt = new Date(tokenData[i][3]);
      if (new Date() <= expiresAt && tokenData[i][4] === 'active') {
        tokenValid = true;
        break;
      }
    }
  }
  
  if (!tokenValid) {
    return responseError('token_invalid_or_expired');
  }
  
  // Simpan presensi
  const presenceSheet = getOrCreateSheet('Presence');
  const presence_id = 'PR-' + String(presenceSheet.getLastRow()).padStart(4, '0');
  presenceSheet.appendRow([
    presence_id,
    user_id,
    device_id,
    course_id || 'cloud-101',
    session_id || 'session-01',
    qr_token,
    'checked_in',
    ts,
    new Date()
  ]);
  
  // Simpan data GPS (location)
  if (location && location.lat && location.lng) {
    const gpsSheet = getOrCreateSheet('GPS');
    gpsSheet.appendRow([
      device_id,
      ts,
      location.lat,
      location.lng,
      location.accuracy_m || 0,
      new Date()
    ]);
  }
  
  // Simpan data Accelerometer
  if (accelerometer && accelerometer.x !== undefined && accelerometer.y !== undefined && accelerometer.z !== undefined) {
    const accelSheet = getOrCreateSheet('Accelerometer');
    accelSheet.appendRow([
      device_id,
      ts,
      ts,
      accelerometer.x,
      accelerometer.y,
      accelerometer.z,
      new Date()
    ]);
  }
  
  return responseSuccess({
    presence_id: presence_id,
    status: 'checked_in',
    stored_data: {
      presence: true,
      location: !!location,
      accelerometer: !!accelerometer
    }
  });
}

function handlePresenceStatus(userId, courseId, sessionId) {
  if (!userId || !courseId || !sessionId) {
    return responseError('missing_field: user_id, course_id, or session_id');
  }
  
  const presenceSheet = getOrCreateSheet('Presence');
  const data = presenceSheet.getDataRange().getValues();
  
  // Cari presensi terbaru untuk user ini di session ini
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === userId && data[i][3] === courseId && data[i][4] === sessionId) {
      return responseSuccess({
        user_id: userId,
        course_id: courseId,
        session_id: sessionId,
        status: data[i][6],
        last_ts: data[i][7]
      });
    }
  }
  
  return responseError('no_presence_record');
}

// ===== HELPER FUNCTIONS =====

function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Tambah header sesuai tipe sheet
    if (sheetName === 'Accelerometer') {
      sheet.appendRow(['device_id', 'ts', 't', 'x', 'y', 'z', 'created_at']);
    } else if (sheetName === 'GPS') {
      sheet.appendRow(['device_id', 'ts', 'lat', 'lng', 'accuracy_m', 'created_at']);
    } else if (sheetName === 'Tokens') {
      sheet.appendRow(['qr_token', 'course_id', 'session_id', 'expires_at', 'status', 'ts', 'created_at']);
    } else if (sheetName === 'Presence') {
      sheet.appendRow(['presence_id', 'user_id', 'device_id', 'course_id', 'session_id', 'qr_token', 'status', 'ts', 'created_at']);
    }
  }
  
  return sheet;
}

function generateQrToken() {
  // Generate token format: TKN-XXXXXX (6 karakter alphanumeric)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'TKN-';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function responseSuccess(data) {
  const output = ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      data: data
    })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function responseError(message) {
  const output = ContentService.createTextOutput(
    JSON.stringify({
      ok: false,
      error: message
    })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ===== HTML DASHBOARD =====

function getHtmlDashboard() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard Telemetry</title>
  <script src="https://maps.googleapis.com/maps/api/js?key=GANTI_DENGAN_MAPS_API_KEY"></script>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 30px;
      font-size: 2.5em;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    @media (max-width: 1024px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
    
    .card {
      background: white;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      transition: transform 0.3s;
    }
    
    .card:hover {
      transform: translateY(-5px);
    }
    
    .card h2 {
      color: #333;
      margin-bottom: 20px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
      font-size: 1.5em;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      color: #555;
      font-weight: 500;
    }
    
    input, select {
      width: 100%;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    
    input:focus, select:focus {
      outline: none;
      border-color: #667eea;
    }
    
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      width: 100%;
    }
    
    button:hover {
      transform: scale(1.02);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    
    button:active {
      transform: scale(0.98);
    }
    
    .status {
      padding: 10px;
      border-radius: 5px;
      margin-top: 10px;
      text-align: center;
      font-weight: bold;
    }
    
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    #accelChart, #mapDiv {
      width: 100%;
      height: 400px;
      border-radius: 5px;
      overflow: hidden;
    }
    
    .data-display {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-top: 15px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #333;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .data-row {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    
    .data-row:last-child {
      border-bottom: none;
    }
    
    .data-label {
      font-weight: bold;
      color: #667eea;
    }
    
    .full-width {
      grid-column: 1 / -1;
    }
    
    .button-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 10px;
      vertical-align: middle;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Telemetry Dashboard</h1>
    
    <div class="grid">
      <!-- ACCELEROMETER CARD -->
      <div class="card">
        <h2>📱 Accelerometer</h2>
        
        <div class="form-group">
          <label for="accelDeviceId">Device ID:</label>
          <input type="text" id="accelDeviceId" placeholder="dev-001" value="dev-001">
        </div>
        
        <div class="form-group">
          <label>Axis Values:</label>
          <input type="number" id="accelX" placeholder="X axis" step="0.01" value="0.12">
          <input type="number" id="accelY" placeholder="Y axis" step="0.01" value="0.01">
          <input type="number" id="accelZ" placeholder="Z axis" step="0.01" value="9.70">
        </div>
        
        <div class="button-group">
          <button onclick="sendAccelerometerData()">Send Data</button>
          <button onclick="fetchAccelerometerLatest()">Get Latest</button>
        </div>
        
        <div id="accelStatus"></div>
        <div id="accelChart"></div>
        <div id="accelData" class="data-display"></div>
      </div>
      
      <!-- GPS CARD -->
      <div class="card">
        <h2>🗺️ GPS Location</h2>
        
        <div class="form-group">
          <label for="gpsDeviceId">Device ID:</label>
          <input type="text" id="gpsDeviceId" placeholder="dev-001" value="dev-001">
        </div>
        
        <div class="form-group">
          <label>Coordinates:</label>
          <input type="number" id="gpsLat" placeholder="Latitude" step="0.00001" value="-7.2575">
          <input type="number" id="gpsLng" placeholder="Longitude" step="0.00001" value="112.7521">
          <input type="number" id="gpsAccuracy" placeholder="Accuracy (m)" step="0.1" value="12.5">
        </div>
        
        <div class="button-group">
          <button onclick="sendGpsData()">Send Location</button>
          <button onclick="fetchGpsHistory()">Get History</button>
        </div>
        
        <div id="gpsStatus"></div>
        <div id="mapDiv"></div>
        <div id="gpsData" class="data-display"></div>
      </div>
    </div>
    
    <!-- MAP FULL WIDTH -->
    <div class="card full-width">
      <h2>🌍 GPS Tracking Map</h2>
      <div id="fullMapDiv" style="width:100%; height:500px; border-radius:5px;"></div>
      <div style="text-align:center; margin-top:15px;">
        <button onclick="loadMapData()" style="max-width: 300px;">Refresh Map</button>
      </div>
    </div>
  </div>

  <script>
    const BASE_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
    let map;
    let globalMarkers = [];
    let globalPolylines = [];

    // Initialize maps
    function initMaps() {
      // Small map for GPS card
      if (document.getElementById('mapDiv')) {
        map = new google.maps.Map(document.getElementById('mapDiv'), {
          center: { lat: -7.2575, lng: 112.7521 },
          zoom: 15,
          styles: [
            {
              "elementType": "geometry",
              "stylers": [{ "color": "#f5f5f5" }]
            }
          ]
        });
      }
      
      // Full map
      const fullMap = new google.maps.Map(document.getElementById('fullMapDiv'), {
        center: { lat: -7.2575, lng: 112.7521 },
        zoom: 15,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }]
          }
        ]
      });
      
      window.fullMap = fullMap;
    }

    // ACCELEROMETER FUNCTIONS
    function sendAccelerometerData() {
      const deviceId = document.getElementById('accelDeviceId').value;
      const x = parseFloat(document.getElementById('accelX').value);
      const y = parseFloat(document.getElementById('accelY').value);
      const z = parseFloat(document.getElementById('accelZ').value);
      
      if (!deviceId || isNaN(x) || isNaN(y) || isNaN(z)) {
        showStatus('accelStatus', 'Please fill all fields', 'error');
        return;
      }
      
      const payload = {
        device_id: deviceId,
        ts: new Date().toISOString(),
        samples: [{
          t: new Date().toISOString(),
          x: x,
          y: y,
          z: z
        }]
      };
      
      fetch(BASE_URL + '?action=telemetry/accel', {
        method: 'POST',
        payload: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          showStatus('accelStatus', '✓ Data sent: ' + data.data.accepted + ' sample(s)', 'success');
          setTimeout(() => fetchAccelerometerLatest(), 1000);
        } else {
          showStatus('accelStatus', '✗ Error: ' + data.error, 'error');
        }
      })
      .catch(err => showStatus('accelStatus', '✗ ' + err.message, 'error'));
    }

    function fetchAccelerometerLatest() {
      const deviceId = document.getElementById('accelDeviceId').value;
      
      fetch(BASE_URL + '?action=telemetry/accel/latest&device_id=' + deviceId)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          const d = data.data;
          document.getElementById('accelData').innerHTML = \`
            <div class="data-row"><span class="data-label">Timestamp:</span> \${d.t}</div>
            <div class="data-row"><span class="data-label">X:</span> \${d.x.toFixed(3)}</div>
            <div class="data-row"><span class="data-label">Y:</span> \${d.y.toFixed(3)}</div>
            <div class="data-row"><span class="data-label">Z:</span> \${d.z.toFixed(3)}</div>
          \`;
        } else {
          showStatus('accelStatus', '✗ ' + data.error, 'error');
        }
      })
      .catch(err => showStatus('accelStatus', '✗ ' + err.message, 'error'));
    }

    // GPS FUNCTIONS
    function sendGpsData() {
      const deviceId = document.getElementById('gpsDeviceId').value;
      const lat = parseFloat(document.getElementById('gpsLat').value);
      const lng = parseFloat(document.getElementById('gpsLng').value);
      const accuracy = parseFloat(document.getElementById('gpsAccuracy').value);
      
      if (!deviceId || isNaN(lat) || isNaN(lng)) {
        showStatus('gpsStatus', 'Please fill required fields', 'error');
        return;
      }
      
      const payload = {
        device_id: deviceId,
        ts: new Date().toISOString(),
        lat: lat,
        lng: lng,
        accuracy_m: accuracy
      };
      
      fetch(BASE_URL + '?action=telemetry/gps', {
        method: 'POST',
        payload: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          showStatus('gpsStatus', '✓ Location sent', 'success');
          setTimeout(() => fetchGpsHistory(), 1000);
        } else {
          showStatus('gpsStatus', '✗ Error: ' + data.error, 'error');
        }
      })
      .catch(err => showStatus('gpsStatus', '✗ ' + err.message, 'error'));
    }

    function fetchGpsHistory() {
      const deviceId = document.getElementById('gpsDeviceId').value;
      
      fetch(BASE_URL + '?action=telemetry/gps/history&device_id=' + deviceId + '&limit=50')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.data.items.length > 0) {
          const latest = data.data.items[data.data.items.length - 1];
          document.getElementById('gpsData').innerHTML = \`
            <div class="data-row"><span class="data-label">Latitude:</span> \${latest.lat.toFixed(6)}</div>
            <div class="data-row"><span class="data-label">Longitude:</span> \${latest.lng.toFixed(6)}</div>
            <div class="data-row"><span class="data-label">Accuracy:</span> ±\${latest.accuracy_m ? latest.accuracy_m.toFixed(1) + 'm' : 'N/A'}</div>
            <div class="data-row"><span class="data-label">Total Points:</span> \${data.data.items.length}</div>
          \`;
        }
      })
      .catch(err => showStatus('gpsStatus', '✗ ' + err.message, 'error'));
    }

    function loadMapData() {
      const deviceId = document.getElementById('gpsDeviceId').value;
      
      // Clear previous markers
      globalMarkers.forEach(m => m.setMap(null));
      globalPolylines.forEach(p => p.setMap(null));
      globalMarkers = [];
      globalPolylines = [];
      
      fetch(BASE_URL + '?action=telemetry/gps/history&device_id=' + deviceId + '&limit=200')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.data.items.length > 0) {
          const items = data.data.items;
          const paths = items.map(item => ({ lat: item.lat, lng: item.lng }));
          
          // Add polyline
          const polyline = new google.maps.Polyline({
            path: paths,
            geodesic: true,
            strokeColor: '#667eea',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: window.fullMap
          });
          globalPolylines.push(polyline);
          
          // Add markers for start and end
          const start = items[0];
          const end = items[items.length - 1];
          
          const startMarker = new google.maps.Marker({
            position: { lat: start.lat, lng: start.lng },
            map: window.fullMap,
            title: 'Start',
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          });
          globalMarkers.push(startMarker);
          
          const endMarker = new google.maps.Marker({
            position: { lat: end.lat, lng: end.lng },
            map: window.fullMap,
            title: 'Current Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });
          globalMarkers.push(endMarker);
          
          // Center map on end location
          window.fullMap.setCenter({ lat: end.lat, lng: end.lng });
        }
      })
      .catch(err => console.error(err));
    }

    function showStatus(elementId, message, type) {
      const el = document.getElementById(elementId);
      el.className = 'status ' + type;
      el.textContent = message;
      if (type === 'success') {
        setTimeout(() => el.innerHTML = '', 3000);
      }
    }

    // Initialize on load
    window.addEventListener('load', initMaps);
  </script>
</body>
</html>`;
}
