/**
 * Generate placeholder SVG assets for avatar states
 * Run with: node scripts/generateAssets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '..', 'public', 'assets', 'avatar');

// Ensure directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const avatarStates = [
  { name: 'idle', color: '#4CAF50', emoji: '😊' },
  { name: 'thinking', color: '#2196F3', emoji: '🤔' },
  { name: 'speaking', color: '#FF9800', emoji: '💬' },
  { name: 'happy', color: '#FFC107', emoji: '😄' },
  { name: 'sad', color: '#9E9E9E', emoji: '😢' },
  { name: 'excited', color: '#E91E63', emoji: '🎉' },
  { name: 'confused', color: '#795548', emoji: '😕' },
];

function generateSVG(emoji, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="${color}" opacity="0.8"/>
  <text x="64" y="80" font-size="60" text-anchor="middle">${emoji}</text>
</svg>`;
}

// Generate SVG files
avatarStates.forEach(({ name, color, emoji }) => {
  const svg = generateSVG(emoji, color);
  const filePath = path.join(assetsDir, `${name}.webp`);
  // For now, save as SVG (in real implementation, these would be converted to WebP)
  const svgPath = path.join(assetsDir, `${name}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Generated ${name}.svg`);
});

// Generate simple icon placeholders
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#4CAF50"/>
  <text x="${size/2}" y="${size * 0.7}" font-size="${size * 0.6}" text-anchor="middle" fill="white">A</text>
</svg>`;
  const iconPath = path.join(__dirname, '..', 'public', 'assets', `icon${size}.svg`);
  fs.writeFileSync(iconPath, iconSvg);
  console.log(`✓ Generated icon${size}.svg`);
});

console.log('\n✅ All assets generated successfully!');
console.log('Note: In production, convert SVG to WebP/PNG for better browser support');
