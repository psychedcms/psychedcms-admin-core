import { getAppBarItems } from '../registry.ts';

export function AppBarSlot() {
  const items = getAppBarItems();

  if (items.length === 0) return null;

  return (
    <>
      {items.map((item, i) => {
        const Component = item.component;
        return <Component key={i} />;
      })}
    </>
  );
}
