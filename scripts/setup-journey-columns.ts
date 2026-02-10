// This script adds journey tracking columns to the Bookings sheet
// New columns V-AA: 
// V = Journey Status (idle/en-route/on-board/completed)
// W = Driver Name
// X = Vehicle Reg
// Y = Pickup Timestamp (when driver taps "Client On Board")
// Z = Completion Timestamp (when driver taps "Job Completed")
// AA = Actual KM Driven
// AB = Actual Duration (mins)
// AC = Driver Lat (live location)
// AD = Driver Lng (live location)

console.log("Journey columns to add to Bookings sheet:");
console.log("V = Journey Status");
console.log("W = Driver Name");
console.log("X = Vehicle Reg");
console.log("Y = Pickup Timestamp");
console.log("Z = Completion Timestamp");
console.log("AA = Actual KM Driven");
console.log("AB = Actual Duration");
console.log("AC = Driver Lat");
console.log("AD = Driver Lng");
console.log("");
console.log("Please add these headers to row 1 of your Bookings sheet, columns V through AD.");
console.log("The driver dispatch app will write to these columns during each journey.");
