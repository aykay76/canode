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
            case "newca":
                ca = new CA();

                responseString = await ca.create(inputParameters);

                // TODO: replace this with a proper response  :)
                res.write(JSON.stringify(responseString));
                res.end();
                break;
            case "getca":
                ca = new CA();
                responseString = await ca.get(inputParameters);
                res.write(JSON.stringify(responseString));
                res.end();
                break;
        }
    });
}

// https.createServer(options, webServer).listen(8080);
http.createServer(webServer).listen(8080);

console.log('Listening on 8080...');