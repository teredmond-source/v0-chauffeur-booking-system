// Adds "Phone" column to Drivers sheet and sets Tom Redmond's number

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

async function getAccessToken() {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    iss: CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(PRIVATE_KEY, "base64url");

  const jwt = `${header}.${payload}.${signature}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

async function sheetsGet(range) {
  const token = await getAccessToken();
  const url = `${SHEETS_BASE}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.values || [];
}

async function sheetsUpdate(range, values) {
  const token = await getAccessToken();
  const url = `${SHEETS_BASE}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log("Reading Drivers sheet...");
  const data = await sheetsGet("Drivers!A1:Z");
  
  if (data.length < 1) {
    console.log("No data in Drivers sheet");
    return;
  }

  const headers = data[0];
  console.log("Current headers:", headers.join(" | "));

  // Check if Phone column already exists
  const phoneColIdx = headers.findIndex(h => h.toLowerCase() === "phone" || h.toLowerCase() === "mobile");
  
  if (phoneColIdx >= 0) {
    console.log(`Phone column already exists at index ${phoneColIdx} ("${headers[phoneColIdx]}")`);
  } else {
    // Add "Phone" header to next column
    const nextCol = String.fromCharCode(65 + headers.length); // A=65, so col G = 65+6
    console.log(`Adding "Phone" header to column ${nextCol}...`);
    await sheetsUpdate(`Drivers!${nextCol}1`, [["Phone"]]);
    headers.push("Phone");
    console.log("Phone header added.");
  }

  // Now find Tom Redmond's row and add his number
  const colIdx = headers.findIndex(h => h.toLowerCase() === "phone" || h.toLowerCase() === "mobile");
  const colLetter = String.fromCharCode(65 + colIdx);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const firstName = (row[headers.indexOf("First Name")] || "").toLowerCase();
    const name = (row[headers.indexOf("Name")] || "").toLowerCase();
    
    if (firstName.includes("tom") || name.includes("tom")) {
      const rowNum = i + 1; // 1-indexed
      const existingPhone = row[colIdx] || "";
      if (existingPhone) {
        console.log(`Tom already has phone: ${existingPhone} (row ${rowNum})`);
      } else {
        console.log(`Setting Tom's phone to 0852297379 (row ${rowNum}, cell ${colLetter}${rowNum})...`);
        await sheetsUpdate(`Drivers!${colLetter}${rowNum}`, [["0852297379"]]);
        console.log("Done! Tom's phone number has been set.");
      }
    }
  }

  // Verify
  const updated = await sheetsGet("Drivers!A1:Z");
  console.log("\nUpdated headers:", updated[0].join(" | "));
  for (let i = 1; i < updated.length; i++) {
    const row = updated[i];
    const name = row[0] || row[1] || "Unknown";
    const phone = row[updated[0].findIndex(h => h.toLowerCase() === "phone")] || "(no phone)";
    console.log(`  ${name}: ${phone}`);
  }
}

main().catch(console.error);
