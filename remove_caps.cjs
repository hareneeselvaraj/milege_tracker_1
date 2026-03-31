const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/HareneeS/Desktop/milege_tracker/src';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Remove 'uppercase' from Tailwind classNames
  content = content.replace(/className=(["'{][^"'{}]*["'}])/g, (match, p1) => {
    return `className=${p1.replace(/\buppercase\b\s*/g, '')}`;
  });

  // 2. Remove .toUpperCase() calls
  content = content.replace(/\.toUpperCase\(\)/g, '');

  // 3. Remove inline styles textTransform: 'uppercase'
  content = content.replace(/textTransform:\s*['"]uppercase['"],?\s*/gi, '');

  // 4. Replace hardcoded ALL CAPS
  const replacements = {
    'ALL UNITS': 'All Units',
    'DISTANCE ARCHIVE': 'Distance Archive',
    '+LOG TRIP': 'Log Trip',
    'KM RECORDED': 'KM Recorded',
    'NEW LOG': 'New Log',
    'GARAGE': 'Garage',
    'TRIPS': 'Trips',
    'TRENDS': 'Trends',
    'FUEL LOGS': 'Fuel Logs',
    'MACHINES': 'Machines',
    'KM/L AVG': 'KM/L Avg',
    'Total Archive': 'Total Archive',
    'LOG TRIP': 'Log Trip',
    '>OPTI<': '>Opti<',
    '>DATA<': '>Data<',
    '>FLEET<': '>Fleet<',
    '>TRIPS<': '>Trips<',
    '>AUTHORIZE VIA GOOGLE<': '>Authorize via Google<',
    'precision fleet': 'Precision Fleet',
    'PRECISION FLEET': 'Precision Fleet',
    'Current Garage': 'Current Garage',
    '>HOME<': '>Home<',
    '>FUEL<': '>Fuel<',
    '>SERVICES<': '>Services<'
  };

  for (const [key, val] of Object.entries(replacements)) {
    content = content.split(key).join(val);
  }

  // Hardcode fixes for specific tags
  content = content.replace(/>\+LOG TRIP</g, '>+Log Trip<');
  content = content.replace(/'ALL UNITS'/g, "'All Units'");
  content = content.replace(/"ALL UNITS"/g, '"All Units"');

  fs.writeFileSync(filePath, content);
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

traverse(srcDir);
console.log("Transformation completed successfully.");
