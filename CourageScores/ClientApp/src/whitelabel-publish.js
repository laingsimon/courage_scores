/* istanbul ignore file */
import {readFile, writeFile, cp, readdir, existsSync} from 'fs';

const projectDir = process.argv[2].replaceAll('\\\\', '\\');
const publishDir = process.argv[3].replaceAll('\\\\', '\\');

/* if projectDir and publishDir are absolute paths; use the publishDir on its own, otherwise combine them */
const workingDir = publishDir.indexOf(projectDir) === 0
    ? publishDir
    : `${projectDir}${publishDir}`;

console.log(`WorkingDir = ${workingDir}`);
const contentPath = `${workingDir}wwwroot`;
console.log(`ContentPath = ${contentPath}`);

function readContent(path, callback) {
    readFile(path, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading: ' + path);
            console.error(err);
            return;
        }

        callback(data);
    });
}

function insertBuiltContentIntoWhiteLabelIndex(whiteLabelFilePath, builtContent, callback) {
    readContent(whiteLabelFilePath, (whiteLabelFileContent) => {
        const whiteLabelAndBuiltContent = whiteLabelFileContent.replace(/<\/title>(.+)<\/head>/s, '</title>' + builtContent + '</head>');
        console.log('Writing whitelabel content to ' + whiteLabelFilePath);
        writeFile(whiteLabelFilePath, whiteLabelAndBuiltContent, callback);
    });
}

function copyFile(path, fileName, callback) {
    console.log(`Copying ${fileName} to ${path}/${fileName}`);
    cp(contentPath + `/${fileName}`, path + `/${fileName}`, callback);
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

function getBuiltContentToAddToWhiteLabelTemplates(builtHtmlContent) {
    const result = builtHtmlContent.match(/<\/title>(.+)<\/head>/s);
    const fragment = result[1].replaceAll('>', '>\n');
    // console.log(`Built content: ${fragment}`);
    return fragment;
}

function removeCustomHeaderFromWebConfig(path, callback) {
    const webConfigPath = path + '/web.config';

    readContent(webConfigPath, (content) => {
        const newContent = content.replace(/<customHeaders>(.+)<\/customHeaders>/s, '');
        console.log('Writing updated web.config content to ' + webConfigPath);
        writeFile(webConfigPath, newContent, callback);
    });
}

readContent(contentPath + '/index.html', (content) => {
    const builtContent = getBuiltContentToAddToWhiteLabelTemplates(content); // find the segment to replace in the other files
    const filesToCopyIntoBrand = ['layout.css', 'web.config', 'manifest.json', 'host.html', 'parentHeight.js'];

    readdir(contentPath, (_, fileOrDirectoryName) => {
        const brandedPagePaths = fileOrDirectoryName
            .filter(f => f.indexOf('.') === -1) /* is a directory*/
            .map(brandDirectory => contentPath + '/' + brandDirectory)
            .filter(path => {
                if (existsSync(path + '/index.html')) {
                    return true;
                }

                // console.log(`DEBUG: Ignoring ${path}; file doesn't exist`);
                return false;
            });

        if (brandedPagePaths.length > 0) {
            console.log(`Replacing content in ${brandedPagePaths.length} files...`);
            exhaustArray(
                brandedPagePaths,
                (brandPath, callback) => insertBuiltContentIntoWhiteLabelIndex(
                    brandPath + '/index.html',
                    builtContent,
                    () => exhaustArray(
                        filesToCopyIntoBrand,
                        (file, cb) => copyFile(brandPath, file, cb),
                        () => removeCustomHeaderFromWebConfig(brandPath, callback))),
                () => {
                    console.log('Completed copying content');
                });
        } else {
            console.log('No files to update');
        }
    });
});
