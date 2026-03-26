import { useCallback } from 'react';
import { useInput, useTranslate } from 'react-admin';
import {
    Box,
    Button,
    IconButton,
    TextField,
    Typography,
    Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { FieldMetadata } from '../types/psychedcms.ts';

interface CollectionInputProps {
    source: string;
    label?: string;
    meta: FieldMetadata;
}

type SchemaEntry = string | { type: string; values?: string[] | Record<string, string> };

function getFieldNames(schema: Record<string, SchemaEntry>): string[] {
    return Object.keys(schema);
}

function getFieldLabel(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
}

export function CollectionInput({ source, label, meta }: CollectionInputProps) {
    const { field } = useInput({ source });
    const translate = useTranslate();
    const schema = meta.schema ?? {};
    const fieldNames = getFieldNames(schema);
    const items: Record<string, unknown>[] = Array.isArray(field.value) ? field.value : [];

    const handleAdd = useCallback(() => {
        const empty: Record<string, string> = {};
        for (const name of fieldNames) {
            empty[name] = '';
        }
        field.onChange([...items, empty]);
    }, [items, field, fieldNames]);

    const handleRemove = useCallback((index: number) => {
        const next = items.filter((_, i) => i !== index);
        field.onChange(next);
    }, [items, field]);

    const handleChange = useCallback((index: number, fieldName: string, value: string) => {
        const next = items.map((item, i) =>
            i === index ? { ...item, [fieldName]: value } : item,
        );
        field.onChange(next);
    }, [items, field]);

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    {label ?? source}
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAdd}>
                    {translate('ra.action.add')}
                </Button>
            </Box>

            {items.map((item, index) => (
                <Box
                    key={index}
                    sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}
                >
                    {fieldNames.map((name) => (
                        <TextField
                            key={name}
                            size="small"
                            label={getFieldLabel(name)}
                            value={String(item[name] ?? '')}
                            onChange={(e) => handleChange(index, name, e.target.value)}
                            fullWidth
                        />
                    ))}
                    <IconButton
                        size="small"
                        onClick={() => handleRemove(index)}
                        color="error"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}

            {items.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ py: 1, textAlign: 'center' }}>
                    {translate('ra.page.empty')}
                </Typography>
            )}
        </Paper>
    );
}
