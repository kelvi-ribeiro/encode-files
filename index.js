
require('dotenv').config();
const Path = require("path");
const FS = require("fs");
let files = [];

function ThroughDirectory(Directory) {
    FS.readdirSync(Directory).forEach(file => {
        const Absolute = Path.join(Directory, file);
        if (FS.statSync(Absolute).isDirectory()) {
            return ThroughDirectory(Absolute);
        }
        else {
            return files.push(Absolute);
        }
    });
}

function getFileContent(filename) {
    const buffer = FS.readFileSync(filename);
    return buffer.toString();
}

function getContentToSave(fileContent) {
    if (process.env.ENCODE_OR_DECODE = "ENCODE") {
        return Buffer.from(fileContent).toString('base64');
    } else {
        return Buffer.from(fileContent, 'base64').toString('ascii');
    }
}

function getCompleteFilePath(file) {
    return process.env.FOLTER_PATH_TO_PASTE + "\\" + file.replace(process.env.FOLDER_PATH_BASE_TO_IGNORE_ON_PASTE, "")
}

function getFilename(fullFilename) {
    return fullFilename.substring(fullFilename.lastIndexOf("\\") + 1, fullFilename.length)
}

function getDiretoryName(filePath) {
    return filePath.substring(0, filePath.lastIndexOf("\\") + 1)
}

function createDirectoryIfDoesNotExists(directoryName) {
    if (!FS.existsSync(directoryName)) {
        FS.mkdirSync(directoryName, { recursive: true }, () => { })
    }
}

ThroughDirectory(process.env.FOLDER_PATH_TO_COPY);

files.filter(f => !f.includes("bin") && !f.includes("obj")).forEach((file, index) => {
    const fileContent = getFileContent(file)
    const fileContentToSave = getContentToSave(fileContent);
    var filePath = getCompleteFilePath(file)
    const filename = getFilename(filePath)
    console.log(`Starting to copy the file: '${filename}'`)
    console.log(`Remaining files: ${index + 1}/${files.length}`)
    const directoryName = getDiretoryName(filePath)
    createDirectoryIfDoesNotExists(directoryName)
    FS.writeFileSync(filePath, fileContentToSave, () => { })
});