const { promises: fs } = require("fs");
const path = require("path");
require("dotenv").config();
const util = require('util');
var os = require("os");
const currentDate = new Date();
const { Timer } = require('timer-node');
var aes = require("crypto-js/aes");
var encUtf8 = require("crypto-js/enc-utf8");

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
        ? hash(fileContent)
        : unhash(fileContent);
}

function getCompleteFilePath(file) {
    return path
                .join(process.env.FOLTER_PATH_TO_PASTE, file.replace(process.env.FOLDER_PATH_TO_COPY, "")
                .split(path.sep).map(d => {
                    if(process.env.FOLTER_PATH_TO_PASTE.split(path.sep).includes(d)){
                        return d;
                    }
                    if (process.env.ENCODE_OR_DECODE === "ENCODE") {
                        return encode(d);
                    }
                    return decode(d);
                }).join(path.sep));
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

function hash(content) {
    return aes.encrypt(content, process.env.SECRET_KEY_TO_HASH).toString();
}

function unhash(content) {
    return aes.decrypt(content, process.env.SECRET_KEY_TO_HASH).toString(encUtf8);
}

function encode(content) {
    return Buffer.from(content).toString("base64")
}

function decode(content) {
    return Buffer.from(content, "base64").toString("ascii")
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
    const timer = new Timer()
    timer.start()
    console.log("Starting copying all files")
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
        const directoryName = path.dirname(filePath);
        await createDirectoryIfDoesNotExists(directoryName);
        await fs.writeFile(filePath, fileContentToSave);
    }
    console.log(`Files copied in ${Math.floor(timer.ms() / 1000)} seconds.`)
}

module.exports = {
    copyAllFiles
};