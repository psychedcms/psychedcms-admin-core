import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    DateField,
    UrlField,
    BooleanField,
    NumberField,
    EditButton,
    useResourceContext,
} from 'react-admin';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';
import type { FieldMetadata } from '../types/psychedcms.ts';

/**
 * Schema-driven list view. Reads x-psychedcms field metadata
 * to auto-generate datagrid columns with correct field types.
 */
export function ContentList() {
    const resource = useResourceContext();
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
                {buildListColumns(schema.fields)}
                <EditButton />
            </Datagrid>
        </List>
    );
}

function buildListColumns(fields: Map<string, FieldMetadata>) {
    const columns: React.ReactElement[] = [];

    for (const [name, meta] of fields) {
        if (meta.type === 'html' || meta.type === 'markdown' || meta.type === 'hidden') continue;
        if (meta.type === 'image' || meta.type === 'file' || meta.type === 'imagelist' || meta.type === 'filelist') continue;
        if (meta.type === 'collection' || meta.type === 'geolocation') continue;

        const label = meta.label || name;

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
            default:
                columns.push(<TextField key={name} source={name} label={label} />);
        }
    }

    return columns;
}
