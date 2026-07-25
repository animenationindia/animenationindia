const fs = require('fs');
const path = require('path');

console.log("==================================================================================");
console.log("🔒 SECURITY AUDIT: SECRETS & ENVIRONMENT SAFETY");
console.log("==================================================================================\n");

const envFiles = ['.env', '.env.local', 'frontend/.env', 'frontend/.env.local', 'backend/.env'];
envFiles.forEach(f => {
  const full = path.join(__dirname, '..', f);
  if (fs.existsSync(full)) {
    console.log(`[FILE ${f.padEnd(22)}] Exists: Yes`);
    const content = fs.readFileSync(full, 'utf8');
    const hasSecretKey = content.includes('JWT_SECRET') || content.includes('DATABASE_URL');
    console.log(`   -> Contains Sensitive Key Declarations: ${hasSecretKey}`);
  } else {
    console.log(`[FILE ${f.padEnd(22)}] Exists: No (Using Default / System Env)`);
  }
});

const gitignorePath = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  console.log(`\n[.gitignore Status] Contains .env ignore rules: ${gitignore.includes('.env')}`);
}

console.log("\n==================================================================================");
