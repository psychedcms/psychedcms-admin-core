import { Route } from 'react-router-dom';
import type { ReactElement } from 'react';

import { getMainPages } from '../registry.ts';

export function renderMainRoutes(): ReactElement[] {
  const pages = getMainPages();

  return pages.map((page) => {
    const Component = page.component;
    return (
      <Route
        key={page.path}
        path={`/main/${page.path}`}
        element={<Component />}
      />
    );
  });
}
