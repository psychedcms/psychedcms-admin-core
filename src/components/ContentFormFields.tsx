import React from 'react';
import {
    TextInput,
    NumberInput,
    BooleanInput,
    SelectInput,
    useInput,
} from 'react-admin';
import { RichTextInput } from 'ra-input-rich-text';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parseISO, isValid } from 'date-fns';
import { GeolocationInput } from '@psychedcms/admin-geolocation';
import type { FieldMetadata } from '../types/psychedcms.ts';
import { MediaImageInput } from './MediaImageInput.tsx';

/**
 * React Admin-compatible DatePicker using MUI X.
 * Bridges useInput (react-hook-form) with MUI DatePicker.
 */
function DatePickerInput({ source, label, required, helperText }: {
    source: string;
    label: string;
    required?: boolean;
    helperText?: string;
}) {
    const { field } = useInput({ source });

    const value = field.value
        ? (typeof field.value === 'string' ? parseISO(field.value) : field.value)
        : null;

    return (
        <DatePicker
            label={label}
            value={isValid(value) ? value : null}
            onChange={(date) => {
                // Send ISO string back to the form
                field.onChange(date && isValid(date) ? date.toISOString() : null);
            }}
            slotProps={{
                textField: {
                    fullWidth: true,
                    margin: 'dense',
                    required,
                    helperText,
                    size: 'small',
                },
            }}
        />
    );
}

/**
 * Build form inputs from x-psychedcms field metadata.
 * Maps each field type to the appropriate React Admin input component.
 */
export function buildFormInputs(fields: Map<string, FieldMetadata>) {
    const inputs: React.ReactElement[] = [];

    for (const [name, meta] of fields) {
        if (meta.type === 'hidden') continue;
        if (meta.readonly) continue;

        const label = meta.label || name;
        const required = meta.required ?? false;

        switch (meta.type) {
            case 'text':
            case 'email':
            case 'url':
            case 'slug':
                inputs.push(
                    <TextInput
                        key={name}
                        source={name}
                        label={label}
                        required={required}
                        helperText={meta.info}
                    />,
                );
                break;
            case 'textarea':
                inputs.push(
                    <TextInput
                        key={name}
                        source={name}
                        label={label}
                        required={required}
                        multiline
                        minRows={3}
                        helperText={meta.info}
                    />,
                );
                break;
            case 'html':
                inputs.push(
                    <RichTextInput
                        key={name}
                        source={name}
                        label={label}
                        isRequired={required}
                    />,
                );
                break;
            case 'markdown':
                inputs.push(
                    <TextInput
                        key={name}
                        source={name}
                        label={label}
                        required={required}
                        multiline
                        minRows={5}
                        helperText={meta.info}
                    />,
                );
                break;
            case 'date':
                inputs.push(
                    <DatePickerInput
                        key={name}
                        source={name}
                        label={label}
                        required={required}
                        helperText={meta.info}
                    />,
                );
                break;
            case 'number':
                inputs.push(
                    <NumberInput
                        key={name}
                        source={name}
                        label={label}
                        required={required}
                        helperText={meta.info}
                    />,
                );
                break;
            case 'checkbox':
                inputs.push(
                    <BooleanInput
                        key={name}
                        source={name}
                        label={label}
                        helperText={meta.info}
                    />,
                );
                break;
            case 'select': {
                const choices = buildSelectChoices(meta);
                inputs.push(
                    <SelectInput
                        key={name}
                        source={name}
                        label={label}
                        required={required}
                        choices={choices}
                        helperText={meta.info}
                    />,
                );
                break;
            }
            case 'geolocation':
                inputs.push(
                    <GeolocationInput
                        key={name}
                        source={name}
                        label={label}
                        isRequired={required}
                        defaultZoom={meta.defaultZoom}
                        defaultLat={meta.defaultLat}
                        defaultLng={meta.defaultLng}
                    />,
                );
                break;
            case 'image':
                inputs.push(
                    <MediaImageInput
                        key={name}
                        source={name}
                        label={label}
                        required={required}
                        helperText={meta.info}
                    />,
                );
                break;
            case 'file':
                // TODO: wire to PsychedCMS media upload for non-image files
                inputs.push(
                    <TextInput
                        key={name}
                        source={name}
                        label={`${label} (file upload not yet available)`}
                        disabled
                    />,
                );
                break;
            default:
                inputs.push(
                    <TextInput
                        key={name}
                        source={name}
                        label={label}
                        required={required}
                        helperText={meta.info}
                    />,
                );
        }
    }

    return inputs;
}

function buildSelectChoices(meta: FieldMetadata) {
    const values = (meta as unknown as Record<string, unknown>).values;
    if (!values || !Array.isArray(values)) return [];
    return values.map((v: string) => ({ id: v, name: v }));
}
