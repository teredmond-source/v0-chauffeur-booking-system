import { NextResponse } from "next/server";
import { google } from "googleapis";

async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const token = await auth.getAccessToken();
  return token;
}

export async function POST() {
  try {
    const token = await getAccessToken();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Bookings!A2:AD1000:clear`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "All booking data cleared (headers kept)" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
