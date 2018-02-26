const util = require('util');
const EventEmitter = require('events');
const spawn = require('child_process').spawn;

class OpenSSL extends EventEmitter {
    genrsa(path, password) {    
        // TODO: make options like the algorithm and key length configurable
        var openssl = spawn('openssl', ['genrsa', '-aes256', '-passout', `pass:${password}`, '-out', path, '4096']);
            
        // openssl.stdout.on('data', (data) => {
        //     console.log(`${data}`);
        // });
        
        // openssl.stderr.on('data', (data) => {
        //     console.log(`${data}`);
        // });
    
        openssl.on('close', (code) => {
            const fs = require('fs');
            fs.chmod(path, '400', () => { });
            this.emit('genrsadone');
        });
    }

    req(configPath, keyPath, csrPath, subject, keyPass) {
        var openssl = spawn('openssl', ['req', '-config', configPath, '-new', '-sha256',
            '-passin', `pass:${keyPass}`,
            '-key', keyPath, '-out', csrPath, '-subj', `${subject}`]);
    
        openssl.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        openssl.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
        
        openssl.on('close', (code) => {
            let fs = require('fs');
            fs.chmod(csrPath, '444', (e) => { });
            
            this.emit('reqdone');
        });
    }

    selfsign(configPath, keyPath, csrPath, extensions, subject, keyPass) {
        // console.log('Creating new self-signed certificate');
        // console.log(`Config path: ${configPath}`);
        // console.log(`Key path: ${keyPath}`);
        // console.log(`CSR path: ${csrPath}`);
        // console.log(`Extensions: ${extensions}`);
        // console.log(`Subject: "${subject}"`);

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

    casign(configPath, caCertPath, csrPath, keyPath, certPath, keyPass) {
        // console.log('Creating new self-signed certificate');
        // console.log(`Config path: ${configPath}`);
        // console.log(`Key path: ${keyPath}`);
        // console.log(`CSR path: ${csrPath}`);

        var openssl = spawn('openssl', ['ca', '-config', configPath, '-extensions', 'v3_intermediate_ca', 
            '-cert', caCertPath, '-batch',
            '-keyfile', keyPath, '-days', '3650', '-notext', '-md', 'sha256', '-passin', `pass:${keyPass}`,
            '-in', csrPath, '-out', certPath]);
    
        openssl.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        openssl.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
        
        openssl.on('close', (code) => {
            let fs = require('fs');
            fs.chmod(csrPath, '444', (e) => { });
            
            this.emit('casigndone');
        });
    }
}

module.exports = OpenSSL;