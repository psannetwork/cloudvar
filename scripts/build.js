const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const distPath = path.join(distDir, 'cloudvar.js');

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

console.log('Building and Obfuscating CloudVar client...');

// 依存順に結合
const files = [
    'utils/index.js',
    'client/network.js',
    'client/binding.js',
    'client/index.js'
];

let combinedCode = '';

files.forEach(file => {
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    
    // 不要な Node.js 用コード (exports, require) を正規表現でクリーニング
    content = content.replace(/const\s+.*\s*=\s*require\(.*\);?/g, '');
    content = content.replace(/module\.exports\s*=\s*.*;?/g, '');
    content = content.replace(/if\s*\(typeof\s+module\s*!==\s*'undefined'.*\)\s*\{[\s\S]*?\}/g, '');
    content = content.replace(/if\s*\(typeof\s+window\s*!==\s*'undefined'.*\)\s*\{([\s\S]*?)\}/g, '$1');

    combinedCode += `// --- ${file} ---\n${content}\n`;
});

// 全体を即時関数(IIFE)でラップしてスコープを汚染しないようにする
const finalBundle = `(function(){\n${combinedCode}\n})();`;

// 🌟 難読化の実行
const obfuscationResult = JavaScriptObfuscator.obfuscate(finalBundle, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    numbersToExpressions: true,
    simplify: true,
    stringArrayThreshold: 0.75,
    splitStrings: true,
    splitStringsChunkLength: 10,
    unicodeEscapeSequence: false
});

fs.writeFileSync(distPath, obfuscationResult.getObfuscatedCode());

console.log(`Success! Obfuscated bundle created at: ${distPath}`);