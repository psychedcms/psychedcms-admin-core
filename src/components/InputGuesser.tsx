import { useCallback } from 'react';
import type { ReactElement } from 'react';
import {
    TextInput,
    NumberInput,
    BooleanInput,
    SelectInput,
    ReferenceInput,
    ReferenceArrayInput,
    AutocompleteInput,
    AutocompleteArrayInput,
    useInput,
    useResourceContext,
    useTranslate,
} from 'react-admin';
import { useWatch } from 'react-hook-form';
import { PsychedRichTextInput } from '@psychedcms/admin-richtext';
import { Box, IconButton, Chip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { parseISO, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useFieldMetadata } from '../hooks/useFieldMetadata.ts';
import { getInputResolvers } from '../registry.ts';
import { TranslationReferencePanel } from './TranslationReferencePanel.tsx';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import type { FieldMetadata } from '../types/psychedcms.ts';
import { CollectionInput } from './CollectionInput.tsx';

function DatePickerInput({ source, label, required, helperText }: {
    source: string;
    label?: string;
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
            onChange={(date) => field.onChange(date && isValid(date) ? date.toISOString() : null)}
            slotProps={{
                textField: { fullWidth: true, margin: 'dense', required, helperText, size: 'small' },
            }}
        />
    );
}

function DateTimePickerInput({ source, label, required, helperText }: {
    source: string;
    label?: string;
    required?: boolean;
    helperText?: string;
}) {
    const { field } = useInput({ source });
    const value = field.value
        ? (typeof field.value === 'string' ? parseISO(field.value) : field.value)
        : null;

    return (
        <DateTimePicker
            label={label}
            value={isValid(value) ? value : null}
            onChange={(date) => field.onChange(date && isValid(date) ? date.toISOString() : null)}
            viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
            }}
            ampm={false}
            slotProps={{
                textField: { fullWidth: true, margin: 'dense', required, helperText, size: 'small' },
            }}
        />
    );
}

function buildSelectChoices(
    meta: FieldMetadata,
    source: string,
    resource: string,
    translate: (key: string, options?: Record<string, unknown>) => string,
) {
    const values = meta.values;
    if (!values) return [];
    if (Array.isArray(values)) {
        return values.map((v: string) => {
            // Try resource-specific, then global, then humanized fallback
            const resKey = `resources.${resource}.values.${source}.${v}`;
            const globalKey = `psyched.values.${source}.${v}`;
            const statusKey = `psyched.status.${v}`;
            const resT = translate(resKey, { _: '' });
            if (resT) return { id: v, name: resT };
            const globalT = translate(globalKey, { _: '' });
            if (globalT) return { id: v, name: globalT };
            const statusT = translate(statusKey, { _: '' });
            if (statusT) return { id: v, name: statusT };
            return { id: v, name: v.charAt(0).toUpperCase() + v.slice(1) };
        });
    }
    return Object.entries(values).map(([id, name]) => ({ id, name }));
}

