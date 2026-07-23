const http = require('http');

http.get('http://localhost:5000/api/news', (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
});
