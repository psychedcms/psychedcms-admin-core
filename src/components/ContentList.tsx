import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    DateField,
    UrlField,
    BooleanField,
    NumberField,
    FunctionField,
    EditButton,
    useResourceContext,
    useTranslate,
} from 'react-admin';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';
import type { FieldMetadata } from '../types/psychedcms.ts';

/**
 * Schema-driven list view. Reads x-psychedcms field metadata
 * to auto-generate datagrid columns with correct field types.
 */
export function ContentList() {
    const resource = useResourceContext();
    const translate = useTranslate();
    const schema = usePsychedSchema(resource ?? '');

    if (!schema || !schema.fields.size) {
        return (
            <List>
                <Datagrid rowClick="edit">
                    <TextField source="id" />
                    <EditButton />
                </Datagrid>
            </List>
        );
    }

    return (
        <List>
            <Datagrid rowClick="edit">
                {buildListColumns(schema.fields, resource ?? '', translate)}
                <EditButton />
            </Datagrid>
        </List>
    );
}

function resolveFieldLabel(
    resource: string,
    fieldName: string,
    meta: FieldMetadata,
    translate: (key: string) => string,
): string {
    const translationKey = `resources.${resource}.fields.${fieldName}`;
    const translated = translate(translationKey);
    return translated !== translationKey ? translated : (meta.label || fieldName);
}

function buildListColumns(
    fields: Map<string, FieldMetadata>,
    resource: string,
    translate: (key: string) => string,
) {
    const columns: React.ReactElement[] = [];
    const hasExplicitColumns = Array.from(fields.values()).some(
        (meta) => meta.listColumn === true,
    );

    const eligible: [string, FieldMetadata][] = [];

    for (const [name, meta] of fields) {
        if (meta.listColumn === false) continue;

        if (hasExplicitColumns) {
            if (meta.listColumn !== true) continue;
        } else {
            if (['html', 'markdown', 'hidden', 'image', 'file', 'imagelist', 'filelist', 'collection', 'geolocation'].includes(meta.type)) continue;
        }

        eligible.push([name, meta]);
    }

    eligible.sort((a, b) => {
        const orderA = a[1].listColumnOrder;
        const orderB = b[1].listColumnOrder;
        if (orderA != null && orderB != null) return orderA - orderB;
        if (orderA != null) return -1;
        if (orderB != null) return 1;
        return 0;
    });

    for (const [name, meta] of eligible) {
        const label = resolveFieldLabel(resource, name, meta, translate);

        switch (meta.type) {
            case 'date':
                columns.push(<DateField key={name} source={name} label={label} />);
                break;
            case 'number':
                columns.push(<NumberField key={name} source={name} label={label} />);
                break;
            case 'checkbox':
                columns.push(<BooleanField key={name} source={name} label={label} />);
                break;
            case 'url':
            case 'email':
                columns.push(<UrlField key={name} source={name} label={label} />);
                break;
            case 'relation':
            case 'entity_taxonomy':
                columns.push(
                    <FunctionField
                        key={name}
                        source={name}
                        label={label}
                        render={(record: Record<string, unknown>) => {
                            const value = record[name];
                            if (value == null) return '';
                            const displayField = meta.displayField || 'name';
                            if (Array.isArray(value)) {
                                const items = value
                                    .map((item) =>
                                        typeof item === 'object' && item !== null
                                            ? (item as Record<string, unknown>)[displayField] ?? ''
                                            : String(item),
                                    )
                                    .filter(Boolean);
                                const visible = items.slice(0, 3);
                                const remaining = items.length - visible.length;
                                return remaining > 0
                                    ? `${visible.join(', ')} +${remaining} others`
                                    : visible.join(', ');
                            }
                            if (typeof value === 'object') {
                                return (value as Record<string, unknown>)[displayField] ?? '';
                            }
                            return String(value);
                        }}
                    />,
                );
                break;
            default:
                columns.push(<TextField key={name} source={name} label={label} />);
        }
    }

    return columns;
}

