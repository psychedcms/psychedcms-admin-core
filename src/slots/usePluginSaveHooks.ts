import { getSaveHooks } from '../registry.ts';

export async function runBeforeSaveHooks(
  data: Record<string, unknown>,
  resource: string,
): Promise<Record<string, unknown>> {
  const hooks = getSaveHooks(resource);
  let result = data;
  for (const hook of hooks) {
    if (hook.beforeSave) {
      result = await hook.beforeSave(result, resource);
    }
  }
  return result;
}

export async function runAfterSaveHooks(
  data: Record<string, unknown>,
  resource: string,
): Promise<void> {
  const hooks = getSaveHooks(resource);
  for (const hook of hooks) {
    if (hook.afterSave) {
      await hook.afterSave(data, resource);
    }
  }
}
