const util = require('util');
const EventEmitter = require('events');
const {spawn} = require('child_process');

class OpenSSL extends EventEmitter {
    genrsa(path, password) {
        console.log('Creating new key pair for CA');
        const { spawn } = require('child_process');
    
        var openssl = spawn('openssl', ['genrsa', '-aes256', '-passout', `pass:${password}`, '-out', path, '4096']);
            
        // openssl.stdout.on('data', (data) => {
        //     console.log(`${data}`);
        // });
        
        // openssl.stderr.on('data', (data) => {
        //     console.log(`${data}`);
        // });
    
        openssl.on('close', (code) => {
            // const fs = require('fs');

            // This is a bit too secure, can't even read it to sign the certs!
            // fs.chmod(path, '400', () => { });
    
            this.emit('genrsadone');
        });
    }

    selfsign(configPath, keyPath, csrPath, extensions, subject, keyPass) {
        console.log('Creating new self-signed certificate');
        console.log(`Config path: ${configPath}`);
        console.log(`Key path: ${keyPath}`);
        console.log(`CSR path: ${csrPath}`);
        console.log(`Extensions: ${extensions}`);
        console.log(`Subject: "${subject}"`);

        var openssl = spawn('openssl', ['req', '-config', configPath, 
            '-key', keyPath, '-new', '-x509', '-days', '7300', '-sha256', '-passin', `pass:${keyPass}`,
            '-extensions', extensions, '-out', csrPath, '-subj', `${subject}`]);
    
        openssl.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        openssl.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
        
        openssl.on('close', (code) => {
            let fs = require('fs');
            fs.chmod(csrPath, '444', (e) => { });
            
            this.emit('selfsigndone');
        });
    }
}

module.exports = OpenSSL;