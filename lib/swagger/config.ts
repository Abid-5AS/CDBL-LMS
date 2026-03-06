import { createSwaggerSpec } from 'next-swagger-doc';

/**
 * Swagger/OpenAPI Configuration
 * Generates API documentation from JSDoc comments in API routes
 */
export const swaggerSpec = createSwaggerSpec({
  apiFolder: 'app/api',
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CDBL Leave Management System API',
      version: '1.0.0',
      description: `
## CDBL Leave Management System REST API

A comprehensive leave management system API for handling employee leave requests, approvals, balance tracking, and payroll integration.

### Features
- Leave request management
- Multi-step approval workflow
- Leave balance tracking and projections
- Payroll integration
- HRIS synchronization
- Advanced analytics and reporting
- Team capacity planning
- Notification system

### Authentication
All API endpoints require JWT authentication via Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

### Rate Limiting
API requests are rate-limited based on user role:
- Regular users: 100 requests/minute
- Managers: 200 requests/minute
- HR/Admin: 500 requests/minute

### Pagination
List endpoints support pagination via query parameters:
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 20, max: 100)

### Error Handling
API errors follow a standardized format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400,
    "details": {},
    "timestamp": "2025-12-04T10:00:00Z",
    "requestId": "req_abc123",
    "path": "/api/leaves"
  }
}
\`\`\`
      `,
      contact: {
        name: 'CDBL IT Support',
        email: 'it@cdbl.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
      {
        url: 'https://leave.cdbl.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Invalid request parameters',
                },
                statusCode: {
                  type: 'number',
                  example: 400,
                },
                details: {
                  type: 'object',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
                requestId: {
                  type: 'string',
                },
                path: {
                  type: 'string',
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              example: 1,
            },
            limit: {
              type: 'number',
              example: 20,
            },
            total: {
              type: 'number',
              example: 150,
            },
            totalPages: {
              type: 'number',
              example: 8,
            },
            hasNext: {
              type: 'boolean',
              example: true,
            },
            hasPrev: {
              type: 'boolean',
              example: false,
            },
          },
        },
        // Leave types enum
        LeaveType: {
          type: 'string',
          enum: [
            'EARNED',
            'CASUAL',
            'MEDICAL',
            'MATERNITY',
            'PATERNITY',
            'STUDY',
            'SPECIAL',
            'HAJJ',
            'COMPENSATORY',
            'LEAVE_WITHOUT_PAY',
            'OTHER',
          ],
          example: 'EARNED',
        },
        LeaveStatus: {
          type: 'string',
          enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
          example: 'PENDING',
        },
        UserRole: {
          type: 'string',
          enum: ['EMPLOYEE', 'HR_ADMIN', 'DEPT_HEAD', 'HR_HEAD', 'CEO', 'SYSTEM_ADMIN'],
          example: 'EMPLOYEE',
        },
        // Leave Request schema
        LeaveRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
            },
            requesterId: {
              type: 'number',
              example: 42,
            },
            type: {
              $ref: '#/components/schemas/LeaveType',
            },
            startDate: {
              type: 'string',
              format: 'date',
              example: '2025-12-10',
            },
            endDate: {
              type: 'string',
              format: 'date',
              example: '2025-12-15',
            },
            workingDays: {
              type: 'number',
              example: 4,
            },
            reason: {
              type: 'string',
              example: 'Family emergency',
            },
            status: {
              $ref: '#/components/schemas/LeaveStatus',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // Balance schema
        Balance: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
            },
            userId: {
              type: 'number',
            },
            type: {
              $ref: '#/components/schemas/LeaveType',
            },
            year: {
              type: 'number',
              example: 2025,
            },
            opening: {
              type: 'number',
              example: 10,
            },
            accrued: {
              type: 'number',
              example: 24,
            },
            used: {
              type: 'number',
              example: 8,
            },
            closing: {
              type: 'number',
              example: 26,
            },
          },
        },
        // User schema (minimal)
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
            },
            empCode: {
              type: 'string',
              example: 'EMP001',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@cdbl.com',
            },
            department: {
              type: 'string',
              example: 'Engineering',
            },
            role: {
              $ref: '#/components/schemas/UserRole',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                  statusCode: 401,
                  timestamp: '2025-12-04T10:00:00Z',
                  requestId: 'req_abc123',
                  path: '/api/leaves',
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions to access this resource',
                  statusCode: 403,
                  timestamp: '2025-12-04T10:00:00Z',
                  requestId: 'req_abc123',
                  path: '/api/admin/users',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                  statusCode: 404,
                  timestamp: '2025-12-04T10:00:00Z',
                  requestId: 'req_abc123',
                  path: '/api/leaves/999',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Validation failed',
                  statusCode: 400,
                  details: {
                    field: 'startDate',
                    message: 'Start date must be in the future',
                  },
                  timestamp: '2025-12-04T10:00:00Z',
                  requestId: 'req_abc123',
                  path: '/api/leaves',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests. Please try again later.',
                  statusCode: 429,
                  timestamp: '2025-12-04T10:00:00Z',
                  requestId: 'req_abc123',
                  path: '/api/leaves',
                },
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'number',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        SortByParam: {
          name: 'sortBy',
          in: 'query',
          description: 'Field to sort by',
          required: false,
          schema: {
            type: 'string',
            default: 'createdAt',
          },
        },
        SortOrderParam: {
          name: 'sortOrder',
          in: 'query',
          description: 'Sort order',
          required: false,
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc',
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Leaves',
        description: 'Leave request management',
      },
      {
        name: 'Approvals',
        description: 'Leave approval workflow',
      },
      {
        name: 'Balance',
        description: 'Leave balance tracking and projections',
      },
      {
        name: 'Employees',
        description: 'Employee management',
      },
      {
        name: 'Analytics',
        description: 'Leave analytics and insights',
      },
      {
        name: 'Reports',
        description: 'Report generation and scheduling',
      },
      {
        name: 'Payroll',
        description: 'Payroll integration',
      },
      {
        name: 'HRIS',
        description: 'HRIS integration and employee sync',
      },
      {
        name: 'Notifications',
        description: 'Notification management',
      },
      {
        name: 'Webhooks',
        description: 'Webhook management (coming soon)',
      },
      {
        name: 'Calendar',
        description: 'Calendar integration',
      },
    ],
  },
});

export default swaggerSpec;
