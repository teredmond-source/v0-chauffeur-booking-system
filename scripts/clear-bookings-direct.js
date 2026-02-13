import crypto from "crypto";

const SERVICE_ACCOUNT_EMAIL = "v0-69-270@taxi-app-486813.iam.gserviceaccount.com";
const SERVICE_ACCOUNT_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsOw1UR7wyfTrH
dR/88qt8s8+CQRyLlfgPnelpXe9f8NyNyO0qpHW/0W0kIJkDd2LYsXk+9buDPGJZ
a7x9PV2Vsq9uBALIindh/GyyjS2JQL8kKxh6T9vhU8IYefgdqZxulNGdXgnDycaM
FF7uXyGWv7t4GmbUiweEo409ANIWm2GrHOJrUB2vv3uDYopGb5OP4lEr84dKeL/2
ZksoZQ9Tp3j/tSXB8NXKvtKjHUCIJZR/yHSllSjNZeBKngPobbSzbt4nChc7gt6Q
ebGzV0mLPmaPHS53hz42xv+ke7/Q0lq2UnVcxGw8CcDUYGYq1iq9QV2j9DzBI3X1
wg+9uMfhAgMBAAECggEABiX93JL1WLm9lLEYISlPmRN5Nl2ZMDF8dMrux3cV7Hn2
ga2ZK93Jof1PCmG13K4RI7UNjpi//C12bFn11WRmAsn+zGxiZg2CuVyFITL8MRYU
N21owbW39C66MzH9ex+a3ka78e8muuwpL/HVOWjA0/cdxpSYtFXkljtZd4Kf6AnO
e7RGYsvDvrwpeBd4iNnBJlCCh+WWrlYVxLCq5UCu174okH9C1dzkMPVt37GtvLYO
awuEPFbW+zF4rhypzDgGfaOjQP9kzIWKt4cDkmiSmNttjhi3tqLmXvUQHhdXLVFT
jO/fO3U0GyhEowyx+z+U+cQghBMdM7dMqdsQ0YRtzQKBgQDcZ7/Dl0GBBfLLdECR
sJaObs9Iy3ZNxb++m/bpRKVRWFgDUeU3xo3n7zg/9PlB7fEJ/Ia7K0OMHuS+ELFq
jycSiQGuQevIEHSDBHsbnU174eMVAsCA9qrAaeG/XpK3bYarJN0Cy7ScKzUmp/sT
GkOjKi2uGkrH4AIwETn9sTdUrQKBgQDIC5zd3GJL5Gn1Vy8bIuor+ayj+ZVs9GKf
wYRRa96WpM2+Y/srWDbx7CmqVD7PbTEgMJierSCoFc/1SmZuYJlg58QNRpZgLJim
JXNfl/zMxDnauSricVakIbREjQ6P7y5gFylmRn+NWi8NYJ4AUjWD6ppFL4VokeQA
T6qQkTAyhQKBgQCUv5hWIpDcyOzxjoW9TZZuji5rDJXNKzabJ5teFywTWDIeG3k9
SU2gSHyH/YbzjehtOvaa/znZKUhrVczHA9H02m498tNz9FcNzUpgeqs+flbJaVAO
OWtH7K2kf+k4zjxi6MAYEO7VrvtyGVCDtegMCH1H0QrDFlWjpxyiMKYNCQKBgQCh
v/oLzknQsZUXYnJdT8Lm4c+9Gm6/FW+1WyThLQZi6kjN3EvXxVFQFbOu3MWYtOKW
85REIRqZrmFjJdBjCUqbd2snjN7ETury1K9QKTWoYDWjbDuHszrqJbJ8B04yBaSK
38+CuhgitDv9ZhT7j31j98rbjEwjvGsN8Vyp3iuJfQKBgEmA4SsBpFC79ngXseiU
yWxVeartytzSNCzpqjtLEaOsSRmXL9zhteftqDP7f7OFj1ZTyFx2kjnXoOg7MxRw
5YLYx8AOYpf12aLuQbyasSNTbzPz4FMrg/T1NQekVhPm6sorAoRQe9yGJMrtOmPO
acgcc0UoXk0AF8rk0XqWXm8y
-----END PRIVATE KEY-----`;

const SHEET_ID = "1Mm2OGOpz32gKIdyT0ZY5KbmmgqjVMaKLprHDoFwKFFM";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

function base64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));

  const signInput = `${header}.${payload}`;
  const key = crypto.createPrivateKey(SERVICE_ACCOUNT_KEY);
  const signature = crypto.sign("sha256", Buffer.from(signInput), key);
  const jwt = `${signInput}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

async function main() {
  console.log("Getting access token...");
  const token = await getAccessToken();

  // First get the data to see how many rows exist
  console.log("Checking current bookings...");
  const getRes = await fetch(`${SHEETS_BASE}/values/Bookings!A1:Z`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getData = await getRes.json();
  const totalRows = (getData.values || []).length;
  console.log(`Found ${totalRows} rows (including header)`);

  if (totalRows <= 1) {
    console.log("No data rows to clear.");
    return;
  }

  // First, get the sheet's numeric ID (gid)
  console.log("Getting sheet metadata...");
  const metaRes = await fetch(`${SHEETS_BASE}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const metaData = await metaRes.json();
  const bookingsSheet = metaData.sheets.find(
    (s) => s.properties.title === "Bookings"
  );
  const sheetId = bookingsSheet ? bookingsSheet.properties.sheetId : 0;
  console.log(`Bookings sheet ID: ${sheetId}`);

  // Delete rows 2 onwards (index 1 to totalRows), keeping row 1 (header)
  console.log(`Deleting ${totalRows - 1} data rows...`);
  const deleteRes = await fetch(`${SHEETS_BASE}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: 1,       // row 2 (0-indexed)
              endIndex: totalRows,  // up to last row
            },
          },
        },
      ],
    }),
  });
  const deleteData = await deleteRes.json();
  console.log("Delete result:", JSON.stringify(deleteData));
  console.log(`Successfully deleted ${totalRows - 1} booking rows. Header row preserved.`);
}

main().catch(console.error);
