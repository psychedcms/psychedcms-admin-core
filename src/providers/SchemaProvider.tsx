import { useEffect, useState } from 'react';
import type { PsychedSchema, ResourceSchema, FieldMetadata, ContentTypeMetadata } from '../types/psychedcms.ts';

interface SchemaState {
    schema: PsychedSchema | null;
    loading: boolean;
    error: Error | null;
}

/**
 * Fetches the OpenAPI schema from the API and parses x-psychedcms extensions.
 * Returns the parsed schema synchronously once loaded.
 */
export function useOpenApiSchema(apiUrl: string): SchemaState {
    const [state, setState] = useState<SchemaState>({ schema: null, loading: true, error: null });

    useEffect(() => {
        fetch(`${apiUrl}/docs`, {
            headers: { Accept: 'application/vnd.openapi+json' },
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Schema fetch failed: ${res.status}`);
                return res.json();
            })
            .then((doc) => {
                setState({ schema: parseOpenApiSchema(doc), loading: false, error: null });
            })
            .catch((err) => {
                setState({ schema: null, loading: false, error: err });
            });
    }, [apiUrl]);

    return state;
}

/**
 * Parse an OpenAPI 3.x document and extract x-psychedcms extensions
 * into a PsychedSchema structure keyed by resource slug (e.g. "bands").
 */
function parseOpenApiSchema(doc: Record<string, unknown>): PsychedSchema {
    const components = (doc.components ?? {}) as Record<string, unknown>;
    const schemas = (components.schemas ?? {}) as Record<string, Record<string, unknown>>;
    const resources = new Map<string, ResourceSchema>();

    for (const [, schemaDef] of Object.entries(schemas)) {
        const contentType = extractContentType(schemaDef);
        if (!contentType) continue;

        const slug = contentType.slug;
        const fields = extractFields(schemaDef);

        // Keep the schema definition with the most fields (the entity's own read groups)
        const existing = resources.get(slug);
        if (existing && fields.size <= existing.fields.size) continue;

        resources.set(slug, {
            name: slug,
            contentType,
            fields,
        });
    }

    return { resources };
}

function extractContentType(schemaDef: Record<string, unknown>): ContentTypeMetadata | null {
    if (schemaDef['x-psychedcms']) {
        return schemaDef['x-psychedcms'] as ContentTypeMetadata;
    }
    const allOf = schemaDef.allOf as Array<Record<string, unknown>> | undefined;
    if (allOf) {
        for (const item of allOf) {
            if (item['x-psychedcms']) {
                return item['x-psychedcms'] as ContentTypeMetadata;
            }
        }
    }
    return null;
}

function extractFields(schemaDef: Record<string, unknown>): Map<string, FieldMetadata> {
    const fields = new Map<string, FieldMetadata>();

    const sources: Array<Record<string, unknown>> = [];
    if (schemaDef.properties) {
        sources.push(schemaDef.properties as Record<string, unknown>);
    }
    const allOf = schemaDef.allOf as Array<Record<string, unknown>> | undefined;
    if (allOf) {
        for (const item of allOf) {
            if (item.properties) {
                sources.push(item.properties as Record<string, unknown>);
            }
        }
    }

    for (const props of sources) {
        for (const [propName, propDef] of Object.entries(props)) {
            const def = propDef as Record<string, unknown>;
            if (def['x-psychedcms']) {
                fields.set(propName, def['x-psychedcms'] as FieldMetadata);
            }
        }
    }

    return fields;
}
