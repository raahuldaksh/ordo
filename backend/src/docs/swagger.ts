export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ORDO API',
    version: '1.0.0',
    description: 'RESTful API for ORDO — Personal Routine, Task, Calendar, and Productivity Platform.'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'ordo_access_token'
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health check and DB connectivity status',
        responses: {
          200: { description: 'Health check OK' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register new user account',
        responses: {
          201: { description: 'User registered successfully' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Log in with email & password',
        responses: {
          200: { description: 'Login successful' }
        }
      }
    },
    '/tasks': {
      get: {
        summary: 'List user tasks',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of tasks' }
        }
      },
      post: {
        summary: 'Create task',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Task created' }
        }
      }
    },
    '/planner/day': {
      get: {
        summary: '24-hour day schedule timeline',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string' }, example: '2026-11-01' }
        ],
        responses: {
          200: { description: 'Day schedule breakdown' }
        }
      }
    },
    '/routines': {
      get: {
        summary: 'List routine templates',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Templates' }
        }
      }
    },
    '/analytics/summary': {
      get: {
        summary: 'Productivity analytics summary',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Analytics summary' }
        }
      }
    }
  }
};

