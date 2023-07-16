/* istanbul ignore file */
const fs = require('fs');
const projectDir = process.argv[2].replaceAll('\\\\', '\\');
const publishDir = process.argv[3].replaceAll('\\\\', '\\');

/* if projectDir and publishDir are absolute paths; use the publishDir on its own, otherwise combine them */
const workingDir = publishDir.indexOf(projectDir) === 0
    ? publishDir
    : `${projectDir}${publishDir}`;

console.log(`WorkingDir = ${workingDir}`);
const contentPath = `${workingDir}wwwroot`;

function readContent(path, callback) {
    fs.readFile(path, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading: ' + path);
            console.error(err);
            return;
        }

        callback(data);
    });
}

function replaceContent(path, replacement, callback) {
    readContent(path, (content) => {
        const newContent = content.replace(/<\/title>(.+)<\/head>/s, '</title>' + replacement + '</head>');
        console.log('Writing whitelabel content to ' + path);
        fs.writeFile(path, newContent, callback);
    });
}

function copyFile(path, fileName, callback) {
    console.log(`Copying ${fileName} to ${path}/${fileName}`);
    fs.cp(contentPath + `/${fileName}`, path + `/${fileName}`, callback);
}

function exhaustArray(array, itemCallback, completeCallback) {
    if (array.length === 0) {
        completeCallback();
        return;
    }

    const item = array.shift();
    itemCallback(item, () => {
        exhaustArray(array, itemCallback, completeCallback);
    });
}

function getContentForReplacement(content) {
    const result = content.match(/<\/title>(.+)<\/head>/s);
    const fragment = result[1].replaceAll('>', '>\n');
    console.log(`Built content: ${fragment}`);
    return fragment;
}

readContent(contentPath + '/index.html', (content) => {
    const segment = getContentForReplacement(content); // find the segment to replace in the other files
    const filesToCopyIntoBrand = ['basic.css', 'web.config', 'manifest.json', 'host.html', 'parentHeight.js'];

    fs.readdir(contentPath, (x, fileOrDirectoryName) => {
        const brandedPagePaths = fileOrDirectoryName
            .filter(f => f.indexOf('.') === -1) /* is a directory*/
            .map(brandDirectory => contentPath + '/' + brandDirectory)
            .filter(path => {
                if (fs.existsSync(path + '/index.html')) {
                    return true;
                }

                // console.log(`DEBUG: Ignoring ${path}; file doesn't exist`);
                return false;
            });

        if (brandedPagePaths.length > 0) {
            console.log(`Replacing content in ${brandedPagePaths.length} files...`);
            exhaustArray(
                brandedPagePaths,
                (brandPath, callback) => replaceContent(
                    brandPath + '/index.html',
                    segment,
                    () => exhaustArray(
                        filesToCopyIntoBrand,
                        (file, cb) => copyFile(brandPath, file, cb),
                        callback)),
                () => {
                    console.log('Completed copying content');
                });
        } else {
            console.log('No files to update');
        }
    });
});
