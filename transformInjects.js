const fs = require('fs');
const path = require('path');

const version = '1.4';
const dataPath = path.join(__dirname, 'api', version, 'data');
const outputDir = path.join(__dirname, 'src', 'injects');

const nats = fs.readdirSync(dataPath).filter(f => !f.startsWith('.'));
let indexContent = '';

nats.forEach(nat => {
    const injectPath = path.join(dataPath, nat, 'inject.js');
    if (fs.existsSync(injectPath)) {
        let content = fs.readFileSync(injectPath, 'utf-8');
        
        // Transform CommonJS to ESM
        content = content.replace(/const {([^}]+)} = require\(['"]\.\.\/\.\.\/api['"]\);/, 'import { $1 } from "../utils";');
        content = content.replace('module.exports =', 'export default');
        
        fs.writeFileSync(path.join(outputDir, `${nat}.js`), content);
        indexContent += `import ${nat} from './${nat}';\n`;
    }
});

indexContent += `\nexport const injects = {\n`;
nats.forEach(nat => {
    if (fs.existsSync(path.join(dataPath, nat, 'inject.js'))) {
        indexContent += `  ${nat},\n`;
    }
});
indexContent += `};\n`;

fs.writeFileSync(path.join(outputDir, 'index.js'), indexContent);
console.log('Injects transformed.');
