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

        let cwd = process.cwd();

        if (!await fs.exists('./ca')) {
            await fs.mkdir('./ca', (e) => { if (e) console.log(e); });
        }
        process.chdir('./ca');

        console.log('Creating root CA config from template');
        util.searchReplaceFile('..//templates/ca.cnf', `ca.cnf`, ['%%dir%%'], [`.`]);
    
        console.log('Creating intermediate CA config from template');
        util.searchReplaceFile('..//templates/int.cnf', `int.cnf`, ['%%dir%%'], [`.`]);

        await fs.mkdir(`${input.organisation}`, (e) => { if (e) console.log(e); });
        process.chdir(`${input.organisation}`);

        await fs.mkdir(`${input.team}`, (e) => { if (e) console.log(e); });
        process.chdir(`${input.team}`);

        if (!fs.existsSync(`${input.name}`)) fs.mkdirSync(`${input.name}`, (e) => { if (e) console.log(e); });
        process.chdir(`${input.name}`);

        // create the folder structure for the root authority
        await fs.mkdir(`root`, (e) => { if (e) console.log(e); });
        fs.mkdir(`root/certs`, (e) => { if (e) console.log(e); });
        fs.mkdir(`root/crl`, (e) => { if (e) console.log(e); });
        fs.mkdir(`root/newcerts`, (e) => { if (e) console.log(e); });
        await fs.mkdir(`root/private`, (e) => { if (e) console.log(e); });
        fs.chmod(`root/private`, "700", (e) => { if (e) console.log(e); });
        fs.appendFile(`root/index`, '', (e) => { if (e) console.log(e); });
        fs.appendFile(`root/serial`, '1000', (e) => { if (e) console.log(e); });

        // create the folder structure for the intermediate authority 
        await fs.mkdir(`intermediate`, (e) => {if (e) console.log(e); });
        fs.mkdir(`intermediate/certs`, (e) => { if (e) console.log(e); });
        fs.mkdir(`intermediate/crl`, (e) => { if (e) console.log(e); });
        fs.mkdir(`intermediate/csr`, (e) => { if (e) console.log(e); });
        fs.mkdir(`intermediate/newcerts`, (e) => { if (e) console.log(e); });
        await fs.mkdir(`intermediate/private`, (e) => { if (e) console.log(e); });
        fs.chmod(`intermediate/private`, "700", (e) => { if (e) console.log(e); });
        fs.appendFile(`intermediate/index`, '', (e) => { if (e) console.log(e); });
        fs.appendFile(`intermediate/serial`, '1000', (e) => { if (e) console.log(e); });
    
        // create a key
        const openssl = new OpenSSL();

        input.subject = `/O=${input.organisation}/OU=${input.team}/CN=${input.name} Root`
        input.intSubject = `/O=${input.organisation}/OU=${input.team}/CN=${input.name} Intermediate`
    
        console.log('Creating new key pair for CA root');
        await openssl.genrsa(`root/ca.key.pem`, input.keypass);
        console.log('Creating self signed certificate for CA root');
        await openssl.selfsign(`ca.cnf`, `root/ca.key.pem`, `root/certs/ca.cert.pem`, 'v3_ca', `${input.subject}`, `${input.keypass}`);
        console.log('Creating new key pair for intermediate CA');
        await openssl.genrsa(`intermediate/intermediate.key.pem`, input.keypass);
        console.log('Creating signed certificate request for intermediate CA');
        await openssl.req(`int.cnf`, `intermediate/intermediate.key.pem`, `intermediate/csr/intermediate.csr.pem`, `${input.intSubject}`, `${input.keypass}`);
        console.log('Signing intermediate CSR with root private key');
        await openssl.casign(`ca.cnf`, `root/certs/ca.cert.pem`, `intermediate/csr/intermediate.csr.pem`, `root/ca.key.pem`, `intermediate/certs/intermediate.cert.pem`, input.keypass);
        console.log('New CA created');

        process.chdir(cwd);

        return await this.get(input);
    }
    
    async get(input)
    {
        const util = require('./util');

        let cwd = process.cwd();

        await process.chdir(`./ca/${input.organisation}/${input.team}/${input.name}`);

        let rootCertificate = await util.promisedFileRead(`root/certs/ca.cert.pem`);
        let intermediateCertificate = await util.promisedFileRead(`intermediate/certs/intermediate.cert.pem`);

        rootCertificate = rootCertificate.split('\n').join('');
        intermediateCertificate = intermediateCertificate.split('\n').join('');

        process.chdir(cwd);

        // this needs to return root certificate and intermediate certificate so that they can be added to trusted stored
        return { "rootCertificate": `"${rootCertificate}"`, "intermediateCertificate": `"${intermediateCertificate}"` }
    }
}

module.exports = CA;
