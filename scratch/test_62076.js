async function test62076Title() {
  const res = await fetch('http://localhost:3000/series/62076');
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Contains Title 'Smoking Behind':", text.includes('Smoking Behind'));
  console.log("Contains '500: This page couldn't load':", text.includes("This page couldn't load"));
}
test62076Title();
