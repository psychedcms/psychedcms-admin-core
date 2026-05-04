import { type DataProvider, HttpError } from 'react-admin';
import { buildHttpClient } from '../slots/usePluginHttpClient.ts';
import type { PsychedSchema } from '../types/psychedcms.ts';

/**
 * Data provider for API Platform (Hydra JSON-LD format).
 *
 * Read path:  Embedded relation objects are normalized to their slug (`id` field)
 *             so react-admin URLs stay clean (/#/bands/graveyard).
 * Write path: Slug values for relation fields are converted back to IRIs
 *             (/api/bands/graveyard) before sending, per JSON-LD standard.
 *
 * The schema getter provides field metadata (type + reference) needed
 * for the slug→IRI transform at save time.
 */
/**
 * Field types whose values are *relation references* — for these, embedded
 * objects and IRI strings collapse to slug identifiers on read (so
 * `<ReferenceInput>` choices match) and slugs expand back to IRIs on write.
 * Anything else (image / collection / JSON-blob fields) is preserved as-is.
 */
const RELATION_FIELD_TYPES = new Set(['relation', 'entity_taxonomy']);

export const createHydraDataProvider = (
    apiUrl: string,
    getSchema?: () => PsychedSchema | null,
    getLocale?: () => string | null | undefined,
): DataProvider => {
    const pluginFetch = buildHttpClient(async (url: URL, init?: RequestInit) => {
        return fetch(url, init);
    });

    const httpClient = async (url: string, options: RequestInit & { body?: string } = {}) => {
        const token = localStorage.getItem('token');
        const headers = new Headers(options.headers);
        headers.set('Accept', 'application/ld+json');
        headers.set('X-Client-Type', 'admin');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        // Forward the admin UI locale so translatable resources (taxonomies in
        // particular) come back in the editor's chrome language — independent
        // of the form's edit-locale tab. Without this, pills render in the
        // server default locale regardless of the admin's UI choice.
        const locale = getLocale?.();
        if (locale && !headers.has('Accept-Language')) {
            headers.set('Accept-Language', locale);
        }
        if (options.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/ld+json');
        }

        const response = await pluginFetch(new URL(url), {
            ...options,
            headers,
        });

        const text = await response.text();
        const json = text ? JSON.parse(text) : {};

        if (response.status < 200 || response.status >= 300) {
            throw new HttpError(json.message || response.statusText, response.status, json);
        }

        return { status: response.status, headers: response.headers, body: text, json };
    };

    /**
     * Convert slug values to IRIs for relation fields before sending to the API.
     * Uses the schema to identify relation fields and their target resource.
     *
     * Example: { bands: ["graveyard"] } → { bands: ["/api/bands/graveyard"] }
     */
    const slugsToIris = (resource: string, data: Record<string, unknown>): Record<string, unknown> => {
        const schema = getSchema?.();
        if (!schema) return data;

        const resourceSchema = schema.resources.get(resource);
        if (!resourceSchema) return data;

        // Strip Hydra metadata, react-admin internal fields, and read-only metadata
        const result = { ...data };
        for (const key of Object.keys(result)) {
            if (key.startsWith('@')) delete result[key];
        }
        delete result['id'];
        delete result['createdAt'];
        delete result['updatedAt'];

        for (const [fieldName, fieldMeta] of resourceSchema.fields) {
            // Remove read-only collection fields (managed server-side)
            if (fieldMeta.display === 'table') {
                delete result[fieldName];
                continue;
            }
            // Determine the reference resource for this field. RelationField
            // declares it explicitly; EntityTaxonomyField always points at
            // `taxonomies`. Both expose slug as their API identifier, so
            // form values are slug strings (cf. standard backend/api.md
            // "Admin slug→IRI transform").
            let reference: string | undefined;
            if (fieldMeta.type === 'relation' && fieldMeta.reference) {
                reference = fieldMeta.reference;
            } else if (fieldMeta.type === 'entity_taxonomy') {
                reference = 'taxonomies';
            } else {
                continue;
            }
            const value = result[fieldName];
            if (value == null) continue;

            const toIri = (v: unknown): unknown => {
                // Embedded objects with @id (e.g. ImageFieldValue) → use the @id.
                if (typeof v === 'object' && v !== null && '@id' in v) {
                    return (v as Record<string, unknown>)['@id'] as string;
                }
                if (typeof v !== 'string') return v;
                // Already an IRI — pass through.
                if (v.startsWith('/')) return v;
                // Slug string → wrap as IRI.
                return `/api/${reference}/${v}`;
            };

            if (Array.isArray(value)) {
                result[fieldName] = value.map(toIri);
            } else {
                result[fieldName] = toIri(value);
            }
        }
        return result;
    };

    return {
        getList: async (resource, params) => {
            const { page = 1, perPage = 25 } = params.pagination ?? {};
            const { field = 'id', order = 'ASC' } = params.sort ?? {};
            const query: Record<string, string> = {
                page: String(page),
                itemsPerPage: String(perPage),
                [`order[${field}]`]: order.toLowerCase(),
            };

            // Filters
            if (params.filter) {
                Object.keys(params.filter).forEach((key) => {
                    query[key] = params.filter[key];
                });
            }

            const url = `${apiUrl}/${resource}?${new URLSearchParams(query)}`;
            const { json } = await httpClient(url);

            const schema = getSchema?.();
            return {
                data: json['hydra:member'].map((r: any) => addId(r, schema, resource)),
                total: json['hydra:totalItems'],
            };
        },

        getOne: async (resource, params) => {
            const url = String(params.id).startsWith('/api/')
                ? `${apiUrl.replace(/\/api$/, '')}${params.id}`
                : `${apiUrl}/${resource}/${params.id}`;
            const { json } = await httpClient(url);
            return { data: addId(json, getSchema?.(), resource) };
        },

        getMany: async (resource, params) => {
            const schema = getSchema?.();
            const results = await Promise.all(
                params.ids.map((id) => {
                    // If id is already an IRI (e.g. /api/media/01KN...), use it directly
                    const url = String(id).startsWith('/api/')
                        ? `${apiUrl.replace(/\/api$/, '')}${id}`
                        : `${apiUrl}/${resource}/${id}`;
                    return httpClient(url).then(({ json }) => addId(json, schema, resource));
                })
            );
            return { data: results };
        },

        getManyReference: async (resource, params) => {
            const { page, perPage } = params.pagination;
            const { field, order } = params.sort;
            const query: Record<string, string> = {
                page: String(page),
                itemsPerPage: String(perPage),
                [`order[${field}]`]: order.toLowerCase(),
                [params.target]: String(params.id),
            };

            const url = `${apiUrl}/${resource}?${new URLSearchParams(query)}`;
            const { json } = await httpClient(url);

            const schema = getSchema?.();
            return {
                data: json['hydra:member'].map((r: any) => addId(r, schema, resource)),
                total: json['hydra:totalItems'],
            };
        },

        create: async (resource, params) => {
            const { json } = await httpClient(`${apiUrl}/${resource}`, {
                method: 'POST',
                body: JSON.stringify(slugsToIris(resource, params.data)),
            });
            return { data: addId(json, getSchema?.(), resource) };
        },

        update: async (resource, params) => {
            const cleaned = slugsToIris(resource, params.data);
            const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
                method: 'PATCH',
                body: JSON.stringify(cleaned),
                headers: { 'Content-Type': 'application/merge-patch+json' },
            });
            return { data: addId(json, getSchema?.(), resource) };
        },

        updateMany: async (resource, params) => {
            const results = await Promise.all(
                params.ids.map((id) =>
                    httpClient(`${apiUrl}/${resource}/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(slugsToIris(resource, params.data)),
                    })
                )
            );
            return { data: results.map(({ json }) => json.id) };
        },

        delete: async (resource, params) => {
            await httpClient(`${apiUrl}/${resource}/${params.id}`, {
                method: 'DELETE',
            });
            return { data: params.previousData as any };
        },

        deleteMany: async (resource, params) => {
            await Promise.all(
                params.ids.map((id) =>
                    httpClient(`${apiUrl}/${resource}/${id}`, {
                        method: 'DELETE',
                    })
                )
            );
            return { data: params.ids };
        },
    };
};

/**
 * Set react-admin record id from the API response.
 * PsychedCMS entities serialize slug as `id` via ApiProperty(identifier: true).
 * If `id` is missing, extract it from the @id IRI.
 */
function addId(record: any, schema?: PsychedSchema | null, resource?: string): any {
    if (record.id !== undefined) {
        return normalizeRelations(record, schema, resource);
    }
    const iri: string = record['@id'] || '';
    const match = iri.match(/\/([^/]+)$/);
    return normalizeRelations({ ...record, id: match ? match[1] : iri }, schema, resource);
}

/**
 * Convert embedded Hydra relation objects (and bare IRI strings) to their
 * slug identifier on read, *but only for fields the schema marks as a
 * relation*. Image / JSON-blob / collection fields preserve their full
 * structure — collapsing them would break their server-side denormalizer
 * (e.g. `MediaIriDenormalizer` only matches `/api/media/...` strings, not
 * bare ULIDs).
 *
 * The reverse transform (slug→IRI) happens in slugsToIris() at save time.
 */
function normalizeRelations(record: any, schema?: PsychedSchema | null, resource?: string): any {
    const result = { ...record };
    const relationFields = collectRelationFieldNames(schema, resource);
    for (const [key, value] of Object.entries(result)) {
        if (key.startsWith('@') || key === 'id') continue;
        if (!relationFields.has(key)) continue;
        if (Array.isArray(value)) {
            result[key] = value.map(normalizeRelationItem);
        } else if (
            (value && typeof value === 'object' && '@id' in (value as any)) ||
            isIriString(value)
        ) {
            result[key] = normalizeRelationItem(value);
        }
    }
    return result;
}

function collectRelationFieldNames(schema: PsychedSchema | null | undefined, resource: string | undefined): Set<string> {
    if (!schema || !resource) return new Set();
    const resourceSchema = schema.resources.get(resource);
    if (!resourceSchema) return new Set();
    const out = new Set<string>();
    for (const [fieldName, fieldMeta] of resourceSchema.fields) {
        if (RELATION_FIELD_TYPES.has(fieldMeta.type)) {
            out.add(fieldName);
        }
    }
    return out;
}

function normalizeRelationItem(item: unknown): unknown {
    if (item && typeof item === 'object' && '@id' in item) {
        return extractId(item as { '@id': string; id?: string | number });
    }
    if (isIriString(item)) {
        const match = (item as string).match(/\/([^/]+)$/);
        if (match) return match[1];
    }
    return item;
}

function isIriString(v: unknown): v is string {
    return typeof v === 'string' && v.startsWith('/api/');
}

/**
 * Extract the slug identifier from an embedded Hydra object.
 * Prefers `id` (slug via ApiProperty) over parsing `@id` (IRI).
 */
function extractId(obj: { '@id': string; id?: string | number }): string | number {
    if (obj.id !== undefined) return obj.id;
    const match = obj['@id'].match(/\/([^/]+)$/);
    return match ? match[1] : obj['@id'];
}
