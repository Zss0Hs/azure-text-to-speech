const fs = require('fs');

fs.copyFile('worker.js', 'dist/worker.js', (err) => {
  if (err) throw err;
  console.log('worker.js was copied to dist/worker.js');
});
