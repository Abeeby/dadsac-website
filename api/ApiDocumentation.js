// Documentation API
class ApiDocumentation {
    constructor() {
        this.swagger = require('swagger-jsdoc');
        this.swaggerUi = require('swagger-ui-express');
    }

    generateDocs() {
        const swaggerOptions = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'API DADSAC',
                    version: '1.0.0',
                    description: 'Documentation API pour DADSAC'
                },
                servers: [{
                    url: 'https://api.dadsac.org/v1'
                }]
            },
            apis: ['./routes/*.js']
        };

        return this.swagger(swaggerOptions);
    }

    setupSwaggerUI(app) {
        const specs = this.generateDocs();
        app.use(
            '/api-docs',
            this.swaggerUi.serve,
            this.swaggerUi.setup(specs, {
                explorer: true,
                customSiteTitle: 'Documentation API DADSAC'
            })
        );
    }

    /**
     * @swagger
     * /donations:
     *   post:
     *     summary: Créer un nouveau don
     *     tags: [Donations]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               amount:
     *                 type: number
     *               currency:
     *                 type: string
     *     responses:
     *       200:
     *         description: Don créé avec succès
     */
    documentEndpoints() {
        // La documentation est générée automatiquement à partir
        // des commentaires dans le code
    }
} 