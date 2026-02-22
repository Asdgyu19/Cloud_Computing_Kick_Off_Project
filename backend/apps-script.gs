/**
 * Cloud Computing Project - Google Apps Script Backend
 * Modul: Presensi QR + Accelerometer + GPS Tracking
 * 
 * SETUP:
 * 1. Copy code ini ke Google Apps Script (Extensions > Apps Script)
 * 2. Ganti SPREADSHEET_ID dengan ID sheets Anda
 * 3. Deploy sebagai Web app (Everyone access)
 */

// ============ CONFIG ============
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID"; // GANTI DENGAN ID SHEETS ANDA!
const TOKEN_EXPIRY_MINUTES = 2; // QR token berlaku 2 menit

// ============ MAIN HANDLER ============
function doPost(e) {
  try {
    const pathInfo = e.pathInfo || '';
    const payload = e.postData ? JSON.parse(e.postData.contents) : {};
    
    // Route handler
    if (pathInfo.includes('/presence/qr/generate')) {
      return handleGenerateQR(payload);
    } else if (pathInfo.includes('/presence/checkin')) {
      return handleCheckin(payload);
    } else if (pathInfo.includes('/telemetry/accel')) {
      return handleAccelData(payload);
    } else if (pathInfo.includes('/telemetry/gps')) {
      return handleGPSData(payload);
    }
    
    return jsonResponse(false, 'Unknown endpoint');
  } catch (error) {
    return jsonResponse(false, `Error: ${error.message}`);
  }
}

function doGet(e) {
  try {
    const pathInfo = e.pathInfo || '';
    
    // Route handler
    if (pathInfo.includes('/presence/status')) {
      return handlePresenceStatus(e);
    } else if (pathInfo.includes('/telemetry/accel/latest')) {
      return handleAccelLatest(e);
    } else if (pathInfo.includes('/telemetry/gps/latest')) {
      return handleGPSLatest(e);
    } else if (pathInfo.includes('/telemetry/gps/history')) {
      return handleGPSHistory(e);
    }
    
    return jsonResponse(false, 'Unknown endpoint');
  } catch (error) {
    return jsonResponse(false, `Error: ${error.message}`);
  }
}

// ============ MODUL 1: PRESENSI QR ============

