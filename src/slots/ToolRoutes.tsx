import { Route } from 'react-router-dom';
import type { ReactElement } from 'react';

import { getToolPages } from '../registry.ts';

export function renderToolRoutes(): ReactElement[] {
  const pages = getToolPages();

  return pages.map((page) => {
    const Component = page.component;
    return (
      <Route
        key={page.path}
        path={`/tools/${page.path}`}
        element={<Component />}
      />
    );
  });
}
