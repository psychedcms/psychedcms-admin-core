import { Route } from 'react-router-dom';
import type { ReactElement } from 'react';

import { getAdminPages } from '../registry.ts';

export function renderAdminRoutes(): ReactElement[] {
  const pages = getAdminPages();

  return pages.map((page) => {
    const Component = page.component;
    return (
      <Route
        key={page.path}
        path={`/admin/${page.path}`}
        element={<Component />}
      />
    );
  });
}
