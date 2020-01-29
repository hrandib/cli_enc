#!/usr/bin/env node

const parser = require('cue-parser');
const fs = require('fs').promises;
const path = require('path');

const resDir = "res";

function getNumberOfWithFilesType(files, type) {
    return files.filter(f => {
        const name = f.name;
        return path.extname(name) === ('.' + type);
    }).length
}

async function runOnDir(resDir) {
    console.log("Run on " + resDir);
    const entries = await fs.readdir(resDir, {withFileTypes: true});
    const dirs = entries.filter(f => f.isDirectory());
    const files = entries.filter(f => f.isFile());
    dirs.forEach(dir => runOnDir(dir.name));
    console.log("Flac files: " + getNumberOfWithFilesType(files, "flac"));
    console.log("Cue files: " + getNumberOfWithFilesType(files, "cue"));
    // if (getNumberOfWithFilesType(files, "flac") == getNumberOfWithFilesType(files, "cue")) {
    //     //use cue parser
    // }
    // else {
    //     //use direct conversion
    // }
}

runOnDir(resDir);