import { Route } from 'react-router-dom';
import type { ReactElement } from 'react';

import { getSettingsPages } from '../registry.ts';

export function renderSettingsRoutes(): ReactElement[] {
  const pages = getSettingsPages();

  return pages.map((page) => {
    const Component = page.component;
    return (
      <Route
        key={page.path}
        path={`/settings/${page.path}`}
        element={<Component />}
      />
    );
  });
}
