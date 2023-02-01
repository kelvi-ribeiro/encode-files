
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

ThroughDirectory("..");

files.filter(f => !f.includes("bin") && !f.includes("obj")).forEach(async file => {
    const buffer = FS.readFileSync(file);
    console.log(file)
    const fileContent = buffer.toString();
    console.log(fileContent);
    FS.appendFileSync("./test.txt", fileContent + "\n" + file + "\n", () => {})
});
console.log(Buffer.from("Hello World").toString('base64'));
console.log(Buffer.from("SGVsbG8gV29ybGQ=", 'base64').toString('ascii'))