const http = require('http');

http.get('http://localhost:3000/search', res => {
  console.log('Search page status code:', res.statusCode);
}).on('error', err => {
  console.error('Error fetching search page:', err.message);
});
