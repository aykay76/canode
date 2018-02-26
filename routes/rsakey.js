var util = require('util');
var EventEmitter = require('events');

class RSAKey extends EventEmitter {
    create(path) {
        console.log('Creating new key pair for CA');
        const { spawn } = require('child_process');
    
        var openssl = spawn('openssl', ['genrsa', '-aes256', '-out', path, '4096']);
    
        //openssl.stdin.write('password');
        
        openssl.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        
        openssl.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
    
        openssl.on('close', (code) => {
            console.log('Done.');
            const fs = require('fs');
            fs.chmod(path, '400', () => { });
    
            this.emit('complete');
        });
    
        console.log('Continuing');
    }    
}


module.exports = RSAKey;
