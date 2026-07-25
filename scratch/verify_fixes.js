async function testFixes() {
  console.log("Verifying /series/21 page and webapp status...");
  const res = await fetch("http://localhost:3000/series/21");
  console.log(`Status: ${res.status}`);
  const html = await res.text();
  console.log(`Includes title: ${html.includes('One Piece')}`);
  console.log(`Includes placeholder-poster fallback check: ${html.includes('placeholder-poster.png') || html.includes('Image')}`);
}

setTimeout(testFixes, 3000);
