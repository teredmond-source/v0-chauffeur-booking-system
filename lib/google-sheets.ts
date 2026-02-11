const SERVICE_ACCOUNT_EMAIL = "v0-69-270@taxi-app-486813.iam.gserviceaccount.com";
const SERVICE_ACCOUNT_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsOw1UR7wyfTrH\ndR/88qt8s8+CQRyLlfgPnelpXe9f8NyNyO0qpHW/0W0kIJkDd2LYsXk+9buDPGJZ\na7x9PV2Vsq9uBALIindh/GyyjS2JQL8kKxh6T9vhU8IYefgdqZxulNGdXgnDycaM\nFF7uXyGWv7t4GmbUiweEo409ANIWm2GrHOJrUB2vv3uDYopGb5OP4lEr84dKeL/2\nZksoZQ9Tp3j/tSXB8NXKvtKjHUCIJZR/yHSllSjNZeBKngPobbSzbt4nChc7gt6Q\nebGzV0mLPmaPHS53hz42xv+ke7/Q0lq2UnVcxGw8CcDUYGYq1iq9QV2j9DzBI3X1\nwg+9uMfhAgMBAAECggEABiX93JL1WLm9lLEYISlPmRN5Nl2ZMDF8dMrux3cV7Hn2\nga2ZK93Jof1PCmG13K4RI7UNjpi//C12bFn11WRmAsn+zGxiZg2CuVyFITL8MRYU\nN21owbW39C66MzH9ex+a3ka78e8muuwpL/HVOWjA0/cdxpSYtFXkljtZd4Kf6AnO\ne7RGYsvDvrwpeBd4iNnBJlCCh+WWrlYVxLCq5UCu174okH9C1dzkMPVt37GtvLYO\nawuEPFbW+zF4rhypzDgGfaOjQP9kzIWKt4cDkmiSmNttjhi3tqLmXvUQHhdXLVFT\njO/fO3U0GyhEowyx+z+U+cQghBMdM7dMqdsQ0YRtzQKBgQDcZ7/Dl0GBBfLLdECR\nsJaObs9Iy3ZNxb++m/bpRKVRWFgDUeU3xo3n7zg/9PlB7fEJ/Ia7K0OMHuS+ELFq\njycSiQGuQevIEHSDBHsbnU174eMVAsCA9qrAaeG/XpK3bYarJN0Cy7ScKzUmp/sT\nGkOjKi2uGkrH4AIwETn9sTdUrQKBgQDIC5zd3GJL5Gn1Vy8bIuor+ayj+ZVs9GKf\nwYRRa96WpM2+Y/srWDbx7CmqVD7PbTEgMJierSCoFc/1SmZuYJlg58QNRpZgLJim\nJXNfl/zMxDnauSricVakIbREjQ6P7y5gFylmRn+NWi8NYJ4AUjWD6ppFL4VokeQA\nT6qQkTAyhQKBgQCUv5hWIpDcyOzxjoW9TZZuji5rDJXNKzabJ5teFywTWDIeG3k9\nSU2gSHyH/YbzjehtOvaa/znZKUhrVczHA9H02m498tNz9FcNzUpgeqs+flbJaVAO\nOWtH7K2kf+k4zjxi6MAYEO7VrvtyGVCDtegMCH1H0QrDFlWjpxyiMKYNCQKBgQCh\nv/oLzknQsZUXYnJdT8Lm4c+9Gm6/FW+1WyThLQZi6kjN3EvXxVFQFbOu3MWYtOKW\n85REIRqZrmFjJdBjCUqbd2snjN7ETury1K9QKTWoYDWjbDuHszrqJbJ8B04yBaSK\n38+CuhgitDv9ZhT7j31j98rbjEwjvGsN8Vyp3iuJfQKBgEmA4SsBpFC79ngXseiU\nyWxVeartytzSNCzpqjtLEaOsSRmXL9zhteftqDP7f7OFj1ZTyFx2kjnXoOg7MxRw\n5YLYx8AOYpf12aLuQbyasSNTbzPz4FMrg/T1NQekVhPm6sorAoRQe9yGJMrtOmPO\nacgcc0UoXk0AF8rk0XqWXm8y\n-----END PRIVATE KEY-----\n";

