const { spawn } = require('child_process');
const path = require('path');

const cmd = 'npx';
const args = ['@bubblewrap/cli', 'build', '--skipPwaValidation'];
const cwd = path.resolve(__dirname, '..');

console.log(`Starting Bubblewrap build in ${cwd}...`);

const child = spawn(cmd, args, {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'] // We need to interact with stdin
});

child.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    if (output.includes('Password for the Key Store:') || output.includes('Password for the Key:')) {
        console.log("\n[SCRIPT] Detected password prompt, sending password...");
        child.stdin.write("android\n");
    }
});

child.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);
    
    // Sometimes prompts appear in stderr
    if (output.includes('Password for the Key Store:') || output.includes('Password for the Key:')) {
        console.log("\n[SCRIPT] Detected password prompt (stderr), sending password...");
        child.stdin.write("password\n");
    }
});

child.on('close', (code) => {
    console.log(`Bubblewrap process exited with code ${code}`);
    process.exit(code);
});
