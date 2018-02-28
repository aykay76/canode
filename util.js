exports.searchReplaceFile = function(oldFilename, newFilename, toReplace, replaceWith) {
    const fs = require('fs');
    var file = fs.createReadStream(oldFilename, 'utf8');

    file.on('data', (chunk) => {
        var newContent = chunk.toString();

        for (i = 0; i < toReplace.length; i++)
        {
            newContent = newContent.replace(toReplace[i], replaceWith[i]);
        }

        fs.appendFile(newFilename, newContent, () => { });
    });
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