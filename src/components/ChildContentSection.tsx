import { useState, useEffect, useCallback } from 'react';
import {
    useRecordContext,
    useResourceContext,
    useNotify,
    useRefresh,
    useTranslate,
} from 'react-admin';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import type { FieldMetadata } from '../types/psychedcms.ts';

function formatCellValue(value: unknown, meta: FieldMetadata): string {
    if (value == null) return '\u2014';
    if (typeof value === 'object') {
        if (value !== null && '@id' in value) {
            const obj = value as Record<string, unknown>;
            return (obj.name || obj.title || obj.slug || obj['@id'] || '') as string;
        }
        return JSON.stringify(value);
    }
    if (meta.type === 'date' && typeof value === 'string') {
        try {
            return new Date(value).toLocaleString();
        } catch {
            return String(value);
        }
    }
    return String(value);
}

interface ChildContentSectionProps {
    childResource: string;
}

export function ChildContentSection({ childResource }: ChildContentSectionProps) {
    const record = useRecordContext();
    const parentResource = useResourceContext();
    const { schema, entrypoint } = usePsychedSchemaContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const translate = useTranslate();

    const [children, setChildren] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});

    const childSchema = schema?.resources.get(childResource);
    const parentId = record?.id ? String(record.id).replace(/.*\//, '') : null;

    const fetchChildren = useCallback(async () => {
        if (!parentResource || !parentId || !entrypoint) return;

        setLoading(true);
        try {
            const url = `${entrypoint}/${parentResource}/${parentId}/${childResource}`;
            const response = await fetch(url, {
                headers: { Accept: 'application/ld+json' },
            });
            if (response.ok) {
                const data = await response.json();
                setChildren(data['hydra:member'] || []);
            }
        } catch (err) {
            console.error('Failed to fetch children:', err);
        } finally {
            setLoading(false);
        }
    }, [entrypoint, parentResource, parentId, childResource]);

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren]);

    if (!childSchema) return null;

    const editableFields = Array.from(childSchema.fields.entries()).filter(
        ([, meta]) => !['hidden'].includes(meta.type) && !meta.readonly
    );

    const listFields = Array.from(childSchema.fields.entries()).filter(
        ([, meta]) => {
            if (meta.listColumn === false) return false;
            if (['html', 'markdown', 'hidden', 'image', 'file', 'collection', 'geolocation'].includes(meta.type)) return false;
            return true;
        }
    ).sort((a, b) => {
        const orderA = a[1].listColumnOrder;
        const orderB = b[1].listColumnOrder;
        if (orderA != null && orderB != null) return orderA - orderB;
        if (orderA != null) return -1;
        if (orderB != null) return 1;
        return 0;
    });

    const handleAdd = () => {
        setEditingRecord(null);
        setFormData({});
        setDialogOpen(true);
    };

    const handleEdit = (child: Record<string, unknown>) => {
        setEditingRecord(child);
        const data: Record<string, string> = {};
        for (const [fieldName] of editableFields) {
            const val = child[fieldName];
            data[fieldName] = val != null ? String(val) : '';
        }
        setFormData(data);
        setDialogOpen(true);
    };

    const handleDelete = async (child: Record<string, unknown>) => {
        const iri = child['@id'] as string;
        if (!iri || !entrypoint) return;

        try {
            const response = await fetch(`${entrypoint}${iri.replace('/api', '')}`, {
                method: 'DELETE',
                headers: { Accept: 'application/ld+json' },
            });
            if (response.ok || response.status === 204) {
                notify('ra.notification.deleted', { type: 'success', messageArgs: { smart_count: 1 } });
                fetchChildren();
                refresh();
            }
        } catch {
            notify('ra.notification.http_error', { type: 'error' });
        }
    };

    const handleSave = async () => {
        if (!entrypoint || !parentResource || !parentId) return;

        const body: Record<string, unknown> = {};
        for (const [fieldName, meta] of editableFields) {
            const val = formData[fieldName];
            if (meta.type === 'date' && val) {
                body[fieldName] = val;
            } else if (meta.type === 'number' && val) {
                body[fieldName] = Number(val);
            } else if (meta.type === 'relation' && val) {
                body[fieldName] = val;
            } else {
                body[fieldName] = val || null;
            }
        }

        try {
            let response;
            if (editingRecord) {
                const iri = editingRecord['@id'] as string;
                response = await fetch(`${entrypoint}${iri.replace('/api', '')}`, {
                    method: 'PUT',
                    headers: {
                        Accept: 'application/ld+json',
                        'Content-Type': 'application/ld+json',
                    },
                    body: JSON.stringify(body),
                });
            } else {
                response = await fetch(
                    `${entrypoint}/${parentResource}/${parentId}/${childResource}`,
                    {
                        method: 'POST',
                        headers: {
                            Accept: 'application/ld+json',
                            'Content-Type': 'application/ld+json',
                        },
                        body: JSON.stringify(body),
                    }
                );
            }

            if (response.ok) {
                notify(editingRecord ? 'ra.notification.updated' : 'ra.notification.created', {
                    type: 'success',
                    messageArgs: { smart_count: 1 },
                });
                setDialogOpen(false);
                fetchChildren();
                refresh();
            } else {
                const err = await response.json().catch(() => ({}));
                notify(err['hydra:description'] || 'Error', { type: 'error' });
            }
        } catch {
            notify('ra.notification.http_error', { type: 'error' });
        }
    };

    const sectionLabel = childSchema.contentType?.name || childResource;

    return (
        <Paper sx={{ mt: 3, p: 2 }} variant="outlined">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                    {translate(`resources.${childResource}.name`, { _: sectionLabel })}
                </Typography>
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    {translate('ra.action.create')}
                </Button>
            </Box>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {listFields.map(([name, meta]) => (
                                <TableCell key={name}>
                                    {translate(`resources.${childResource}.fields.${name}`, { _: meta.label || name })}
                                </TableCell>
                            ))}
                            <TableCell align="right">{translate('ra.action.edit')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={listFields.length + 1} align="center">
                                    {translate('ra.page.loading')}
                                </TableCell>
                            </TableRow>
                        ) : children.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={listFields.length + 1} align="center">
                                    {translate('ra.page.empty')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            children.map((child, idx) => (
                                <TableRow key={(child['@id'] as string) || idx}>
                                    {listFields.map(([name, meta]) => (
                                        <TableCell key={name}>
                                            {formatCellValue(child[name], meta)}
                                        </TableCell>
                                    ))}
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(child)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(child)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingRecord
                        ? translate('ra.action.edit')
                        : translate('ra.action.create')}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        {editableFields.map(([fieldName, meta]) => (
                            <TextField
                                key={fieldName}
                                label={translate(`resources.${childResource}.fields.${fieldName}`, { _: meta.label || fieldName })}
                                value={formData[fieldName] || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, [fieldName]: e.target.value }))
                                }
                                type={meta.type === 'number' ? 'number' : meta.type === 'date' ? 'datetime-local' : 'text'}
                                required={meta.required}
                                fullWidth
                                size="small"
                            />
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        {translate('ra.action.cancel')}
                    </Button>
                    <Button variant="contained" onClick={handleSave}>
                        {translate('ra.action.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
