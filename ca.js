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
    async create(input) {
        const fs = require('fs');
        const util = require('./util');

        if (!await fs.exists('./ca')) {
            await fs.mkdir('./ca', (e) => { if (e) console.log(e); });
        }

        await fs.mkdir(`./ca/${input.organisation}`, (e) => { if (e) console.log(e); });

        await fs.mkdir(`./ca/${input.organisation}/${input.team}`, (e) => { if (e) console.log(e); });

        if (!fs.existsSync(`./ca/${input.organisation}/${input.team}/${input.name}`)) fs.mkdirSync(`./ca/${input.organisation}/${input.team}/${input.name}`, (e) => { if (e) console.log(e); });

        console.log('Creating root CA config from template');
        util.searchReplaceFile('./templates/ca.cnf', `./ca/${input.organisation}/${input.team}/${input.name}/ca.cnf`, ['%%dir%%'], [`./ca/${input.organisation}/${input.team}/${input.name}/root`]);
    
        console.log('Creating intermediate CA config from template');
        util.searchReplaceFile('./templates/int.cnf', `./ca/${input.organisation}/${input.team}/${input.name}/int.cnf`, ['%%dir%%'], [`./ca/${input.organisation}/${input.team}/${input.name}/intermediate`]);

        // create the folder structure for the root authority
        await fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/root`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/root/certs`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/root/crl`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/root/newcerts`, (e) => { if (e) console.log(e); });
        await fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/root/private`, (e) => { if (e) console.log(e); });
        fs.chmod(`./ca/${input.organisation}/${input.team}/${input.name}/root/private`, "700", (e) => { if (e) console.log(e); });
        fs.appendFile(`./ca/${input.organisation}/${input.team}/${input.name}/root/index`, '', (e) => { if (e) console.log(e); });
        fs.appendFile(`./ca/${input.organisation}/${input.team}/${input.name}/root/serial`, '1000', (e) => { if (e) console.log(e); });

        // create the folder structure for the intermediate authority 
        await fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate`, (e) => {if (e) console.log(e); });
        fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/certs`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/crl`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/csr`, (e) => { if (e) console.log(e); });
        fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/newcerts`, (e) => { if (e) console.log(e); });
        await fs.mkdir(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/private`, (e) => { if (e) console.log(e); });
        fs.chmod(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/private`, "700", (e) => { if (e) console.log(e); });
        fs.appendFile(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/index`, '', (e) => { if (e) console.log(e); });
        fs.appendFile(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/serial`, '1000', (e) => { if (e) console.log(e); });
    
        // create a key
        const openssl = new OpenSSL();

        input.subject = `/O=${input.organisation}/OU=${input.team}/CN=${input.name} Root`
        input.intSubject = `/O=${input.organisation}/OU=${input.team}/CN=${input.name} Intermediate`
    
        console.log('Creating new key pair for CA root');
        await openssl.genrsa(`./ca/${input.organisation}/${input.team}/${input.name}/root/ca.key.pem`, 
            input.keypass);

        console.log('Creating self signed certificate for CA root');
        await openssl.selfsign(`ca.cnf`, 
            `./ca/${input.organisation}/${input.team}/${input.name}/root/ca.key.pem`, 
            `./ca/${input.organisation}/${input.team}/${input.name}/root/certs/ca.cert.pem`, 
            'v3_ca', `${input.subject}`, `${input.keypass}`);

        console.log('Creating new key pair for intermediate CA');
        await openssl.genrsa(`./ca/${input.organisation}/${input.team}/${input.name}/intermediate/intermediate.key.pem`, 
            input.keypass);
        
        console.log('Creating signed certificate request for intermediate CA');
        await openssl.req(`int.cnf`, 
            `./ca/${input.organisation}/${input.team}/${input.name}/intermediate/intermediate.key.pem`, 
            `./ca/${input.organisation}/${input.team}/${input.name}/intermediate/csr/intermediate.csr.pem`, 
            `${input.intSubject}`, `${input.keypass}`);
        
        console.log('Signing intermediate CSR with root private key');
        await openssl.casign(`ca.cnf`, 
            `./ca/${input.organisation}/${input.team}/${input.name}/root/certs/ca.cert.pem`, 
            `./ca/${input.organisation}/${input.team}/${input.name}/intermediate/csr/intermediate.csr.pem`, 
            `./ca/${input.organisation}/${input.team}/${input.name}/root/ca.key.pem`, 
            `./ca/${input.organisation}/${input.team}/${input.name}/intermediate/certs/intermediate.cert.pem`, 
            input.keypass);
        console.log('New CA created');

        return await this.get(input);
    }
    
    async get(input)
    {
        const util = require('./util');

        let cadir = `./ca/${input.organisation}/${input.team}/${input.name}`;

        let rootCertificate = await util.promisedFileRead(`${cadir}/root/certs/ca.cert.pem`);
        let intermediateCertificate = await util.promisedFileRead(`${cadir}/intermediate/certs/intermediate.cert.pem`);

        rootCertificate = rootCertificate.split('\n').join('');
        intermediateCertificate = intermediateCertificate.split('\n').join('');

        // this needs to return root certificate and intermediate certificate so that they can be added to trusted stored
        return { "rootCertificate": `"${rootCertificate}"`, "intermediateCertificate": `"${intermediateCertificate}"` }
    }

    async createKeyPair(input)
    {
        
    }
}

module.exports = CA;
