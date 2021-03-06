const util = require('util')
const EventEmitter = require('events')
const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')

class OpenSSL extends EventEmitter {
    genrsa(context, keyPath, keyPassFile) {    
        return new Promise((resolve, reject) => {
            try
            {
                if (fs.existsSync(keyPassFile))
                {
                    fs.unlinkSync(keyPassFile);
                }
                fs.appendFileSync(keyPassFile, context.input.keypass)

                // TODO: make options like the algorithm and key length configurable
                var openssl = spawn('openssl', ['genrsa', '-aes256', '-passout', `file:${keyPassFile}`, '-out', keyPath, '4096']);

                if (context.debugOpenSSL)
                {
                    openssl.stdout.on('data', (data) => {
                        console.log(`${data}`);
                    });
                    
                    openssl.stderr.on('data', (data) => {
                        console.log(`${data}`);
                    });
                }
                openssl.on('close', (code) => {
                    const fs = require('fs');
                    console.log(keyPath)
                    fs.chmod(keyPath, '400', () => { });
                    this.emit('genrsadone');
                    resolve();
                });
            } catch(err) {
                console.log(err)
                reject(err)
            }
        });
    }

    req(context, configPath, keyPath, keyPassFile, csrPath, subject) {
        return new Promise((resolve,reject) => {
            try
            {
                var openssl = spawn('openssl', ['req', '-config', configPath, '-new', '-sha256',
                '-passin', `file:${keyPassFile}`,
                '-key', keyPath, '-out', csrPath, '-subj', `${subject}`]);
        
                if (context.debugOpenSSL)
                {
                    openssl.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    openssl.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`);
                    });
                }

                openssl.on('close', (code) => {
                    let fs = require('fs');
                    fs.chmod(csrPath, '444', (e) => { });
                    
                    this.emit('reqdone');
                    resolve();
                });
            }
            catch (err) 
            {
                reject(err);
            }
        });
    }

    genocsp(context) {
        return new Promise((resolve,reject) => {
            try
            {
                var openssl = spawn('openssl', ['ca', '-config', `${context.caPath}/int.cnf`, '-gencrl', 
                '-out', `${context.caPath}/intermediate/crl/intermediate.crl.pem`]);
        
                if (context.debugOpenSSL)
                {
                    openssl.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    openssl.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`);
                    });
                }

                openssl.on('close', (code) => {
                    this.emit('gencrldone');
                    resolve();
                });
            }
            catch (err) 
            {
                reject(err);
            }
        });
    }

    gencrl(context) {
        return new Promise((resolve,reject) => {
            try
            {
                var openssl = spawn('openssl', ['ca', '-config', `${context.caPath}/int.cnf`, '-gencrl', 
                '-out', `${context.caPath}/intermediate/crl/intermediate.crl.pem`]);
        
                if (context.debugOpenSSL)
                {
                    openssl.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    openssl.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`);
                    });
                }

                openssl.on('close', (code) => {
                    this.emit('gencrldone');
                    resolve();
                });
            }
            catch (err) 
            {
                reject(err);
            }
        });
    }

    revoke(context) {
        return new Promise((resolve,reject) => {
            try
            {
                var openssl = spawn('openssl', ['ca', '-config', `${context.caPath}/int.cnf`, 
                '-revoke', `${context.caPath}/intermediate/certs/${context.entity}.cert.pem`]);
        
                if (context.debugOpenSSL)
                {
                    openssl.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    openssl.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`);
                    });
                }

                openssl.on('close', (code) => {                    
                    this.emit('revokedone');
                    resolve();
                });
            }
            catch (err) 
            {
                reject(err);
            }
        });
    }

    selfsign(context, configPath, keyPath, keyPassFile, csrPath, extensions) {
        return new Promise((resolve, reject) => {
            try
            {
                var openssl = spawn('openssl', ['req', '-config', configPath, 
                '-key', keyPath, '-new', '-x509', '-days', '7300', '-sha256', '-passin', `file:${keyPassFile}`,
                '-extensions', extensions, '-out', csrPath, '-subj', `${context.input.subject}`]);
        
                if (context.debugOpenSSL)
                {
                    openssl.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    openssl.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`);
                    });
                }
                
                openssl.on('close', (code) => {
                    let fs = require('fs');
                    fs.chmod(csrPath, '444', (e) => { });
                    
                    this.emit('selfsigndone');
                    resolve();
                });
            }
            catch (err)
            {
                reject(err);
            }
        });
        // console.log('Creating new self-signed certificate');
        // console.log(`Config path: ${configPath}`);
        // console.log(`Key path: ${keyPath}`);
        // console.log(`CSR path: ${csrPath}`);
        // console.log(`Extensions: ${extensions}`);
        // console.log(`Subject: "${subject}"`);
    }

    casign(context, configPath, extensions, days, csrPath, keyPath, keyPassFile, certPath) {
        console.log('Method: casign');
        console.log(`Config path: ${configPath}`);
        console.log(`Key path: ${keyPath}`);
        console.log(`CSR path: ${csrPath}`);
        console.log(`Cert path: ${certPath}`);
        console.log(`Key file: ${keyPassFile}`);

        return new Promise((resolve,reject) => {
            try
            {
                var openssl = spawn('openssl', ['ca', '-config', configPath, '-extensions', extensions, 
                '-batch',
                '-keyfile', keyPath, '-days', days, '-notext', '-md', 'sha256', '-passin', `file:${keyPassFile}`,
                '-in', csrPath, '-out', certPath, '-verbose'], { env: { CERTSAN: `DNS:${context.input.entity}`}});
        
                if (context.debugOpenSSL)
                {
                    openssl.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });
                    openssl.stderr.on('data', (data) => {
                        console.log(`stderr: ${data}`);
                    });
                }
                
                openssl.on('close', (code) => {
                    let fs = require('fs');
                    fs.chmod(csrPath, '444', (e) => { });
                    
                    this.emit('casigndone');
                    resolve();
                });
            }
            catch (err)
            {
                reject(err);
            }
        });
    }
}

module.exports = OpenSSL;