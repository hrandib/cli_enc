#!/usr/bin/env node

const parser = require('cue-parser');
const fs = require('fs');

const cueDir = "cuedir";

fs.readdir(cueDir, (err, files) => {
    files.forEach(file => {
        const cuesheet = parser.parse(cueDir + "/" + file);
        console.log(cuesheet.performer);
        console.log(cuesheet.files);
        console.log(cuesheet.getCurrentFile().tracks);
    })
});
