import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from '../utils/openapi.utils';

export const generateOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Tour Management API',
      version: '1.0.0',
      description: 'API for managing tours and bookings',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://api.example.com', description: 'Production' },
    ],
    tags: [
      { name: 'Tours', description: 'Tour management' },
      { name: 'Destinations', description: 'Destination management' },
      { name: 'Bookings', description: 'Booking management' },
    ],
  });
};