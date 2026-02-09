import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: "v0-69-270@taxi-app-486813.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsOw1UR7wyfTrH\ndR/88qt8s8+CQRyLlfgPnelpXe9f8NyNyO0qpHW/0W0kIJkDd2LYsXk+9buDPGJZ\na7x9PV2Vsq9uBALIindh/GyyjS2JQL8kKxh6T9vhU8IYefgdqZxulNGdXgnDycaM\nFF7uXyGWv7t4GmbUiweEo409ANIWm2GrHOJrUB2vv3uDYopGb5OP4lEr84dKeL/2\nZksoZQ9Tp3j/tSXB8NXKvtKjHUCIJZR/yHSllSjNZeBKngPobbSzbt4nChc7gt6Q\nebGzV0mLPmaPHS53hz42xv+ke7/Q0lq2UnVcxGw8CcDUYGYq1iq9QV2j9DzBI3X1\nwg+9uMfhAgMBAAECggEABiX93JL1WLm9lLEYISlPmRN5Nl2ZMDF8dMrux3cV7Hn2\nga2ZK93Jof1PCmG13K4RI7UNjpi//C12bFn11WRmAsn+zGxiZg2CuVyFITL8MRYU\nN21owbW39C66MzH9ex+a3ka78e8muuwpL/HVOWjA0/cdxpSYtFXkljtZd4Kf6AnO\ne7RGYsvDvrwpeBd4iNnBJlCCh+WWrlYVxLCq5UCu174okH9C1dzkMPVt37GtvLYO\nawuEPFbW+zF4rhypzDgGfaOjQP9kzIWKt4cDkmiSmNttjhi3tqLmXvUQHhdXLVFT\njO/fO3U0GyhEowyx+z+U+cQghBMdM7dMqdsQ0YRtzQKBgQDcZ7/Dl0GBBfLLdECR\nsJaObs9Iy3ZNxb++m/bpRKVRWFgDUeU3xo3n7zg/9PlB7fEJ/Ia7K0OMHuS+ELFq\njycSiQGuQevIEHSDBHsbnU174eMVAsCA9qrAaeG/XpK3bYarJN0Cy7ScKzUmp/sT\nGkOjKi2uGkrH4AIwETn9sTdUrQKBgQDIC5zd3GJL5Gn1Vy8bIuor+ayj+ZVs9GKf\nwYRRa96WpM2+Y/srWDbx7CmqVD7PbTEgMJierSCoFc/1SmZuYJlg58QNRpZgLJim\nJXNfl/zMxDnauSricVakIbREjQ6P7y5gFylmRn+NWi8NYJ4AUjWD6ppFL4VokeQA\nT6qQkTAyhQKBgQCUv5hWIpDcyOzxjoW9TZZuji5rDJXNKzabJ5teFywTWDIeG3k9\nSU2gSHyH/YbzjehtOvaa/znZKUhrVczHA9H02m498tNz9FcNzUpgeqs+flbJaVAO\nOWtH7K2kf+k4zjxi6MAYEO7VrvtyGVCDtegMCH1H0QrDFlWjpxyiMKYNCQKBgQCh\nv/oLzknQsZUXYnJdT8Lm4c+9Gm6/FW+1WyThLQZi6kjN3EvXxVFQFbOu3MWYtOKW\n85REIRqZrmFjJdBjCUqbd2snjN7ETury1K9QKTWoYDWjbDuHszrqJbJ8B04yBaSK\n38+CuhgitDv9ZhT7j31j98rbjEwjvGsN8Vyp3iuJfQKBgEmA4SsBpFC79ngXseiU\nyWxVeartytzSNCzpqjtLEaOsSRmXL9zhteftqDP7f7OFj1ZTyFx2kjnXoOg7MxRw\n5YLYx8AOYpf12aLuQbyasSNTbzPz4FMrg/T1NQekVhPm6sorAoRQe9yGJMrtOmPO\nacgcc0UoXk0AF8rk0XqWXm8y\n-----END PRIVATE KEY-----\n",
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    results.auth = "OK";

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = "1Mm2OGOpz32gKIdyT0ZY5KbmmgqjVMaKLprHDoFwKFFM";

    // Step 1: Try to get spreadsheet metadata (title + tab names)
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      results.spreadsheetTitle = meta.data.properties?.title;
      results.tabs = meta.data.sheets?.map((s) => s.properties?.title) || [];
    } catch (metaErr: unknown) {
      const e = metaErr as { code?: number; message?: string; errors?: unknown };
      results.metaError = {
        code: e.code,
        message: e.message,
        errors: e.errors,
      };
    }

    // Step 2: Try to read Drivers tab
    try {
      const driversRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Drivers!A1:F5",
      });
      results.driversRows = driversRes.data.values?.length || 0;
      results.driversPreview = driversRes.data.values?.slice(0, 3);
    } catch (dErr: unknown) {
      const e = dErr as { code?: number; message?: string };
      results.driversError = { code: e.code, message: e.message };
    }

    // Step 3: Try to read Vehicles tab
    try {
      const vehiclesRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Vehicles!A1:F5",
      });
      results.vehiclesRows = vehiclesRes.data.values?.length || 0;
      results.vehiclesPreview = vehiclesRes.data.values?.slice(0, 3);
    } catch (vErr: unknown) {
      const e = vErr as { code?: number; message?: string };
      results.vehiclesError = { code: e.code, message: e.message };
    }

    return NextResponse.json(results);
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    return NextResponse.json({
      topLevelError: { code: e.code, message: e.message },
      ...results,
    }, { status: 500 });
  }
}
