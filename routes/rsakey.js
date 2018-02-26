var util = require('util');
var EventEmitter = require('events');

class RSAKey extends EventEmitter {
    create(path, password) {
        console.log('Creating new key pair for CA');
        const { spawn } = require('child_process');
    
        var openssl = spawn('openssl', ['genrsa', '-aes256', '-passout', `pass:${password}`, '-out', path, '4096']);
            
        openssl.stdout.on('data', (data) => {
            console.log(`${data}`);
        });
        
        openssl.stderr.on('data', (data) => {
            console.log(`${data}`);
            if (data.toString().match('e is 65537') != null){
                openssl.stdin.write('password');
            }
        });
    
        openssl.on('close', (code) => {
            console.log('Done.');
            const fs = require('fs');
            fs.chmod(path, '400', () => { });
    
            this.emit('complete');
        });
    }    
}


module.exports = RSAKey;
