const http = require('http');
const data = JSON.stringify({ phone: '9016007312', password: 'password' });
const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response HTTP ' + res.statusCode + ':', body));
});
req.on('error', console.error);
req.write(data);
req.end();
