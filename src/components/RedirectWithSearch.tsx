import { Navigate, useLocation } from 'react-router-dom';

interface RedirectWithSearchProps {
  to: string;
}

/**
 * Preserves query string (search params) during redirection
 */
export function RedirectWithSearch({ to }: RedirectWithSearchProps) {
  const location = useLocation();
  const target = `${to}${location.search}${location.hash}`;
  return <Navigate to={target} replace />;
}
