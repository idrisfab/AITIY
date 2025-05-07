#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Define the paths
const embedSrcPath = path.join(__dirname, '../public/embed.js');
const embedDistPath = path.join(__dirname, '../public/embed.js');

// Read the embed.js file
console.log('Processing embed.js file...');
let embedContent = fs.readFileSync(embedSrcPath, 'utf8');

// Get the app URL from environment variable or use the default
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.attiy.com';
console.log(`Using app URL: ${appUrl}`);

// Replace the placeholder with the actual URL
embedContent = embedContent.replace(/%NEXT_PUBLIC_APP_URL%/g, appUrl);

// Write the processed file
fs.writeFileSync(embedDistPath, embedContent);
console.log('Embed file processed successfully!'); 