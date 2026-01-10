import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from '../utils/openapi.utils';
import { swaggerSecurity } from './security';

export const generateOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  // Generate base document
  const doc = generator.generateDocument({
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
      { name: 'Auth', description: 'Auth management' },
      { name: 'Users', description: 'User management' },
      { name: 'Tours', description: 'Tour management' },
      { name: 'Destinations', description: 'Destination management' },
      { name: 'Itineraries', description: 'Itinerary management' },
      { name: 'Tour Schedule', description: 'Tour Schedule management' },
      { name: 'Bookings', description: 'Tour Booking management' },
      { name: 'Tour Review', description: 'Tour Review management' },
      { name: 'FAQS', description: 'FAQS management' },
    ],
  });

  doc.components = {
    ...doc.components,
    ...swaggerSecurity.components,
  };


  return doc;
};
