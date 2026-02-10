import { google } from "googleapis";

const SERVICE_ACCOUNT = {
  client_email: "v0-69-270@taxi-app-486813.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsOw1UR7wyfTrH\ndR/88qt8s8+CQRyLlfgPnelpXe9f8NyNyO0qpHW/0W0kIJkDd2LYsXk+9buDPGJZ\na7x9PV2Vsq9uBALIindh/GyyjS2JQL8kKxh6T9vhU8IYefgdqZxulNGdXgnDycaM\nFF7uXyGWv7t4GmbUiweEo409ANIWm2GrHOJrUB2vv3uDYopGb5OP4lEr84dKeL/2\nZksoZQ9Tp3j/tSXB8NXKvtKjHUCIJZR/yHSllSjNZeBKngPobbSzbt4nChc7gt6Q\nebGzV0mLPmaPHS53hz42xv+ke7/Q0lq2UnVcxGw8CcDUYGYq1iq9QV2j9DzBI3X1\nwg+9uMfhAgMBAAECggEABiX93JL1WLm9lLEYISlPmRN5Nl2ZMDF8dMrux3cV7Hn2\nga2ZK93Jof1PCmG13K4RI7UNjpi//C12bFn11WRmAsn+zGxiZg2CuVyFITL8MRYU\nN21owbW39C66MzH9ex+a3ka78e8muuwpL/HVOWjA0/cdxpSYtFXkljtZd4Kf6AnO\ne7RGYsvDvrwpeBd4iNnBJlCCh+WWrlYVxLCq5UCu174okH9C1dzkMPVt37GtvLYO\nawuEPFbW+zF4rhypzDgGfaOjQP9kzIWKt4cDkmiSmNttjhi3tqLmXvUQHhdXLVFT\njO/fO3U0GyhEowyx+z+U+cQghBMdM7dMqdsQ0YRtzQKBgQDcZ7/Dl0GBBfLLdECR\nsJaObs9Iy3ZNxb++m/bpRKVRWFgDUeU3xo3n7zg/9PlB7fEJ/Ia7K0OMHuS+ELFq\njycSiQGuQevIEHSDBHsbnU174eMVAsCA9qrAaeG/XpK3bYarJN0Cy7ScKzUmp/sT\nGkOjKi2uGkrH4AIwETn9sTdUrQKBgQDIC5zd3GJL5Gn1Vy8bIuor+ayj+ZVs9GKf\nwYRRa96WpM2+Y/srWDbx7CmqVD7PbTEgMJierSCoFc/1SmZuYJlg58QNRpZgLJim\nJXNfl/zMxDnauSricVakIbREjQ6P7y5gFylmRn+NWi8NYJ4AUjWD6ppFL4VokeQA\nT6qQkTAyhQKBgQCUv5hWIpDcyOzxjoW9TZZuji5rDJXNKzabJ5teFywTWDIeG3k9\nSU2gSHyH/YbzjehtOvaa/znZKUhrVczHA9H02m498tNz9FcNzUpgeqs+flbJaVAO\nOWtH7K2kf+k4zjxi6MAYEO7VrvtyGVCDtegMCH1H0QrDFlWjpxyiMKYNCQKBgQCh\nv/oLzknQsZUXYnJdT8Lm4c+9Gm6/FW+1WyThLQZi6kjN3EvXxVFQFbOu3MWYtOKW\n85REIRqZrmFjJdBjCUqbd2snjN7ETury1K9QKTWoYDWjbDuHszrqJbJ8B04yBaSK\n38+CuhgitDv9ZhT7j31j98rbjEwjvGsN8Vyp3iuJfQKBgEmA4SsBpFC79ngXseiU\nyWxVeartytzSNCzpqjtLEaOsSRmXL9zhteftqDP7f7OFj1ZTyFx2kjnXoOg7MxRw\n5YLYx8AOYpf12aLuQbyasSNTbzPz4FMrg/T1NQekVhPm6sorAoRQe9yGJMrtOmPO\nacgcc0UoXk0AF8rk0XqWXm8y\n-----END PRIVATE KEY-----\n",
};

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: SERVICE_ACCOUNT.client_email,
      private_key: SERVICE_ACCOUNT.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId() {
  return "1Mm2OGOpz32gKIdyT0ZY5KbmmgqjVMaKLprHDoFwKFFM";
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

export async function ensureSheetTab(tabName: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  // Check if tab exists
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: getSheetId(),
  });
  const existingTabs = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
  if (!existingTabs.includes(tabName)) {
    // Create the tab
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSheetId(),
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: tabName },
          },
        }],
      },
    });
    return false; // tab was created (didn't exist)
  }
  return true; // tab already existed
}

const BOOKING_HEADERS = [
  "Request ID", "Customer Name", "Phone", "Email", "General Query",
  "Pickup Eircode", "Destination Eircode", "Vehicle Type", "Date", "Time",
  "Pax", "Distance KM", "Travel Time", "NTA Max Fare", "Adjusted Fare",
  "Status", "Timestamp", "Origin Address", "Destination Address", "Owner Fare", "Preferred Reply",
];

export async function getBookings() {
  const data = await getSheetData("Bookings!A1:U");
  if (!data || data.length === 0) return [];

  // Check if first row is headers
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

export async function updateSheetCell(range: string, value: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[value]],
    },
  });
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
