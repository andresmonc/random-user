const fs = require('fs');
const path = require('path');

const version = '1.4';
const dataPath = path.join(__dirname, 'api', version, 'data');
const outputPath = path.join(__dirname, 'src', 'data.js');

const data = {};
const injects = {}; // We can't easily JSONify functions, but we can try to handle them or just bundle the code. 
// Actually, the injects are require() calls in the original code. 
// "injects[nat] = require(...)". 
// I should probably just copy the inject.js files and import them manually or dynamically.

// Let's just handle the text data first.
function readData() {
    const nats = fs.readdirSync(dataPath).filter(f => !f.startsWith('.'));
    
    nats.forEach(nat => {
        data[nat] = {};
        const listsPath = path.join(dataPath, nat, 'lists');
        
        if (fs.existsSync(listsPath)) {
            const lists = fs.readdirSync(listsPath).filter(f => f.endsWith('.txt'));
            lists.forEach(list => {
                const content = fs.readFileSync(path.join(listsPath, list), 'utf-8');
                // Split by newline and remove empty lines
                data[nat][path.basename(list, '.txt')] = content.split('\n').filter(l => l.trim() !== '');
            });
        }
    });

    // Write to file
    if (!fs.existsSync(path.join(__dirname, 'src'))) {
        fs.mkdirSync(path.join(__dirname, 'src'));
    }

    const fileContent = `export const data = ${JSON.stringify(data, null, 2)};`;
    
    fs.writeFileSync(outputPath, fileContent);
    console.log('Data bundle created at ' + outputPath);
}

readData();
