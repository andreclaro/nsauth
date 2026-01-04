#!/usr/bin/env node

/**
 * Test script for the suggest-role API endpoint
 * Usage: node test-suggest-role.js [about_text] [port]
 */

const aboutText = process.argv[2] || "I'm a developer";
const port = process.argv[3] || "3000";
const apiUrl = `http://localhost:${port}/api/gemini/suggest-role`;

console.log("Testing suggest-role API endpoint");
console.log("==================================");
console.log(`About text: "${aboutText}"`);
console.log(`API URL: ${apiUrl}`);
console.log("");

// Make the API call
fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ about: aboutText }),
})
  .then(async (response) => {
    const data = await response.json();
    
    console.log("Response:");
    console.log(JSON.stringify(data, null, 2));
    console.log("");
    
    if (data.role && data.role !== null) {
      console.log(`✅ Success! Suggested role: ${data.role}`);
      process.exit(0);
    } else {
      console.log("❌ Failed! No role suggested");
      if (data.error) {
        console.log(`Error: ${data.error}`);
      }
      console.log("");
      console.log("Check server logs for more details.");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Error making request:", error.message);
    console.log("");
    console.log("Make sure the server is running:");
    console.log("  npm run dev");
    process.exit(1);
  });

