import { google } from "googleapis";

function getAuth() {
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || "";
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error(
      "Missing GOOGLE_SHEETS_PRIVATE_KEY or GOOGLE_SHEETS_CLIENT_EMAIL"
    );
  }

  // Handle different formats of the private key
  // Remove surrounding quotes if present
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }
  // Replace literal \n with actual newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

  console.log("[v0] Private key starts with:", privateKey.substring(0, 30));
  console.log("[v0] Private key ends with:", privateKey.substring(privateKey.length - 30));
  console.log("[v0] Client email:", clientEmail);

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
