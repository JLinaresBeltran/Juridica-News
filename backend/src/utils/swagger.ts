import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema Editorial Jurídico API',
      version: '1.0.0',
      description: 'API for the Legal Editorial System with AI supervision',
      contact: {
        name: 'Editorial Jurídico Team',
        email: 'dev@editorialjuridico.com',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/*.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: `
      .topbar-wrapper .link {
        content: url('https://via.placeholder.com/150x50/1e89a7/ffffff?text=Editorial+Jurídico');
        width: 150px;
        height: auto;
      }
      .swagger-ui .topbar { 
        background-color: #1e89a7; 
      }
    `,
    customSiteTitle: 'Editorial Jurídico API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  }));
  
  // JSON endpoint for the specs
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};