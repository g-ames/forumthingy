const { spawn } = require('child_process');

setTimeout(() => {
    console.log('\nRestarting server...');
    spawn('node', ['server.js'], {
        stdio: 'inherit',
        shell: true,
    });
}, 3000);