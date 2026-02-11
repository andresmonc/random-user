import { Generator } from './Generator';

const generator = new Generator();

async function run() {
    // Parse query params
    const params = new URLSearchParams(window.location.search);
    const options = Object.fromEntries(params.entries());
    
    // Default to 1 result if not specified
    if (!options.results) options.results = 1;

    try {
        const result = await generator.generate(options);
        
        let output = result.output;
        if (result.ext === 'json') {
             try {
                // Formatting is already done in Generator if format=pretty
                // But let's pretty print by default if looked at in browser
                const jsonObj = JSON.parse(output);
                document.getElementById('output').textContent = JSON.stringify(jsonObj, null, 2);
             } catch (e) {
                document.getElementById('output').textContent = output;
             }
        } else {
             document.getElementById('output').textContent = output;
        }

    } catch (e) {
        console.error(e);
        document.getElementById('output').textContent = 'Error: ' + e.message;
    }
}

run();
