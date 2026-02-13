import { getSheetData, updateSheetCell } from "@/lib/google-sheets";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Read current Drivers headers
    const rows = await getSheetData("Drivers!A1:Z");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No data in Drivers sheet" }, { status: 400 });
    }

    const headers = rows[0] as string[];
    let phoneColIndex = headers.findIndex(
      (h: string) => h.toLowerCase() === "phone" || h.toLowerCase() === "mobile"
    );

    // Add "Phone" header if it doesn't exist
    if (phoneColIndex === -1) {
      phoneColIndex = headers.length;
      const colLetter = String.fromCharCode(65 + phoneColIndex); // A=0, B=1, etc.
      await updateSheetCell(`Drivers!${colLetter}1`, "Phone");
      console.log(`Added "Phone" header at column ${colLetter}`);
    }

    const colLetter = String.fromCharCode(65 + phoneColIndex);

    // Find Tom Redmond's row and set his phone number
    let tomRow = -1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as string[];
      const name = (row[headers.indexOf("Name")] || "").toLowerCase();
      const firstName = (row[headers.indexOf("First Name")] || "").toLowerCase();
      if (name.includes("tom") || firstName.includes("tom")) {
        tomRow = i + 1; // 1-indexed for Google Sheets
        break;
      }
    }

    if (tomRow > 0) {
      await updateSheetCell(`Drivers!${colLetter}${tomRow}`, "0852297379");
      console.log(`Set Tom Redmond's phone to 0852297379 at row ${tomRow}`);
    }

    return NextResponse.json({
      success: true,
      phoneColumn: colLetter,
      tomRow,
      message: tomRow > 0
        ? `Added Phone column and set Tom's number`
        : `Added Phone column but couldn't find Tom's row`,
    });
  } catch (err) {
    console.error("Error adding phone column:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
