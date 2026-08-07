import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LocationState {
  pathname: string;
  search: string;
  hash: string;
  state: any;
}

export interface RouterContextType {
  location: LocationState;
  navigate: (to: string | number, options?: { replace?: boolean; state?: any }) => void;
  params: Record<string, string>;
  outlet: ReactNode | null;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function useLocation(): LocationState {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    return {
      pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
      search: typeof window !== 'undefined' ? window.location.search : '',
      hash: typeof window !== 'undefined' ? window.location.hash : '',
      state: null,
    };
  }
  return ctx.location;
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    return (to: string | number) => {
      if (typeof to === 'number') {
        window.history.go(to);
      } else {
        window.history.pushState({}, '', to);
      }
    };
  }
  return ctx.navigate;
}

export function useParams<T extends Record<string, string>>(): T {
  const ctx = useContext(RouterContext);
  return (ctx?.params || {}) as T;
}

export const BrowserRouter: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationState>(() => ({
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: typeof window !== 'undefined' ? window.history.state : null,
  }));

  const [params, setParams] = useState<Record<string, string>>({});
  const [outlet, setOutlet] = useState<ReactNode | null>(null);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        state: e.state,
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string | number, options?: { replace?: boolean; state?: any }) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }

    if (options?.replace) {
      window.history.replaceState(options?.state || {}, '', to);
    } else {
      window.history.pushState(options?.state || {}, '', to);
    }

    setLocation({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      state: options?.state || null,
    });
  };

  return (
    <RouterContext.Provider value={{ location, navigate, params, outlet }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Outlet: React.FC = () => {
  const ctx = useContext(RouterContext);
  return <>{ctx?.outlet || null}</>;
};

export interface RouteProps {
  path?: string;
  element?: ReactNode;
  children?: ReactNode;
}

export function matchPath(pattern: string, pathname: string): { matches: boolean; params: Record<string, string> } {
  if (pattern === '*') return { matches: true, params: {} };
  if (!pattern) return { matches: false, params: {} };

  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length && !pattern.endsWith('*')) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart || '');
    } else if (patternPart === '*') {
      return { matches: true, params };
    } else if (patternPart !== pathPart) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

export const Routes: React.FC<{ children: ReactNode }> = ({ children }) => {
  const ctx = useContext(RouterContext);
  const location = useLocation();

  let matchedElement: ReactNode = null;
  let matchedParams: Record<string, string> = {};

  const routeChildren = React.Children.toArray(children) as React.ReactElement<RouteProps>[];

  for (const child of routeChildren) {
    if (!React.isValidElement(child)) continue;

    const { path, element, children: nestedChildren } = child.props as RouteProps;

    if (nestedChildren) {
      const nestedList = React.Children.toArray(nestedChildren) as React.ReactElement<RouteProps>[];
      for (const nestedChild of nestedList) {
        if (!React.isValidElement(nestedChild)) continue;
        const nestedPath = nestedChild.props.path;

        if (nestedPath) {
          const res = matchPath(nestedPath, location.pathname);
          if (res.matches) {
            matchedParams = res.params;
            const childContent = nestedChild.props.element;
            matchedElement = (
              <RouterContext.Provider value={{ ...ctx!, location, params: matchedParams, outlet: childContent }}>
                {element}
              </RouterContext.Provider>
            );
            break;
          }
        }
      }
      if (matchedElement) break;
    } else if (path) {
      const res = matchPath(path, location.pathname);
      if (res.matches) {
        matchedParams = res.params;
        matchedElement = (
          <RouterContext.Provider value={{ ...ctx!, location, params: matchedParams, outlet: null }}>
            {element}
          </RouterContext.Provider>
        );
        break;
      }
    }
  }

  return <>{matchedElement}</>;
};

export const Route: React.FC<RouteProps> = () => null;

export const Navigate: React.FC<{ to: string; replace?: boolean; state?: any }> = ({ to, replace, state }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
  }, [to, replace]);
  return null;
};

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }> = ({ to, children, onClick, ...props }) => {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick(e);
        navigate(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
};
