import { NextRequest, NextResponse } from 'next/server';
import { createSwaggerSpec } from 'next-swagger-doc';

// API docs can be cached as they don't change often
export const dynamic = 'force-static';

export const GET = async (request: NextRequest) => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'CDBL Leave Management API',
        version: '1.0',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [],
    },
  });
  return NextResponse.json(spec);
};
