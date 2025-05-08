module.exports = function (app) {
    console.log("EPIC: MAKEMINI!");

    const fs = require('fs');
    const path = require('path');
    const { minify } = require('terser');
    const CleanCSS = require('clean-css');

    const jsCache = {};
    const cssCache = {};

    app.use(async (req, res, next) => {
        const ext = path.extname(req.path);

        if (ext !== '.js' && ext !== '.css') return next();

        const filePath = path.join(__dirname, '../public', req.path);

        const cache = ext === '.js' ? jsCache : cssCache;
        if (cache[req.path] !== undefined) {
            res.setHeader('Content-Type', ext === '.js' ? 'application/javascript' : 'text/css');
            return res.send(cache[req.path]);
        }

        try {
            const code = await fs.promises.readFile(filePath, 'utf8');

            let minified;
            if (ext === '.js') {
                const result = await minify(code);
                minified = result.code;
            } else {
                minified = new CleanCSS().minify(code).styles;
            }

            if (minified) {
                cache[req.path] = minified;
                res.setHeader('Content-Type', ext === '.js' ? 'application/javascript' : 'text/css');
                return res.send(minified);
            } else {
                console.warn('Minification failed for', req.path);
                return res.send(code); // fallback
            }
        } catch (err) {
            console.log("err", err);
            return next(); // Let express.static handle 404s or other errors
        }
    });
};
