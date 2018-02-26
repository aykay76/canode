exports.searchReplaceFile = function(oldFilename, newFilename, toReplace, replaceWith) {
    var fs = require('fs');
    var file = fs.createReadStream(oldFilename, 'utf8');

    file.on('data', function (chunk) {
        var newContent = chunk.toString();

        for (i = 0; i < toReplace.length; i++)
        {
            newContent = newContent.replace(toReplace[i], replaceWith[i]);
        }

        fs.appendFile(newFilename, newContent, () => { });
    });
}