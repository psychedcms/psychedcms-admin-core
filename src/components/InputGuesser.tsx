import {
    TextInput,
    NumberInput,
    BooleanInput,
    SelectInput,
    ReferenceInput,
    AutocompleteInput,
    AutocompleteArrayInput,
    useInput,
    useResourceContext,
    useTranslate,
} from 'react-admin';
import { RichTextInput } from 'ra-input-rich-text';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { parseISO, isValid } from 'date-fns';
import { GeolocationInput } from '@psychedcms/admin-geolocation';
import { useFieldMetadata } from '../hooks/useFieldMetadata.ts';
import { getInputResolvers } from '../registry.ts';
import type { FieldMetadata } from '../types/psychedcms.ts';

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

function buildSelectChoices(meta: FieldMetadata) {
    const values = meta.values;
    if (!values) return [];
    if (Array.isArray(values)) return values.map((v: string) => ({ id: v, name: v }));
    return Object.entries(values).map(([id, name]) => ({ id, name }));
}

interface InputGuesserProps {
    source: string;
    resource?: string;
}

/**
 * Per-field input guesser. Reads x-psychedcms field metadata
 * and renders the appropriate React Admin input component.
 */
export function InputGuesser({ source, resource: resourceProp }: InputGuesserProps) {
    const resourceFromContext = useResourceContext();
    const resource = resourceProp ?? resourceFromContext ?? '';
    const translate = useTranslate();
    const meta = useFieldMetadata(resource, source);

    if (!meta) {
        return <TextInput source={source} />;
    }

    if (meta.type === 'hidden') return null;
    if (meta.readonly) return null;

    const translationKey = `resources.${resource}.fields.${source}`;
    const translated = translate(translationKey);
    const label = meta.label
        ? (translated !== translationKey ? translated : meta.label)
        : undefined;
    const required = meta.required ?? false;

    // Check plugin input resolvers first
    for (const resolver of getInputResolvers()) {
        if (resolver.types.includes(meta.type)) {
            return resolver.resolve({ source, label, required, helperText: meta.info, meta });
        }
    }

    switch (meta.type) {
        case 'text':
        case 'email':
        case 'url':
        case 'slug':
            return <TextInput source={source} label={label} required={required} helperText={meta.info} />;
        case 'textarea':
            return <TextInput source={source} label={label} required={required} multiline minRows={3} helperText={meta.info} />;
        case 'html':
            return <RichTextInput source={source} label={label} isRequired={required} />;
        case 'markdown':
            return <TextInput source={source} label={label} required={required} multiline minRows={5} helperText={meta.info} />;
        case 'date':
            if (meta.mode === 'datetime') {
                return <DateTimePickerInput source={source} label={label} required={required} helperText={meta.info} />;
            }
            return <DatePickerInput source={source} label={label} required={required} helperText={meta.info} />;
        case 'number':
            return <NumberInput source={source} label={label} required={required} helperText={meta.info} />;
        case 'checkbox':
            return <BooleanInput source={source} label={label} helperText={meta.info} />;
        case 'select': {
            const choices = buildSelectChoices(meta);
            return <SelectInput source={source} label={label} required={required} choices={choices} helperText={meta.info} />;
        }
        case 'geolocation':
            return (
                <GeolocationInput
                    source={source}
                    label={label}
                    isRequired={required}
                    defaultZoom={meta.defaultZoom}
                    defaultLat={meta.defaultLat}
                    defaultLng={meta.defaultLng}
                />
            );
        case 'relation':
            if (meta.multiple) {
                return (
                    <ReferenceInput source={source} reference={meta.reference!}>
                        <AutocompleteArrayInput
                            label={label}
                            optionText={meta.displayField || 'name'}
                            helperText={meta.info}
                            filterToQuery={(q: string) => ({ title: q })}
                        />
                    </ReferenceInput>
                );
            }
            return (
                <ReferenceInput source={source} reference={meta.reference!}>
                    <AutocompleteInput
                        label={label}
                        optionText={meta.displayField || 'name'}
                        helperText={meta.info}
                        filterToQuery={(q: string) => ({ title: q })}
                    />
                </ReferenceInput>
            );
        case 'entity_taxonomy':
            if (meta.multiple) {
                return (
                    <ReferenceInput source={source} reference="taxonomies">
                        <AutocompleteArrayInput
                            label={label}
                            optionText="name"
                            helperText={meta.info}
                            filterToQuery={(q: string) => ({ name: q })}
                        />
                    </ReferenceInput>
                );
            }
            return (
                <ReferenceInput source={source} reference="taxonomies">
                    <AutocompleteInput
                        label={label}
                        optionText="name"
                        helperText={meta.info}
                        filterToQuery={(q: string) => ({ name: q })}
                    />
                </ReferenceInput>
            );
        default:
            return <TextInput source={source} label={label} required={required} helperText={meta.info} />;
    }
}
