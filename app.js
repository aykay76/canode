// Main app.js file for node.js API interface to OpenSSL
// this will start a server and handle incoming call routing to different modules
const http = require('http');
const CA = require('./ca');

const options = {
    key: null, //fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
    cert: null //fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};

function webServer(req, res)
{
    let inputParameters = null;
    let body = [];
    
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        body = Buffer.concat(body).toString();
        inputParameters = JSON.parse(body);

        let responseString = "";

        switch (inputParameters.action)
        {
            case "key-create":
                const OpenSSL = require('./openssl');
                const openssl = new OpenSSL();
                const fs = require('fs');
                let path = `./${Math.random() * 1048576}`;
                await openssl.genrsa(path, inputParameters.keypass);

                const util = require('./util');
                let keydata = await util.promisedFileRead(path);
                keydata = keydata.split('\n').join('');
                res.write(`{ "key": "${keydata}" }`);
                res.end();

                await fs.unlink(path);

                break;
            case "ca-create":
                ca = new CA();
                responseString = await ca.create(inputParameters);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
            case "ca-get":
                ca = new CA();
                responseString = await ca.get(inputParameters);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
            case "cert-create":
                ca = new CA();
                responseString = await ca.createCertificate(inputParameters);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
        }
    });
}

// https.createServer(options, webServer).listen(8080);
http.createServer(webServer).listen(8080);

console.log('Listening on 8080...');