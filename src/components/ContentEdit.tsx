import { useEffect } from 'react';
import {
    Edit,
    useResourceContext,
    useRecordContext,
    useTranslate,
} from 'react-admin';
import { Box } from '@mui/material';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import { PageHeader } from './PageHeader.tsx';
import { useSetBreadcrumbs } from './BreadcrumbBar.tsx';
import { resolveIcon } from '../utils/resolveIcon.ts';
import { runBeforeSaveHooks, runAfterSaveHooks } from '../slots/usePluginSaveHooks.ts';
import { getChildContentOverride } from '../registry.ts';
import { useCallback, useMemo } from 'react';
import { ContentForm } from './ContentForm.tsx';
import { ChildContentSection } from './ChildContentSection.tsx';
import { AggregateRelationSection } from './AggregateRelationSection.tsx';

/**
 * Keys stripped from PATCH payloads.
 * Read-only or Hydra metadata fields that the API rejects.
 */
const STRIP_KEYS = new Set([
  '@context', '@id', '@type', 'id', 'originId',
  'createdAt', 'updatedAt',
]);

/**
 * Normalize form data before sending to the API.
 * - Strips read-only and Hydra metadata fields
 * - Converts nested objects with @id back to IRI strings
 */
function normalizeForPatch(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (STRIP_KEYS.has(key)) continue;

    if (value && typeof value === 'object' && !Array.isArray(value) && '@id' in value) {
      normalized[key] = (value as { '@id': string })['@id'];
    } else if (Array.isArray(value)) {
      normalized[key] = value.map((item) =>
        item && typeof item === 'object' && '@id' in item ? item['@id'] : item,
      );
    } else {
      normalized[key] = value;
    }
  }

  // Ensure slug is always included — the API requires it (NotBlank validation)
  // and the 'id' field (which IS the slug) gets stripped above.
  if (!normalized['slug'] && data['id']) {
    normalized['slug'] = data['id'];
  }

  return normalized;
}

/**
 * Schema-driven edit view with two-column layout.
 * Left: tabbed form fields. Right: sidebar with save, workflow, publication options.
 * Runs plugin save hooks and normalizes data for Hydra PATCH.
 */
function EditPageHeader() {
    const record = useRecordContext();
    const resource = useResourceContext();
    const translate = useTranslate();
    const schema = usePsychedSchema(resource ?? '');
    const setBreadcrumbs = useSetBreadcrumbs();

    const recordTitle = record?.name ?? record?.title ?? record?.slug ?? record?.id ?? '';
    const resourceLabel = translate(`resources.${resource}.name`, { _: schema?.contentType?.name ?? resource ?? '' });
    const group = schema?.contentType?.group ?? 'content';
    const sectionLabel = translate(`psyched.menu.${group}`, { _: group });

    useEffect(() => {
        if (!recordTitle) return;
        setBreadcrumbs([
            { label: sectionLabel },
            { label: resourceLabel, to: `/${resource}` },
            { label: String(recordTitle) },
        ]);
        return () => setBreadcrumbs(null);
    }, [sectionLabel, resourceLabel, resource, recordTitle, setBreadcrumbs]);

    return <PageHeader title={String(recordTitle)} icon={resolveIcon(schema?.contentType?.icon)} />;
}

export function ContentEdit() {
    const resource = useResourceContext();
    const schema = usePsychedSchema(resource ?? '');
    const { schema: fullSchema } = usePsychedSchemaContext();

    const childResources = useMemo(() => {
        if (!fullSchema || !resource) return [];
        return Array.from(fullSchema.resources.entries())
            .filter(([, res]) => res.contentType?.aggregateRoot === resource)
            .map(([slug]) => slug);
    }, [fullSchema, resource]);

    const tableRelations = useMemo(() => {
        if (!schema?.fields) return [];
        return [...schema.fields.entries()]
            .filter(([, meta]) => meta.type === 'relation' && meta.display === 'table')
            .map(([source, meta]) => ({
                source,
                reference: meta.reference!,
                displayField: meta.displayField || 'name',
                label: meta.label,
            }));
    }, [schema]);

    const tableRelationKeys = useMemo(
        () => new Set(tableRelations.map((r) => r.source)),
        [tableRelations],
    );

    const transform = useCallback(
        async (data: Record<string, unknown>) => {
            const normalized = normalizeForPatch(data);
            for (const key of tableRelationKeys) {
                delete normalized[key];
            }
            // Convert cleared JSON fields to null (embed clear sentinel)
            for (const [key, value] of Object.entries(normalized)) {
                if (value === '' || (value && typeof value === 'object' && !Array.isArray(value) && '_cleared' in (value as Record<string, unknown>))) {
                    normalized[key] = null;
                }
            }
            return runBeforeSaveHooks(normalized, resource ?? '');
        },
        [resource, tableRelationKeys],
    );

    if (!schema) return null;

    return (
        <Edit
            actions={false}
            component={Box}
            sx={{ bgcolor: 'transparent', overflow: 'hidden' }}
            transform={transform}
            mutationMode="pessimistic"
            mutationOptions={{
                onSuccess: (data: any) => {
                    runAfterSaveHooks(data as Record<string, unknown>, resource ?? '');
                },
            }}
        >
            <EditPageHeader />
            <ContentForm />
            {tableRelations.map(({ source, reference, displayField, label }) => (
                <AggregateRelationSection
                    key={source}
                    source={source}
                    reference={reference}
                    displayField={displayField}
                    label={label}
                />
            ))}
            {childResources.map((slug) => {
                const override = getChildContentOverride(resource ?? '', slug);
                if (override) {
                    const Override = override.component;
                    return <Override key={slug} childResource={slug} />;
                }
                return <ChildContentSection key={slug} childResource={slug} />;
            })}
        </Edit>
    );
}
