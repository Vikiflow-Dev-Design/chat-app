console.log('Testing server.js for syntax errors');
try {
  require('./server');
  console.log('No syntax errors found in server.js');
} catch (error) {
  console.error('Syntax error found:', error);
}
