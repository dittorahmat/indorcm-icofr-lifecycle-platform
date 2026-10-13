import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { isChunkLoadError, clearChunkReloadGuards } from '@/lib/lazyWithRetry';
import { ErrorFallback } from './ErrorFallback';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const isChunkError = isChunkLoadError(error);

  // Render error UI using shared ErrorFallback component
  if (isRouteErrorResponse(error)) {
    return (
      <ErrorFallback
        title={`${error.status} ${error.statusText}`}
        message="Sorry, an error occurred while loading this page."
        error={error.data ? { message: JSON.stringify(error.data, null, 2) } : error}
        statusMessage="Navigation error detected"
      />
    );
  }

  if (isChunkError) {
    return (
      <ErrorFallback
        title="Application Update or Connection Interrupted"
        message="A required page module could not be loaded. This usually occurs when a newer application version has been deployed or due to temporary network latency."
        error={error}
        statusMessage="Asset update detected"
        retryText="Reload Application"
        onRetry={() => {
          clearChunkReloadGuards();
          window.location.reload();
        }}
      />
    );
  }

  return (
    <ErrorFallback
      title="Unexpected Error"
      message="An unexpected error occurred while loading this page."
      error={error}
      statusMessage="Routing error detected"
    />
  );
}