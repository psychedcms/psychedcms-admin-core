import { Route } from 'react-router-dom';

import { getSettingsPages } from '../registry.ts';

export function SettingsRoutes() {
  const pages = getSettingsPages();

  return (
    <>
      {pages.map((page) => {
        const Component = page.component;
        return (
          <Route
            key={page.path}
            path={`/settings/${page.path}`}
            element={<Component />}
          />
        );
      })}
    </>
  );
}
