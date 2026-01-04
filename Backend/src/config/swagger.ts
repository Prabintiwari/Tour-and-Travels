import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
const PORT = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API Documentation",
      version: "1.0.0",
      description: "A description of my API",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
  },

  apis: [
    "./src/index.ts", 
    "./src/routes/*.ts", 
    "./src/routes/**/*.ts", 
    "./src/docs/*.ts"
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