function extractIdFromValue(val: unknown): string | null {
    if (!val) return null;
    if (typeof val === 'string') return val.replace(/.*\//, '');
    if (typeof val === 'object' && val !== null && '@id' in val) {
        return ((val as Record<string, unknown>)['@id'] as string).replace(/.*\//, '');
    }
    return null;
}

function RelationInput({ source, reference, displayField, multiple, label, helperText, navigable }: {
    source: string;
    reference: string;
    displayField: string;
    multiple?: boolean;
    label?: string;
    helperText?: string;
    navigable?: boolean;
}) {
    const navigate = useNavigate();
    const currentValue = useWatch({ name: source });
    const filterToQuery = useCallback(
        (q: string) => (q ? { [displayField]: q } : {}),
        [displayField],
    );
    const matchSuggestion = useCallback(
        (filter: string, choice: Record<string, unknown>) => {
            if (!filter) return true;
            const text = String(choice[displayField] ?? '').toLowerCase();
            return text.includes(filter.toLowerCase());
        },
        [displayField],
    );

    if (multiple) {
        return (
            <ReferenceArrayInput source={source} reference={reference}>
                <AutocompleteArrayInput
                    label={label}
                    optionText={displayField}
                    helperText={helperText}
                    filterToQuery={filterToQuery}
                    matchSuggestion={matchSuggestion}
                    {...(navigable ? {
                        renderTags: (value: Record<string, unknown>[], getTagProps: (params: { index: number }) => Record<string, unknown>) =>
                            value.map((option, index) => {
                                const tagProps = getTagProps({ index });
                                const id = extractIdFromValue(option.id ?? option['@id'] ?? option);
                                return (
                                    <Chip
                                        {...tagProps}
                                        key={tagProps.key as string}
                                        label={String(option[displayField] ?? option.name ?? '')}
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (id) navigate(`/${reference}/${id}`);
                                        }}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                );
                            }),
                    } : {})}
                />
            </ReferenceArrayInput>
        );
    }

    if (navigable) {
        const selectedId = extractIdFromValue(currentValue);
        return (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <Box sx={{ flex: 1 }}>
                    <ReferenceInput source={source} reference={reference}>
                        <AutocompleteInput
                            label={label}
                            optionText={displayField}
                            helperText={helperText}
                            filterToQuery={filterToQuery}
                            matchSuggestion={matchSuggestion}
                        />
                    </ReferenceInput>
                </Box>
                {selectedId && (
                    <IconButton size="small" onClick={() => navigate(`/${reference}/${selectedId}`)} sx={{ mt: 1 }}>
                        <OpenInNewIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        );
    }

    return (
        <ReferenceInput source={source} reference={reference}>
            <AutocompleteInput
                label={label}
                optionText={displayField}
                helperText={helperText}
                filterToQuery={filterToQuery}
                matchSuggestion={matchSuggestion}
            />
        </ReferenceInput>
    );
}

interface InputGuesserProps {
    source: string;
    resource?: string;
}

/**
 * Per-field input guesser. Reads x-psychedcms field metadata
 * and renders the appropriate React Admin input component.
 *
 * For translatable fields, renders a TranslationReferencePanel above
 * the input when editing in a non-default locale.
 */
export function InputGuesser({ source, resource: resourceProp }: InputGuesserProps) {
    const resourceFromContext = useResourceContext();
    const resource = resourceProp ?? resourceFromContext ?? '';
    const translate = useTranslate();
    const { schema: fullSchema } = usePsychedSchemaContext();
    const meta = useFieldMetadata(resource, source);

    if (!meta) {
        return <TextInput source={source} />;
    }

    if (meta.type === 'hidden') return null;
    if (meta.readonly) return null;

    const resourceKey = `resources.${resource}.fields.${source}`;
    const resourceTranslated = translate(resourceKey, { _: '' });
    const globalKey = `psyched.fields.${source}`;
    const globalTranslated = translate(globalKey, { _: '' });
    const label = meta.label
        ? (resourceTranslated || globalTranslated || meta.label)
        : undefined;
    const required = meta.required ?? false;
    const isTranslatable = meta.translatable === true;

    const wrapWithReference = (input: ReactElement) => {
        if (!isTranslatable) return input;
        return (
            <>
                <TranslationReferencePanel source={source} />
                {input}
            </>
        );
    };

    // Check plugin input resolvers first
    for (const resolver of getInputResolvers()) {
        if (resolver.types.includes(meta.type)) {
            return wrapWithReference(resolver.resolve({ source, label, required, helperText: meta.info, meta }));
        }
    }

    switch (meta.type) {
        case 'text':
        case 'email':
        case 'url':
        case 'slug':
            return wrapWithReference(<TextInput source={source} label={label} required={required} helperText={meta.info} />);
        case 'textarea':
            return wrapWithReference(<TextInput source={source} label={label} required={required} multiline minRows={3} helperText={meta.info} />);
        case 'html':
            return wrapWithReference(<PsychedRichTextInput source={source} label={label} isRequired={required} />);
        case 'markdown':
            return wrapWithReference(<TextInput source={source} label={label} required={required} multiline minRows={5} helperText={meta.info} />);
        case 'date':
            if (meta.mode === 'datetime') {
                return wrapWithReference(<DateTimePickerInput source={source} label={label} required={required} helperText={meta.info} />);
            }
            return wrapWithReference(<DatePickerInput source={source} label={label} required={required} helperText={meta.info} />);
        case 'number':
            return wrapWithReference(<NumberInput source={source} label={label} required={required} helperText={meta.info} />);
        case 'checkbox':
            return wrapWithReference(<BooleanInput source={source} label={label} helperText={meta.info} />);
        case 'select': {
            const choices = buildSelectChoices(meta, source, resource, translate);
            return wrapWithReference(<SelectInput source={source} label={label} required={required} choices={choices} helperText={meta.info} />);
        }
        case 'relation': {
            if (meta.display === 'table') return null;
            const refHasContentType = !!fullSchema?.resources.get(meta.reference!)?.contentType;
            return wrapWithReference(
                <RelationInput
                    source={source}
                    reference={meta.reference!}
                    displayField={meta.displayField || 'name'}
                    multiple={meta.multiple}
                    label={label}
                    helperText={meta.info}
                    navigable={refHasContentType}
                />,
            );
        }
        case 'entity_taxonomy':
            return wrapWithReference(
                <RelationInput
                    source={source}
                    reference="taxonomies"
                    displayField="name"
                    multiple={meta.multiple}
                    label={label}
                    helperText={meta.info}
                />,
            );
        case 'collection':
            return <CollectionInput source={source} label={label} meta={meta} />;
        default:
            return wrapWithReference(<TextInput source={source} label={label} required={required} helperText={meta.info} />);
    }
}
