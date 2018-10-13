exports.searchReplaceFile = function(oldFilename, newFilename, toReplace, replaceWith) {
    const fs = require('fs');
    var file = fs.createReadStream(oldFilename, 'utf8');

    fs.unlink(newFilename, () => { });

    file.on('data', (chunk) => {
        var newContent = chunk.toString();

        for (i = 0; i < toReplace.length; i++)
        {
            newContent = newContent.replace(toReplace[i], replaceWith[i]);
        }

        fs.appendFile(newFilename, newContent, () => { });
    });
}

exports.mkdir = function(name)
{
    const fs = require('fs');

    if (fs.existsSync(name)) return true;

    var attempt = 1;
    while (attempt < 5)
    {
        fs.mkdirSync(name)

        if (fs.existsSync(name))
        {
            return true;
        }
        else
        {
            attempt++
        }
    }

    return false
}

exports.promisedFileRead = function(filename)
{
    return new Promise((resolve, reject) => {
        try
        {
            const fs = require('fs');
            var file = fs.createReadStream(filename, 'utf8');
            let content = "";
        
            file.on('data', (chunk) => {
                content += chunk.toString();
            });
            file.on('end', () => {
                resolve(content);
            });
        }
        catch (err)
        {
            reject(err);
        }
    });
}

exports.generatePassword = function()
{
    let charset = ['A','B','C','D','E','F','G','H','J','K','L','M','O','P','S','T','U','W','X','Y','Z'];
    let password = "";

    for (i = 0; i < 16; i++)
    {
        password += charset[Math.floor(Math.random() * (charset.length - 1))];
    }

    return password;
}