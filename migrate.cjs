const { spawn } = require('child_process');

console.log('Starting database migration...');

const drizzlePush = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Send enter key to select the first option (create table)
setTimeout(() => {
  drizzlePush.stdin.write('\n');
}, 2000);

// Send 'y' to confirm
setTimeout(() => {
  drizzlePush.stdin.write('y\n');
}, 4000);

drizzlePush.on('close', (code) => {
  console.log(`Migration process exited with code ${code}`);
  process.exit(code);
});

drizzlePush.on('error', (error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});