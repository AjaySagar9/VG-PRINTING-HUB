const https = require('https');

https.get('https://maps.app.goo.gl/FHPwBkKwJKdtv76z6', (res) => {
  console.log("REDIRECT URL:", res.headers.location);
}).on('error', (e) => {
  console.error(e);
});
