const { emitWarning } = require('process');

module.exports = function (app) {
    console.log("EPIC: MAKEMINI!");

    const fs = require('fs');
    const path = require('path');
    const { minify: minifyJS } = require('terser');
    const CleanCSS = require('clean-css');
    const { minify: minifyHTML } = require('html-minifier-terser');

    const cacheMap = {
        '.js': {},
        '.css': {},
        '.html': {}
    };

    app.use(async (req, res, next) => {
        let reqPath = req.path;
        let ext = path.extname(reqPath);
    
        // If no extension and ends with slash, assume index.html
        if (!ext && reqPath.endsWith('/')) {
            reqPath = path.join(reqPath, 'index.html');
            ext = '.html';
        }
    
        // If still no recognized extension, skip
        if (!['.js', '.css', '.html'].includes(ext)) return next();
    
        const filePath = path.join(__dirname, '../public', reqPath);
        const cache = cacheMap[ext];
    
        if (cache[reqPath] !== undefined) {
            res.setHeader('Content-Type', {
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.html': 'text/html'
            }[ext]);
            return res.send(cache[reqPath]);
        }
    
        try {
            const code = await fs.promises.readFile(filePath, 'utf8');
            let minified;
    
            if (ext === '.js') {
                const result = await minifyJS(code);
                minified = result.code;
            } else if (ext === '.css') {
                minified = new CleanCSS().minify(code).styles;
            } else if (ext === '.html') {
                minified = await minifyHTML(code, {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeEmptyAttributes: true,
                    minifyCSS: true,
                    minifyJS: true
                });
            }
    
            if (minified) {
                cache[reqPath] = minified;
                res.setHeader('Content-Type', {
                    '.js': 'application/javascript',
                    '.css': 'text/css',
                    '.html': 'text/html'
                }[ext]);
                return res.send(minified);
            } else {
                console.warn('Minification failed for', reqPath);
                return res.send(code); // fallback
            }
        } catch (err) {
            console.log("err", err);
            return next(); // Let express.static handle 404s or other errors
        }
    });
};
