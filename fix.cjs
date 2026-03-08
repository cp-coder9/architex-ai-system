const fs = require('fs');
const path = require('path');

let lintOutput = fs.readFileSync('lint_results.txt', 'utf8');
lintOutput = lintOutput.replace(/^\uFEFF/, ''); // remove BOM
// strip ansi color codes in case there are any
lintOutput = lintOutput.replace(/\x1B\[\d+m/g, '');

const fileErrors = {};
let currentFile = null;

const lines = lintOutput.split('\n');
for (let line of lines) {
    line = line.replace(/\r$/, '');

    // Example path match: `E:\Downloads\...\somefile.tsx`
    if (line.match(/^[a-zA-Z]:\\.*\.tsx?$/i)) {
        currentFile = line;
        fileErrors[currentFile] = [];
    } else if (currentFile && line.match(/^\s+\d+:\d+\s+(error|warning)/i)) {
        const match = line.match(/^\s+(\d+):(\d+)\s+(error|warning)\s+(.*?)\s+([@a-z\/-]+)$/i);
        if (match) {
            fileErrors[currentFile].push({
                line: parseInt(match[1]),
                col: parseInt(match[2]),
                type: match[3],
                msg: match[4],
                rule: match[5]
            });
        }
    }
}

let modifiedFilesCount = 0;

for (const [file, errors] of Object.entries(fileErrors)) {
    if (errors.length === 0) continue;

    if (!fs.existsSync(file)) {
        console.log(`File not found: ${file}`);
        continue;
    }

    let contentLines = fs.readFileSync(file, 'utf8').split('\n');
    let modified = false;

    const unusedVars = errors
        .filter(e => e.rule === '@typescript-eslint/no-unused-vars' && (e.msg.includes('is defined but never used') || e.msg.includes('is assigned a value but never used')))
        .map(e => {
            const m = e.msg.match(/'([^']+)'/);
            return m ? { name: m[1], line: e.line } : null;
        })
        .filter(Boolean);

    for (const { name, line } of unusedVars) {
        const i = line - 1;
        if (i < 0 || i >= contentLines.length) continue;

        let ln = contentLines[i];

        if (ln.startsWith('import ') || ln.includes(' from ')) {
            let prevLn = ln;
            ln = ln.replace(new RegExp(`\\b${name}\\b\\s*,?`, 'g'), '');
            ln = ln.replace(/,\s*}/g, ' }'); // cleanup trailing comma
            ln = ln.replace(/{\s*,\s*/g, '{ '); // cleanup leading comma
            ln = ln.replace(/(import\s*{\s*})\s*from.*/g, ''); // empty destructured import
            if (ln !== prevLn) {
                contentLines[i] = ln;
                modified = true;
            }
        } else {
            const rx = new RegExp(`\\b${name}\\b`);
            if (ln.match(rx)) {
                let prevLn = ln;
                ln = ln.replace(rx, `_${name}`);
                if (ln !== prevLn) {
                    contentLines[i] = ln;
                    modified = true;
                }
            }
        }
    }

    if (modified) {
        fs.writeFileSync(file, contentLines.join('\n'), 'utf8');
        console.log(`Modified ${file}`);
        modifiedFilesCount++;
    }
}

console.log(`Done. Modified ${modifiedFilesCount} files.`);
