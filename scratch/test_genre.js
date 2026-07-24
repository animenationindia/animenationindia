async function testGenreQuery() {
  const res = await fetch('http://localhost:3000/genre?name=Action');
  console.log("Status for /genre?name=Action:", res.status);
}
testGenreQuery();
