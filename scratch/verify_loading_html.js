const http = require('http');

http.get('http://localhost:3000/home', res => {
  console.log("Status code for /home:", res.statusCode);
}).on('error', err => {
  console.error("Error:", err.message);
});
