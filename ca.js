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
    async create(context) {
        const fs = require('fs');
        const util = require('./util');

        if (!fs.existsSync(`${context.rootPath}`)) {
            await fs.mkdir(`${context.rootPath}`, (e) => { if (e) console.log(e); });
        }

        await fs.mkdir(`${context.rootPath}/${context.input.organisation}`, (e) => { if (e) console.log(e); });
        await fs.mkdir(`${context.rootPath}/${context.input.organisation}/${context.input.team}`, (e) => { if (e) console.log(e); });

        // let's make this a bit easier on ourselves
        context.caPath = `${context.rootPath}/${context.input.organisation}/${context.input.team}/${context.input.name}`;

        if (!await fs.exists(`${context.caPath}`)) {
            await fs.mkdir(`${context.caPath}`, (e) => { if (e) console.log(e); });
        }

        console.log('Creating root CA config from template');
        util.searchReplaceFile('./templates/ca.cnf', `${context.caPath}/ca.cnf`, ['%%dir%%'], [`${context.caPath}/root`]);
    
        console.log('Creating intermediate CA config from template');
        util.searchReplaceFile('./templates/int.cnf', `${context.caPath}/int.cnf`, ['%%dir%%'], [`${context.caPath}/intermediate`]);

        // create the folder structure for the root authority
        await fs.mkdir(`${context.caPath}/root`, (e) => { if (e) console.log(e); });
        fs.mkdir(`${context.caPath}/root/certs`, (e) => { if (e) console.log(e); });
        fs.mkdir(`${context.caPath}/root/crl`, (e) => { if (e) console.log(e); });
        fs.mkdir(`${context.caPath}/root/newcerts`, (e) => { if (e) console.log(e); });
        await fs.mkdir(`${context.caPath}/root/private`, (e) => { if (e) console.log(e); });
        fs.chmod(`${context.caPath}/root/private`, "700", (e) => { if (e) console.log(e); });
        fs.appendFile(`${context.caPath}/root/index`, '', (e) => { if (e) console.log(e); });
        fs.appendFile(`${context.caPath}/root/serial`, '1000', (e) => { if (e) console.log(e); });

        // create the folder structure for the intermediate authority 
        await fs.mkdir(`${context.caPath}/intermediate`, (e) => {if (e) console.log(e); });
        fs.mkdir(`${context.caPath}/intermediate/certs`, (e) => { if (e) console.log(e); });
        fs.mkdir(`${context.caPath}/intermediate/crl`, (e) => { if (e) console.log(e); });
        fs.mkdir(`${context.caPath}/intermediate/csr`, (e) => { if (e) console.log(e); });
        fs.mkdir(`${context.caPath}/intermediate/newcerts`, (e) => { if (e) console.log(e); });
        await fs.mkdir(`${context.caPath}/intermediate/private`, (e) => { if (e) console.log(e); });
        fs.chmod(`${context.caPath}/intermediate/private`, "700", (e) => { if (e) console.log(e); });
        fs.appendFile(`${context.caPath}/intermediate/index`, '', (e) => { if (e) console.log(e); });
        fs.appendFile(`${context.caPath}/intermediate/serial`, '1000', (e) => { if (e) console.log(e); });
    
        // create a key
        const openssl = new OpenSSL();

        context.input.subject = `/O=${context.input.organisation}/OU=${context.input.team}/CN=${context.input.name} Root`
        context.input.intSubject = `/O=${context.input.organisation}/OU=${context.input.team}/CN=${context.input.name} Intermediate`
    
        console.log('Creating new key pair for CA root');
        await openssl.genrsa(`${context.caPath}/root/ca.key.pem`, 
            context.input.keypass);

        console.log('Creating self signed certificate for CA root');
        await openssl.selfsign(`${context.caPath}/ca.cnf`, 
            `${context.caPath}/root/ca.key.pem`, 
            `${context.caPath}/root/certs/ca.cert.pem`, 
            'v3_ca', `${context.input.subject}`, `${context.input.keypass}`);

        console.log('Creating new key pair for intermediate CA');
        await openssl.genrsa(`${context.caPath}/intermediate/intermediate.key.pem`, 
            context.input.keypass);
        
        console.log('Creating signed certificate request for intermediate CA');
        await openssl.req(`${context.caPath}/int.cnf`, 
            `${context.caPath}/intermediate/intermediate.key.pem`, 
            `${context.caPath}/intermediate/csr/intermediate.csr.pem`, 
            `${context.input.intSubject}`, `${context.input.keypass}`);
        
        console.log('Signing intermediate CSR with root private key');
        await openssl.casign(`${context.caPath}/ca.cnf`, 
            `${context.caPath}/root/certs/ca.cert.pem`, 
            `${context.caPath}/intermediate/csr/intermediate.csr.pem`, 
            `${context.caPath}/root/ca.key.pem`, 
            `${context.caPath}/intermediate/certs/intermediate.cert.pem`, 
            context.input.keypass);
        console.log('New CA created');

        return await this.get(context);
    }
    
    async get(context)
    {
        const util = require('./util');

        context.caPath = `${context.rootPath}/${context.input.organisation}/${context.input.team}/${context.input.name}`;

        let rootCertificate = (await util.promisedFileRead(`${context.caPath}/root/certs/ca.cert.pem`)).split('\n');
        let intermediateCertificate = (await util.promisedFileRead(`${context.caPath}/intermediate/certs/intermediate.cert.pem`)).split('\n');

        // this needs to return root certificate and intermediate certificate so that they can be added to trusted stored
        return { "rootCertificate": rootCertificate, "intermediateCertificate": intermediateCertificate }
    }
}

module.exports = CA;
