'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

/**
 * API Documentation Page
 * Interactive API explorer using Swagger UI
 */
export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the OpenAPI specification
    fetch('/api/swagger')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load API specification');
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading API spec:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">Error Loading API Documentation</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">CDBL Leave Management System API</h1>
          <p className="mt-2 text-muted-foreground">
            Interactive API documentation and testing interface
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href="/api/swagger"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Download OpenAPI Spec
            </a>
            <a
              href="/api-docs/postman"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Get Postman Collection
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="container mx-auto px-4 py-8">
        {spec && (
          <SwaggerUI
            spec={spec}
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            docExpansion="list"
            filter={true}
            showRequestHeaders={true}
            tryItOutEnabled={true}
            persistAuthorization={true}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>CDBL Leave Management System API v1.0.0</p>
          <p className="mt-1">
            Need help? Contact{' '}
            <a href="mailto:it@cdbl.com" className="text-primary hover:underline">
              it@cdbl.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
