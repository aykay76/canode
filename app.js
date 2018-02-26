// Main app.js file for node.js API interface to OpenSSL
// this will start a server and handle incoming call routing to different modules
const http = require('http');

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
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        inputParameters = JSON.parse(body);

        switch (inputParameters.module)
        {
            case "ca":
                const ca = require('./routes/ca.js');
                switch (inputParameters.method)
                {
                    case "create":
                        ca.create(inputParameters, res);
                        break;
                }
                break;
        }
    });
}

// https.createServer(options, webServer).listen(8080);
http.createServer(webServer).listen(8080);

console.log('Listening on 8080...');