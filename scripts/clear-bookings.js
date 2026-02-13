const res = await fetch("http://localhost:3000/api/bookings/clear", { method: "POST" });
const data = await res.json();
console.log("Status:", res.status);
console.log("Response:", JSON.stringify(data, null, 2));