const SHEET_ID = "1Mm2OGOpz32gKIdyT0ZY5KbmmgqjVMaKLprHDoFwKFFM";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

let cachedToken: { token: string; expiry: number } | null = null;

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function strToBase64url(str: string): string {
  return base64url(new TextEncoder().encode(str));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiry - 60000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = strToBase64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = strToBase64url(
    JSON.stringify({
      iss: SERVICE_ACCOUNT_EMAIL,
      scope: SCOPES,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );

  const keyData = pemToArrayBuffer(SERVICE_ACCOUNT_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  const signature = base64url(signatureBuffer);

  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${text}`);
  }

  const data = await res.json();
  cachedToken = { token: data.access_token, expiry: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function sheetsGet(range: string): Promise<string[][]> {
  const token = await getAccessToken();
  const url = `${SHEETS_BASE}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets GET failed: ${text}`);
  }
  const data = await res.json();
  return data.values || [];
}

async function sheetsUpdate(range: string, values: string[][]) {
  const token = await getAccessToken();
  const url = `${SHEETS_BASE}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets UPDATE failed: ${text}`);
  }
  return res.json();
}

async function sheetsAppend(range: string, values: string[][]) {
  const token = await getAccessToken();
  const url = `${SHEETS_BASE}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets APPEND failed: ${text}`);
  }
  return res.json();
}

// Public API (same signatures as before)

export async function getSheetData(range: string) {
  return sheetsGet(range);
}

export async function appendSheetRow(range: string, values: string[][]) {
  return sheetsAppend(range, values);
}

export async function updateSheetRow(range: string, values: string[][]) {
  return sheetsUpdate(range, values);
}

export async function updateSheetCell(range: string, value: string) {
  return sheetsUpdate(range, [[value]]);
}

export async function ensureSheetTab(tabName: string) {
  const token = await getAccessToken();
  const res = await fetch(`${SHEETS_BASE}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to get spreadsheet: ${await res.text()}`);
  const data = await res.json();
  const tabs = (data.sheets || []).map((s: { properties?: { title?: string } }) => s.properties?.title);

  if (!tabs.includes(tabName)) {
    const addRes = await fetch(`${SHEETS_BASE}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: tabName } } }],
      }),
    });
    if (!addRes.ok) throw new Error(`Failed to add tab: ${await addRes.text()}`);
    return false;
  }
  return true;
}

const BOOKING_HEADERS = [
  "Request ID", "Customer Name", "Phone", "Email", "General Query",
  "Pickup Eircode", "Destination Eircode", "Vehicle Type", "Date", "Time",
  "Pax", "Distance KM", "Travel Time", "NTA Max Fare", "Adjusted Fare",
  "Status", "Timestamp", "Origin Address", "Destination Address", "Owner Fare", "Preferred Reply",
  "Journey Status", "Driver Name", "Vehicle Reg", "Pickup Timestamp",
  "Completion Timestamp", "Actual KM Driven", "Actual Duration", "Driver Lat", "Driver Lng",
];

export async function getBookings() {
  const data = await sheetsGet("Bookings!A1:AD");
  if (!data || data.length === 0) return [];

  const firstRow = data[0];
  const hasHeaders = firstRow[0] === "Request ID";
  const dataRows = hasHeaders ? data.slice(1) : data;
  const startRow = hasHeaders ? 2 : 1;

  return dataRows.map((row: string[], rowIndex: number) => {
    const obj: Record<string, string> = {};
    BOOKING_HEADERS.forEach((h: string, i: number) => {
      obj[h] = row[i] || "";
    });
    obj["_rowIndex"] = String(rowIndex + startRow);
    return obj;
  });
}

export async function getDrivers() {
  const data = await sheetsGet("Drivers!A1:Z");
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h: string, i: number) => {
      obj[h] = row[i] || "";
    });
    return obj;
  });
}

export async function getVehicles() {
  const data = await sheetsGet("Vehicles!A1:Z");
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h: string, i: number) => {
      obj[h] = row[i] || "";
    });
    return obj;
  });
}
