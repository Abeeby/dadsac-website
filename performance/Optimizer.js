// Optimisation des performances
class PerformanceOptimizer {
    constructor() {
        this.compression = require('compression');
        this.minify = require('minify');
        this.imagemin = require('imagemin');
    }

    setupMiddleware(app) {
        // Compression GZIP
        app.use(this.compression());
        
        // Cache-Control headers
        app.use((req, res, next) => {
            if (req.url.match(/\.(css|js|jpg|png)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000');
            }
            next();
        });
    }

    async optimizeAssets() {
        // Minification CSS/JS
        await this.minifyFiles();
        // Optimisation images
        await this.optimizeImages();
        // Génération des sprites
        await this.generateSprites();
    }

    async minifyFiles() {
        const files = await glob('public/**/*.{js,css}');
        for (const file of files) {
            const minified = await this.minify(file);
            await fs.writeFile(file.replace('.', '.min.'), minified);
        }
    }

    async optimizeImages() {
        await imagemin(['images/*.{jpg,png}'], {
            destination: 'public/images',
            plugins: [
                imageminMozjpeg({ quality: 80 }),
                imageminPngquant({ quality: [0.6, 0.8] })
            ]
        });
    }
} 