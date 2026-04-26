const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const infoPath = path.join(rootDir, "info.json");

function fail(message) {
    console.error(message);
    process.exit(1);
}

function ensureFile(filePath) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        fail(`Missing required file: ${path.relative(rootDir, filePath)}`);
    }
}

function createCrcTable() {
    const table = new Uint32Array(256);

    for (let index = 0; index < 256; index += 1) {
        let current = index;
        for (let bit = 0; bit < 8; bit += 1) {
            current = (current & 1) !== 0 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
        }
        table[index] = current >>> 0;
    }

    return table;
}

const crcTable = createCrcTable();

function crc32(buffer) {
    let crc = 0xffffffff;

    for (const value of buffer) {
        crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(date) {
    const normalizedYear = Math.max(date.getFullYear(), 1980);

    return {
        time:
            (date.getHours() << 11) |
            (date.getMinutes() << 5) |
            Math.floor(date.getSeconds() / 2),
        date:
            ((normalizedYear - 1980) << 9) |
            ((date.getMonth() + 1) << 5) |
            date.getDate(),
    };
}

function createZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const entry of entries) {
        const fileName = entry.name.replace(/\\/g, "/");
        const nameBuffer = Buffer.from(fileName, "utf8");
        const compressedData = zlib.deflateRawSync(entry.data);
        const checksum = crc32(entry.data);
        const { time, date } = toDosDateTime(entry.modifiedAt);

        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(8, 8);
        localHeader.writeUInt16LE(time, 10);
        localHeader.writeUInt16LE(date, 12);
        localHeader.writeUInt32LE(checksum, 14);
        localHeader.writeUInt32LE(compressedData.length, 18);
        localHeader.writeUInt32LE(entry.data.length, 22);
        localHeader.writeUInt16LE(nameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);

        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(8, 10);
        centralHeader.writeUInt16LE(time, 12);
        centralHeader.writeUInt16LE(date, 14);
        centralHeader.writeUInt32LE(checksum, 16);
        centralHeader.writeUInt32LE(compressedData.length, 20);
        centralHeader.writeUInt32LE(entry.data.length, 24);
        centralHeader.writeUInt16LE(nameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);

        localParts.push(localHeader, nameBuffer, compressedData);
        centralParts.push(centralHeader, nameBuffer);
        offset += localHeader.length + nameBuffer.length + compressedData.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const endOfCentralDirectory = Buffer.alloc(22);
    endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
    endOfCentralDirectory.writeUInt16LE(0, 4);
    endOfCentralDirectory.writeUInt16LE(0, 6);
    endOfCentralDirectory.writeUInt16LE(entries.length, 8);
    endOfCentralDirectory.writeUInt16LE(entries.length, 10);
    endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
    endOfCentralDirectory.writeUInt32LE(offset, 16);
    endOfCentralDirectory.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDirectory, endOfCentralDirectory]);
}

ensureFile(infoPath);

const pluginInfo = JSON.parse(fs.readFileSync(infoPath, "utf8"));
const files = ["info.json", "main.js", pluginInfo.icon];
const entries = files.map((file) => {
    const fullPath = path.join(rootDir, file);
    ensureFile(fullPath);

    return {
        name: file,
        data: fs.readFileSync(fullPath),
        modifiedAt: fs.statSync(fullPath).mtime,
    };
});

const outputPath = path.join(distDir, `${pluginInfo.id}.potext`);
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(outputPath, createZip(entries));

console.log(`Created ${path.relative(rootDir, outputPath)}`);
