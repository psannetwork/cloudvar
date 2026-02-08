const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const distPath = path.join(distDir, 'cloudvar.js');

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

console.log('Building and Obfuscating CloudVar client...');

const files = [
    'utils/index.js',
    'client/network.js',
    'client/binding.js',
    'client/index.js'
];

let combinedCode = '';

files.forEach(file => {
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    
    // 🌟 window. へのエクスポートブロックを抽出する
    content = content.replace(/if\s*\(typeof\s+window\s*!==\s*'undefined'.*?\)\s*\{([\s\S]*?)\}/g, '$1');

    combinedCode += `\n/* --- ${file} --- */\n${content}\n`;
});

// 全体を包む
const finalBundle = `(function(){\n${combinedCode}\n})();`;

try {
    const obfuscationResult = JavaScriptObfuscator.obfuscate(finalBundle, {
        compact: true,
        controlFlowFlattening: true,
        reservedNames: ['CloudVar', 'CloudVarNetwork', 'CloudVarBinding', 'CloudVarUtils']
    });

    fs.writeFileSync(distPath, obfuscationResult.getObfuscatedCode());

    const exampleDistPath = path.join(__dirname, '../examples/cloudvar.js');
    fs.copyFileSync(distPath, exampleDistPath);

    console.log(`Success! Obfuscated bundle created at: ${distPath}`);
} catch (e) {
    fs.writeFileSync(path.join(distDir, 'debug_raw_bundle.js'), finalBundle);
    throw e;
}
