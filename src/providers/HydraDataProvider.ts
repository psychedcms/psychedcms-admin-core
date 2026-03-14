import { type DataProvider, HttpError } from 'react-admin';
import { buildHttpClient } from '../slots/usePluginHttpClient.ts';

/**
 * Data provider for API Platform (Hydra JSON-LD format).
 * Maps hydra:member/hydra:totalItems to React Admin's expected format.
 * Uses PsychedCMS plugin HTTP middleware (e.g. locale headers from translatable).
 */
export const createHydraDataProvider = (apiUrl: string): DataProvider => {
    const pluginFetch = buildHttpClient(async (url: URL, init?: RequestInit) => {
        return fetch(url, init);
    });

    const httpClient = async (url: string, options: RequestInit & { body?: string } = {}) => {
        const token = localStorage.getItem('token');
        const headers = new Headers(options.headers);
        headers.set('Accept', 'application/ld+json');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
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

            return {
                data: json['hydra:member'].map(addId),
                total: json['hydra:totalItems'],
            };
        },

        getOne: async (resource, params) => {
            const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`);
            return { data: addId(json) };
        },

        getMany: async (resource, params) => {
            const results = await Promise.all(
                params.ids.map((id) =>
                    httpClient(`${apiUrl}/${resource}/${id}`).then(({ json }) => addId(json))
                )
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

            return {
                data: json['hydra:member'].map(addId),
                total: json['hydra:totalItems'],
            };
        },

        create: async (resource, params) => {
            const { json } = await httpClient(`${apiUrl}/${resource}`, {
                method: 'POST',
                body: JSON.stringify(params.data),
            });
            return { data: addId(json) };
        },

        update: async (resource, params) => {
            const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
                method: 'PUT',
                body: JSON.stringify(params.data),
            });
            return { data: addId(json) };
        },

        updateMany: async (resource, params) => {
            const results = await Promise.all(
                params.ids.map((id) =>
                    httpClient(`${apiUrl}/${resource}/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify(params.data),
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

/** Extract numeric id from Hydra @id IRI or use existing id field */
function addId(record: any): any {
    if (record.id !== undefined) {
        return record;
    }
    // Extract id from @id IRI like "/api/bands/5"
    const iri: string = record['@id'] || '';
    const match = iri.match(/\/(\d+)$/);
    return { ...record, id: match ? parseInt(match[1], 10) : iri };
}
