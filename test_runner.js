import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// --- This is the same logic we just added to the service ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ----------------------------------------------------------

const tagToRead = 'BIOLOGICAL_HMI.COOLING_TOWER_IN_FM_OUT_HMI';
const scriptPath = path.join(__dirname, 'ads.py');

console.log(`[Test Runner] Executing: python ${scriptPath} ${tagToRead}`);

const pythonProcess = spawn('python', [scriptPath, tagToRead]);

pythonProcess.stdout.on('data', (data) => {
  console.log(`[Test Runner] Python stdout: ${data.toString().trim()}`);
});

pythonProcess.stderr.on('data', (data) => {
  console.error(`[Test Runner] Python stderr: ${data.toString().trim()}`);
});

pythonProcess.on('close', (code) => {
  console.log(`[Test Runner] Python script exited with code ${code}`);
});
