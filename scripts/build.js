const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '../src/client');
const utilsFile = path.join(__dirname, '../src/utils/index.js');
const distFile = path.join(__dirname, '../dist/cloudvar.js');

// 読み込む順番が重要
const files = [
    utilsFile,
    path.join(clientDir, 'network.js'),
    path.join(clientDir, 'binding.js'),
    path.join(clientDir, 'index.js')
];

console.log('Building CloudVar client...');

try {
    let bundle = `/**
 * CloudVar Client SDK
 * Build Date: ${new Date().toISOString()}
 */
\n`;

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        
        // CJSの module.exports 判定ブロックをまるごと削除 (ifブロック全体)
        content = content.replace(/if\s*\(typeof\s*module\s*!==\s*'undefined'[\s\S]*?\}\s*/g, '');
        // インラインの require を含む行、または require 単体を削除
        content = content.replace(/.*require\(.*\).*\n?/g, '');
        
        bundle += `// --- ${path.basename(file)} ---\n`;
        bundle += `(function(){\n${content}\n})();\n\n`;
    });

    if (!fs.existsSync(path.dirname(distFile))) {
        fs.mkdirSync(path.dirname(distFile));
    }

    fs.writeFileSync(distFile, bundle);
    console.log(`Success! Bundle created at: ${distFile}`);
} catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
}
