// CA module handles all requests to a CA and operations on the CA

// This functions creates a new CA per:
// https://jamielinux.com/docs/openssl-certificate-authority/create-the-root-pair.html
// For a clustered setup this would need to move to shared storage or a shared database
// for now I just want it up and running so i'll work locally
exports.create = function(input, res) {
    const fs = require('fs');

    fs.mkdir('./ca', (e) => { });
    fs.mkdir(`./ca/${input.name}`, (e) => { });
    fs.mkdir(`./ca/${input.name}/certs`, (e) => { });
    fs.mkdir(`./ca/${input.name}/crl`, (e) => { });
    fs.mkdir(`./ca/${input.name}/newcerts`, (e) => { });
    fs.mkdir(`./ca/${input.name}/private`, (e) => { });
    fs.chmod(`./ca/${input.name}/private`, "700", (e) => { });
    fs.appendFile(`./ca/${input.name}/index`, '', (e) => { });
    fs.appendFile(`./ca/${input.name}/serial`, '1000', (e) => { });

    console.log('Creating CA config from template');
    const util = require('../util.js');
    util.searchReplaceFile('./templates/ca.cnf', `./ca/${input.name}/ca.cnf`, ['%%dir%%'], [`./ca/${input.name}`]);

    // create a key
    const RSAKey = require('./rsakey.js');
    const req = require('./csr.js');

    const rsa = new RSAKey();

    rsa.create(`./ca/${input.name}/ca.key.pem`);
    rsa.on('complete', function() {
        console.log('Booyah!');
        req.create(`./ca/${input.name}/ca.cnf`, `./ca/${input.name}/ca.key.pem`, `./ca/${input.name}/certs/ca.cert.pem`, 'v3_ca', `${input.subject}`);
    });
}
