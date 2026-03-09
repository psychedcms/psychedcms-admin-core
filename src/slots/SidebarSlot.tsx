import { getSidebarWidgets } from '../registry.ts';

interface SidebarSlotProps {
  resource?: string;
}

export function SidebarSlot({ resource }: SidebarSlotProps) {
  const widgets = getSidebarWidgets(resource);

  if (widgets.length === 0) return null;

  return (
    <>
      {widgets.map((widget, i) => {
        const Component = widget.component;
        return <Component key={i} resource={resource} />;
      })}
    </>
  );
}
