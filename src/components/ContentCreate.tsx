import {
    Create,
    SimpleForm,
    useResourceContext,
} from 'react-admin';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';
import { FormHookSlot } from '../slots/FormHookSlot.tsx';
import { runBeforeSaveHooks, runAfterSaveHooks } from '../slots/usePluginSaveHooks.ts';
import { useCallback, useRef } from 'react';
import { buildFormInputs } from './ContentFormFields.tsx';

/**
 * Schema-driven create view. Reads x-psychedcms field metadata
 * to auto-generate form inputs with correct types, labels, and groups.
 * Runs plugin save hooks (e.g. translatable multi-locale save).
 */
export function ContentCreate() {
    const resource = useResourceContext();
    const schema = usePsychedSchema(resource ?? '');
    const saveHandleRef = useRef<unknown>(null);

    const transform = useCallback(
        async (data: Record<string, unknown>) => {
            return runBeforeSaveHooks(data, resource ?? '');
        },
        [resource],
    );

    return (
        <Create transform={transform} mutationOptions={{
            onSuccess: (data: any) => {
                runAfterSaveHooks(data as Record<string, unknown>, resource ?? '');
            },
        }}>
            <SimpleForm>
                <FormHookSlot resource={resource ?? undefined} saveHandleRef={saveHandleRef} />
                {schema ? buildFormInputs(schema.fields) : null}
            </SimpleForm>
        </Create>
    );
}
