var util = require('util');
var EventEmitter = require('events');

exports.create = function(configPath, keyPath, csrPath, extensions, subject) {
    console.log('Creating new self-signed certificate');

    const {spawn} = require('child_process');
    
    openssl = spawn('openssl', ['req', '-config', configPath, 
        '-key', keyPath, '-new', '-x509', '-days', '7300', '-sha256', 
        '-extensions', extensions, '-out', csrPath, '-subj', subject]);

    openssl.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    openssl.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
    
    openssl.on('close', (code) => {
        console.log('Closing...');
        fs = require('fs');
        fs.chmod(csrPath, '444');    
    });

    console.log('Continuing after CSR creation');
}
