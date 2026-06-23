const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImagePath = path.join(__dirname, 'public', 'logo.png');
const resDir = path.join(__dirname, '..', 'android-app', 'app', 'src', 'main', 'res');

const densities = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

async function generateIcons() {
  // 1. Delete adaptive XML icons if they exist
  const anyDpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  const xmlFiles = ['ic_launcher.xml', 'ic_launcher_round.xml'];
  for (const xmlFile of xmlFiles) {
    const xmlPath = path.join(anyDpiDir, xmlFile);
    if (fs.existsSync(xmlPath)) {
      fs.unlinkSync(xmlPath);
      console.log(`Deleted ${xmlPath}`);
    }
  }

  // 2. Generate PNG icons and delete existing webp icons
  for (const density of densities) {
    const densityDir = path.join(resDir, density.name);
    
    // Create directory if it doesn't exist (should exist)
    if (!fs.existsSync(densityDir)) {
      fs.mkdirSync(densityDir, { recursive: true });
    }

    // Delete existing webp icons
    const webpFiles = ['ic_launcher.webp', 'ic_launcher_round.webp'];
    for (const webpFile of webpFiles) {
      const webpPath = path.join(densityDir, webpFile);
      if (fs.existsSync(webpPath)) {
        fs.unlinkSync(webpPath);
        console.log(`Deleted ${webpPath}`);
      }
    }

    // Generate ic_launcher.png (square/contain)
    const launcherPath = path.join(densityDir, 'ic_launcher.png');
    await sharp(inputImagePath)
      .resize(density.size, density.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(launcherPath);
    console.log(`Generated ${launcherPath}`);

    // Generate ic_launcher_round.png (circular clip)
    const launcherRoundPath = path.join(densityDir, 'ic_launcher_round.png');
    const radius = density.size / 2;
    
    // Create a circular mask SVG
    const circleSvg = Buffer.from(
      `<svg width="${density.size}" height="${density.size}">
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
      </svg>`
    );

    // Apply circular mask using composite
    await sharp(inputImagePath)
      .resize(density.size, density.size, {
        fit: 'cover'
      })
      .composite([{
        input: circleSvg,
        blend: 'dest-in'
      }])
      .toFile(launcherRoundPath);
    console.log(`Generated ${launcherRoundPath}`);
  }
}

generateIcons()
  .then(() => console.log("Android launcher icons successfully updated!"))
  .catch(console.error);
