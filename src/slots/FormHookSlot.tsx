import { getFormHooks } from '../registry.ts';

interface FormHookSlotProps {
  resource?: string;
  saveHandleRef?: unknown;
}

export function FormHookSlot({ resource, saveHandleRef }: FormHookSlotProps) {
  const hooks = getFormHooks(resource);

  if (hooks.length === 0) return null;

  return (
    <>
      {hooks.map((hook, i) => {
        const Component = hook.component;
        return <Component key={i} resource={resource} saveHandleRef={saveHandleRef} />;
      })}
    </>
  );
}
