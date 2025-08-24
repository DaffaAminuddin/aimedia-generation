const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');

async function build() {
    const buildDir = 'dist';

    try {
        // Clean and create build directory
        await fs.rm(buildDir, { recursive: true, force: true });
        await fs.mkdir(buildDir, { recursive: true });

        // Build the main JS file
        await esbuild.build({
            entryPoints: ['index.tsx'],
            bundle: true,
            minify: true,
            sourcemap: true,
            outfile: path.join(buildDir, 'index.js'),
            jsx: 'automatic',
            loader: { '.tsx': 'tsx' },
        });

        // Read original index.html
        let htmlContent = await fs.readFile('index.html', 'utf-8');

        // Remove the importmap and replace the module script
        htmlContent = htmlContent.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
        htmlContent = htmlContent.replace(
            /<script type="module" src="\/index.tsx"><\/script>/,
            '<script src="/index.js" defer></script>'
        );
        
        // Write the new index.html to the build directory
        await fs.writeFile(path.join(buildDir, 'index.html'), htmlContent);

        // Copy metadata.json
        await fs.copyFile('metadata.json', path.join(buildDir, 'metadata.json'));

        console.log('Build successful!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
