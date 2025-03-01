#!/bin/bash

# Generate the conversations.json file with a list of all JSON files in the conversations directory
echo "[" > conversations.json
for file in conversations/*.json; do
    filename=$(basename "$file")
    echo "  {\"name\": \"$filename\"}," >> conversations.json
done
# Remove the trailing comma and close the array
sed -i '$ s/,$//' conversations.json
echo "]" >> conversations.json