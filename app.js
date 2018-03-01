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
                await openssl.genrsa(path, context.input.keypass);

                const util = require('./util');
                let keydata = (await util.promisedFileRead(path)).split('\n');

                res.write(JSON.stringify({ "key": keydata }));
                res.end();

                await fs.unlink(path, (err) => { if (err) console.log(err); });

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
                ca = new CA();
                responseString = await ca.createCertificate(context);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
        }
    });
}

// https.createServer(options, webServer).listen(8080);
http.createServer(webServer).listen(8080);

console.log('Listening on 8080...');