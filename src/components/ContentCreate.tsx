import {
    Create,
    useResourceContext,
    useNotify,
    useTranslate,
} from 'react-admin';
import { Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import { runBeforeSaveHooks, runAfterSaveHooks } from '../slots/usePluginSaveHooks.ts';
import { useCallback } from 'react';
import { ContentForm } from './ContentForm.tsx';
import { PageHeader } from './PageHeader.tsx';

interface AssociateAfterCreateState {
    parentResource: string;
    parentId: string;
    parentIri: string;
    source: string;
}

/**
 * Schema-driven create view. Reads x-psychedcms field metadata
 * to auto-generate form inputs with correct types, labels, and groups.
 * Runs plugin save hooks (e.g. translatable multi-locale save).
 *
 * When navigated to with `associateAfterCreate` in router state,
 * automatically associates the new entity with the parent after creation
 * and redirects back to the parent edit page.
 */
export function ContentCreate() {
    const resource = useResourceContext();
    const schema = usePsychedSchema(resource ?? '');
    const location = useLocation();
    const navigate = useNavigate();
    const { entrypoint } = usePsychedSchemaContext();
    const notify = useNotify();
    const translate = useTranslate();

    const associateState = (location.state as { associateAfterCreate?: AssociateAfterCreateState } | null)
        ?.associateAfterCreate;

    const transform = useCallback(
        async (data: Record<string, unknown>) => {
            return runBeforeSaveHooks(data, resource ?? '');
        },
        [resource],
    );

    const handleSuccess = useCallback(
        async (data: any) => {
            runAfterSaveHooks(data as Record<string, unknown>, resource ?? '');

            // Standalone create: a custom `onSuccess` overrides react-admin's
            // default success notification + redirect, so restore them — without
            // this the editor gets no confirmation and wonders if the save worked.
            if (!associateState || !entrypoint) {
                notify('ra.notification.created', {
                    type: 'info',
                    messageArgs: { smart_count: 1 },
                });
                navigate(`/${resource}/${encodeURIComponent(String(data.id ?? ''))}`);
                return;
            }

            const { source, parentResource, parentId } = associateState;
            const newIri = data['@id'] as string;

            try {
                // Fetch current parent to get existing IRIs, then PATCH the new one in.
                const parentUrl = `${entrypoint}/${parentResource}/${parentId}`;
                const parentResp = await fetch(parentUrl, {
                    headers: {
                        Accept: 'application/ld+json',
                        Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                    },
                });
                if (!parentResp.ok) throw new Error(`parent fetch failed: ${parentResp.status}`);

                const parentData = await parentResp.json();
                const currentItems = parentData[source] || [];
                const currentIris: string[] = currentItems
                    .map((item: unknown) => {
                        if (typeof item === 'string') return item;
                        if (item && typeof item === 'object' && '@id' in (item as Record<string, unknown>)) {
                            return (item as Record<string, unknown>)['@id'] as string;
                        }
                        return '';
                    })
                    .filter(Boolean);

                const patchResp = await fetch(parentUrl, {
                    method: 'PATCH',
                    headers: {
                        Accept: 'application/ld+json',
                        'Content-Type': 'application/merge-patch+json',
                        Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                    },
                    body: JSON.stringify({ [source]: [...currentIris, newIri] }),
                });
                if (!patchResp.ok) throw new Error(`parent patch failed: ${patchResp.status}`);

                notify('ra.notification.created', { type: 'info', messageArgs: { smart_count: 1 } });
            } catch {
                // The entity itself WAS created (the create POST already returned
                // 2xx) — only linking it to the parent failed. Surface a
                // non-blocking warning rather than a generic error that implies
                // the whole save failed; otherwise the editor re-submits and hits
                // a duplicate-slug 500.
                notify('psyched.content.created_not_associated', { type: 'warning' });
            }

            navigate(`/${parentResource}/${parentId}`);
        },
        [resource, associateState, entrypoint, navigate, notify],
    );

    const resourceLabel = translate(`resources.${resource}.name`, { _: schema?.contentType?.name ?? resource ?? '' });

    return (
        <Create
            component={Box}
            sx={{ bgcolor: 'transparent', overflow: 'hidden' }}
            transform={transform}
            redirect={associateState ? false : undefined}
            mutationOptions={{ onSuccess: handleSuccess }}
            actions={false}
        >
            <PageHeader title={`${translate('ra.action.create', { _: 'Create' })} ${resourceLabel}`} />
            <ContentForm />
        </Create>
    );
}
