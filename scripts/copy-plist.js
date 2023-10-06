// scripts/copy-plist.js
const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../GoogleService-Info.plist');
const destPath = path.resolve(__dirname, '../ios/App/App/GoogleService-Info.plist');

fs.copyFileSync(srcPath, destPath);
console.log('GoogleService-Info.plist copied to iOS platform');
