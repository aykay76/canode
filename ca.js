const util = require('util');
const EventEmitter = require('events');
const OpenSSL = require('./openssl');

// CA module handles all requests to a CA and operations on the CA

// This functions creates a new CA per:
// https://jamielinux.com/docs/openssl-certificate-authority/create-the-root-pair.html
// For a clustered setup this would need to move to shared storage or a shared database
// for now I just want it up and running so i'll work locally
// TODO: flesh out the error handling here. Also come up with a standardised response format.
class CA extends EventEmitter {
    create(input, res) {
        const fs = require('fs');

        if (!fs.existsSync('./ca')) fs.mkdirSync('./ca');
        if (!fs.existsSync(`./ca/${input.name}`)) fs.mkdirSync(`./ca/${input.name}`, (e) => { if (e) console.log(e); });

        // create the folder structure for the root authority
        fs.mkdirSync(`./ca/${input.name}/root`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.name}/root/certs`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.name}/root/crl`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.name}/root/newcerts`, (e) => { if (e) console.log(e); });
        fs.mkdirSync(`./ca/${input.name}/root/private`, (e) => { if (e) console.log(e); });
        fs.chmodSync(`./ca/${input.name}/root/private`, "700", (e) => { if (e) console.log(e); });
        fs.appendFile(`./ca/${input.name}/root/index`, '', (e) => { if (e) console.log(e); });
        fs.appendFile(`./ca/${input.name}/root/serial`, '1000', (e) => { if (e) console.log(e); });

        // create the folder structure for the intermediate authority 
        fs.mkdirSync(`./ca/${input.name}/intermediate`);
        fs.mkdir(`./ca/${input.name}/intermediate/certs`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.name}/intermediate/crl`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.name}/intermediate/csr`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.name}/intermediate/newcerts`, (e) => { if (e) console.log(e); });
        fs.mkdirSync(`./ca/${input.name}/intermediate/private`, (e) => { if (e) console.log(e); });
        fs.chmod(`./ca/${input.name}/intermediate/private`, "700", (e) => { if (e) console.log(e); });
        fs.appendFile(`./ca/${input.name}/intermediate/index`, '', (e) => { if (e) console.log(e); });
        fs.appendFile(`./ca/${input.name}/intermediate/serial`, '1000', (e) => { if (e) console.log(e); });
    
        console.log('Creating root CA config from template');
        const util = require('./util');
        util.searchReplaceFile('./templates/ca.cnf', `./ca/${input.name}/ca.cnf`, ['%%dir%%'], [`./ca/${input.name}`]);
    
        console.log('Creating intermediate CA config from template');
        util.searchReplaceFile('./templates/int.cnf', `./ca/${input.name}/int.cnf`, ['%%dir%%'], [`./ca/${input.name}`]);

        // create a key
        const openssl = new OpenSSL();
    
        console.log('Creating new key pair for CA root');
        openssl.genrsa(`./ca/${input.name}/root/ca.key.pem`, input.keypass);
        openssl.on('genrsadone', () => {
            openssl.removeAllListeners('genrsadone');
            console.log('Creating self signed certificate for CA root');
            openssl.selfsign(`./ca/${input.name}/ca.cnf`, `./ca/${input.name}/root/ca.key.pem`, `./ca/${input.name}/root/certs/ca.cert.pem`, 'v3_ca', `${input.subject}`, `${input.keypass}`);
            openssl.on('selfsigndone', () => {
                openssl.removeAllListeners('selfsigndone');
                console.log('Creating new key pair for intermediate CA');
                openssl.genrsa(`./ca/${input.name}/intermediate/intermediate.key.pem`, input.keypass);
                openssl.on('genrsadone', () => {
                    openssl.removeAllListeners('genrsadone');
                    console.log('Creating signed certificate request for intermediate CA');
                    openssl.req(`./ca/${input.name}/int.cnf`, `./ca/${input.name}/intermediate/intermediate.key.pem`, `./ca/${input.name}/intermediate/csr/intermediate.csr.pem`, `${input.intSubject}`, `${input.keypass}`);
                    openssl.on('reqdone', () => {
                        openssl.removeAllListeners('reqdone');
                        console.log('Signing intermediate CSR with root private key');
                        openssl.casign(`./ca/${input.name}/ca.cnf`, `./ca/${input.name}/root/certs/ca.cert.pem`, `./ca/${input.name}/intermediate/csr/intermediate.csr.pem`, `./ca/${input.name}/root/ca.key.pem`, `./ca/${input.name}/intermediate/certs/intermediate.cert.pem`, input.keypass);
                        openssl.on('casigndone', () => {
                            openssl.removeAllListeners('casigndone');
                            console.log('New CA created');
                            this.emit('newcadone');
                        });
                    });
                });
            });
        });
    }
}

module.exports = CA;