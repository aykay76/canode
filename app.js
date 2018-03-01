// Main app.js file for node.js API interface to OpenSSL
// this will start a server and handle incoming call routing to different modules
const https = require('https')
const fs = require('fs')
const CA = require('./ca')

console.log(process.env.CERTPWD)

const options = {
    key: fs.readFileSync(`${process.env.HOME}/canode/myOrg/myTeam/myProduct/intermediate/private/myServer.key.pem`),
    cert: fs.readFileSync(`${process.env.HOME}/canode/myOrg/myTeam/myProduct/intermediate/certs/myServer.cert.pem`),
    passphrase: `${process.env.CERTPWD}`
};

function webServer(req, res)
{
    let body = [];
    
    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async () => {
        // create a context object from the default in context.json to add input/output to
        // this is a simple state management for the request
        let context = require('./context.json');
        body = Buffer.concat(body).toString();
        context.rootPath = `${process.env.HOME}/canode`;
        context.input = JSON.parse(body);
        context.input.keypass = "adefaultpassword"; // this will obviously have to change!
        context.req = req;
        context.res = res;

        console.log(context);

        let responseString = "";

        switch (context.input.action)
        {
            case "key-create":
                const OpenSSL = require('./openssl');
                const openssl = new OpenSSL();
                const fs = require('fs');

                let path = `./${Math.random() * 1048576}`;
                if (context.input.organisation)
                {
                    context.caPath = `${context.rootPath}/${context.input.organisation}/${context.input.team}/${context.input.product}`;
                    path = `${context.caPath}/intermediate/private/${context.input.entity}.key.pem`;
                }

                await openssl.genrsa(context, path, context.input.keypass);

                const util = require('./util');
                let keydata = (await util.promisedFileRead(path)).split('\n');

                res.write(JSON.stringify({ "key": keydata }));
                res.end();

                // path was local because this wasn't a request for an entity key so delete it
                if (path.startsWith('./'))
                {
                    await fs.unlink(path);
                }

                break;
            case "ca-create":
                ca = new CA();
                responseString = await ca.create(context);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
            case "ca-get":
                ca = new CA();
                responseString = await ca.get(context);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
            case "cert-create":
            case "cert-get":
                ca = new CA();
                responseString = await ca.cert(context);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
            case "csr-create":
                ca = new CA();
                responseString = await ca.csr(context);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
            case "csr-sign":
                ca = new CA();
                responseString = await ca.sign(context);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
        }
    });
}

https.createServer(options, webServer).listen(8080);
//http.createServer(webServer).listen(8080);

console.log('Listening on 8080...');