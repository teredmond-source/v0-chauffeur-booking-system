import { google } from "googleapis";

function getAuth() {
  // Option 1: Full JSON service account pasted as one env var
  const jsonRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw);
      return new google.auth.GoogleAuth({
        credentials: {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the entire contents of your service account .json file.");
    }
  }

  // Option 2: Separate env vars
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || "";
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error(
      "Missing credentials. Set either GOOGLE_SERVICE_ACCOUNT_JSON (easiest) or both GOOGLE_SHEETS_PRIVATE_KEY and GOOGLE_SHEETS_CLIENT_EMAIL."
    );
  }

  // Strip surrounding quotes
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  // Replace literal \n with real newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("Missing GOOGLE_SHEET_ID");
  }
  return sheetId;
}

export async function getSheetData(range: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range,
  });
  return response.data.values || [];
}

export async function appendSheetRow(range: string, values: string[][]) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
  return response.data;
}

export async function updateSheetRow(range: string, values: string[][]) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
  return response.data;
}

export async function getDrivers() {
  const data = await getSheetData("Drivers!A1:Z");
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
  const data = await getSheetData("Vehicles!A1:Z");
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
