const { promises: fs } = require("fs");
const path = require("path");
require("dotenv").config();
const util = require('util');
var os = require("os");

async function throughDirectory(directory, files) {
    const items = await fs.readdir(directory);
    for (const item of items) {
        const absolute = path.join(directory, item);
        const stat = await fs.stat(absolute);
        if (stat.isDirectory()) {
            await throughDirectory(absolute, files);
        } else {
            files.push(absolute);
        }
    }
}

async function getFileContent(filename) {
    return (await fs.readFile(filename)).toString();
}

async function getContentToSave(fileContent) {
    return process.env.ENCODE_OR_DECODE === "ENCODE"
        ? Buffer.from(fileContent).toString("base64")
        : Buffer.from(fileContent, "base64").toString("ascii");
}

function getCompleteFilePath(file) {
    return path.join(process.env.FOLTER_PATH_TO_PASTE, file.replace(process.env.FOLDER_PATH_BASE_TO_IGNORE_ON_PASTE, ""));
}

async function createDirectoryIfDoesNotExists(directoryName) {
    try {
        await fs.mkdir(directoryName, { recursive: true });
    } catch (error) {
        if (error.code !== "EEXIST") {
            throw error;
        }
    }
}

console.log = function (content) {
    const logContent = util.format(content) + os.EOL;
    const directoryName = `${__dirname}${path.sep}debug`
    createDirectoryIfDoesNotExists(directoryName)
    fs.appendFile(`${directoryName}${path.sep}debug-${currentDate.getTime()}.log`, logContent, { flags: 'w' })
    process.stdout.write(logContent)
};


function removeAllIgnoredFiles(files) {
    console.log("files or folder to ignore: " + process.env.IGNORED_FILES_OR_FOLDERS);
    var ignoredFolders = process.env.IGNORED_FILES_OR_FOLDERS.split(',');
    return files.filter(f => !ignoredFolders.some(i => f.includes(i)));
}

async function copyAllFiles() {
    const allFiles = [];
    await throughDirectory(process.env.FOLDER_PATH_TO_COPY, allFiles);
    console.log(`${allFiles.length} were found in total`);
    const files = removeAllIgnoredFiles(allFiles);
    console.log(`${files.length} were found to copy`);
    for (let i = 0; i < files.length; i++) {
        console.log(`Processing: ${i + 1}/${files.length}`);
        const file = files[i];
        const fileContent = await getFileContent(file);
        const fileContentToSave = await getContentToSave(fileContent);
        const filePath = getCompleteFilePath(file);
        const filename = path.basename(filePath);
        console.log(`Starting to copy the file: '${filename}'`);
        const directoryName = path.dirname(filePath)
        await createDirectoryIfDoesNotExists(directoryName);
        await fs.writeFile(filePath, fileContentToSave);
    }
}

module.exports = {
    copyAllFiles
};