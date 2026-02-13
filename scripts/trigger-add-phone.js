const BASE_URL = process.env.DEPLOYMENT_URL || "http://localhost:3000";

async function main() {
  console.log("Calling API to add Phone column and set Tom's number...");
  const res = await fetch(`${BASE_URL}/api/drivers/add-phone`, { method: "POST" });
  const data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
