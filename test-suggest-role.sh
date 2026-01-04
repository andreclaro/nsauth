#!/bin/bash

# Test script for the suggest-role API endpoint
# Usage: ./test-suggest-role.sh [about_text] [port]

ABOUT_TEXT="${1:-I am a developer}"
PORT="${2:-3000}"
API_URL="http://localhost:${PORT}/api/gemini/suggest-role"

echo "Testing suggest-role API endpoint"
echo "=================================="
echo "About text: \"$ABOUT_TEXT\""
echo "API URL: $API_URL"
echo ""

# Check if server is running
if ! curl -s "http://localhost:${PORT}" > /dev/null 2>&1; then
    echo "⚠️  Warning: Server might not be running on port $PORT"
    echo "   Start the server with: npm run dev"
    echo ""
fi

# Make the API call
echo "Making POST request..."
RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"about\": \"$ABOUT_TEXT\"}")

echo ""
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract role from response
ROLE=$(echo "$RESPONSE" | jq -r '.role' 2>/dev/null || echo "$RESPONSE" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)

echo ""
if [ "$ROLE" != "null" ] && [ -n "$ROLE" ] && [ "$ROLE" != "" ]; then
    echo "✅ Success! Suggested role: $ROLE"
else
    echo "❌ Failed! No role suggested (returned: $ROLE)"
    echo ""
    echo "Check server logs for more details."
fi