function handleGenerateQR(payload) {
  // Validasi input
  if (!payload.course_id || !payload.session_id) {
    return jsonResponse(false, 'missing_field: course_id or session_id');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('tokens');
  
  // Generate token random
  const qrToken = 'TKN-' + generateRandomToken(6);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
  
  // Simpan ke sheet
  sheet.appendRow([
    qrToken,
    payload.course_id,
    payload.session_id,
    payload.ts || new Date().toISOString(),
    expiresAt.toISOString(),
    'active'
  ]);
  
  return jsonResponse(true, {
    qr_token: qrToken,
    expires_at: expiresAt.toISOString()
  });
}

function handleCheckin(payload) {
  // Validasi input
  const required = ['user_id', 'device_id', 'course_id', 'session_id', 'qr_token'];
  for (let field of required) {
    if (!payload[field]) {
      return jsonResponse(false, `missing_field: ${field}`);
    }
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tokensSheet = ss.getSheetByName('tokens');
  const presenceSheet = ss.getSheetByName('presence');
  
  // Cek token valid & tidak expired
  const tokenData = findTokenByValue(tokensSheet, payload.qr_token);
  
  if (!tokenData) {
    return jsonResponse(false, 'token_invalid');
  }
  
  const expiryTime = new Date(tokenData.expires_at);
  if (new Date() > expiryTime) {
    return jsonResponse(false, 'token_expired');
  }
  
  // Cek course_id & session_id match
  if (tokenData.course_id !== payload.course_id || tokenData.session_id !== payload.session_id) {
    return jsonResponse(false, 'token_mismatch');
  }

  // Simpan presensi
  const presenceId = 'PR-' + Date.now();
  presenceSheet.appendRow([
    presenceId,
    payload.user_id,
    payload.device_id,
    payload.course_id,
    payload.session_id,
    payload.qr_token,
    payload.ts || new Date().toISOString(),
    'checked_in'
  ]);
  
  return jsonResponse(true, {
    presence_id: presenceId,
    status: 'checked_in'
  });
}

function handlePresenceStatus(e) {
  const userId = e.parameter.user_id;
  const courseId = e.parameter.course_id;
  const sessionId = e.parameter.session_id;
  
  if (!userId || !courseId || !sessionId) {
    return jsonResponse(false, 'missing_field: user_id, course_id, or session_id');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('presence');
  const data = sheet.getDataRange().getValues();
  
  // Skip header, cari record terakhir
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === userId && data[i][3] === courseId && data[i][4] === sessionId) {
      return jsonResponse(true, {
        user_id: userId,
        course_id: courseId,
        session_id: sessionId,
        status: data[i][7],
        last_ts: data[i][6]
      });
    }
  }
  
  return jsonResponse(true, {
    user_id: userId,
    course_id: courseId,
    session_id: sessionId,
    status: 'absent',
    last_ts: null
  });
}

// ============ MODUL 2: ACCELEROMETER ============

function handleAccelData(payload) {
  if (!payload.device_id || !payload.samples || payload.samples.length === 0) {
    return jsonResponse(false, 'missing_field: device_id or samples');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('accel');
  
  let accepted = 0;
  for (let sample of payload.samples) {
    sheet.appendRow([
      payload.device_id,
      payload.ts || new Date().toISOString(),
      sample.t,
      sample.x || 0,
      sample.y || 0,
      sample.z || 0
    ]);
    accepted++;
  }
  
  return jsonResponse(true, {
    accepted: accepted
  });
}

function handleAccelLatest(e) {
  const deviceId = e.parameter.device_id;
  
  if (!deviceId) {
    return jsonResponse(false, 'missing_field: device_id');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('accel');
  const data = sheet.getDataRange().getValues();
  
  // Cari record terakhir untuk device ini
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === deviceId) {
      return jsonResponse(true, {
        t: data[i][2],
        x: data[i][3],
        y: data[i][4],
        z: data[i][5]
      });
    }
  }
  
  return jsonResponse(false, 'device_not_found');
}

// ============ MODUL 3: GPS ============

function handleGPSData(payload) {
  if (!payload.device_id || payload.lat === undefined || payload.lng === undefined) {
    return jsonResponse(false, 'missing_field: device_id, lat, or lng');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('gps');
  
  sheet.appendRow([
    payload.device_id,
    payload.ts || new Date().toISOString(),
    payload.lat,
    payload.lng,
    payload.accuracy_m || 0
  ]);
  
  return jsonResponse(true, {
    accepted: true
  });
}

function handleGPSLatest(e) {
  const deviceId = e.parameter.device_id;
  
  if (!deviceId) {
    return jsonResponse(false, 'missing_field: device_id');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('gps');
  const data = sheet.getDataRange().getValues();
  
  // Cari record terakhir untuk device ini
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === deviceId) {
      return jsonResponse(true, {
        ts: data[i][1],
        lat: data[i][2],
        lng: data[i][3],
        accuracy_m: data[i][4]
      });
    }
  }
  
  return jsonResponse(false, 'device_not_found');
}

function handleGPSHistory(e) {
  const deviceId = e.parameter.device_id;
  const limit = parseInt(e.parameter.limit) || 200;
  
  if (!deviceId) {
    return jsonResponse(false, 'missing_field: device_id');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('gps');
  const data = sheet.getDataRange().getValues();
  
  // Cari semua record untuk device ini (terbaru dulu)
  const items = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === deviceId) {
      items.push({
        ts: data[i][1],
        lat: data[i][2],
        lng: data[i][3]
      });
      if (items.length >= limit) break;
    }
  }
  
  if (items.length === 0) {
    return jsonResponse(false, 'device_not_found');
  }
  
  return jsonResponse(true, {
    device_id: deviceId,
    items: items.reverse() // Balik ke urutan tua → baru
  });
}

// ============ HELPER FUNCTIONS ============

function generateRandomToken(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function findTokenByValue(sheet, tokenValue) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tokenValue) {
      return {
        qr_token: data[i][0],
        course_id: data[i][1],
        session_id: data[i][2],
        created_at: data[i][3],
        expires_at: data[i][4],
        status: data[i][5]
      };
    }
  }
  return null;
}

function jsonResponse(ok, data) {
  const response = {
    ok: ok,
    ...(ok ? { data: data } : { error: data })
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
