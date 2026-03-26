import { useState, useEffect, useCallback, useMemo } from 'react';
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
    InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import type { FieldMetadata } from '../types/psychedcms.ts';

/**
 * Resolve a dot-path like "band.name" on a nested object.
 */
function resolvePath(obj: unknown, path: string): unknown {
    let current = obj;
    for (const key of path.split('.')) {
        if (current == null || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[key];
    }
    return current;
}

/**
 * Format a resolved value with an optional modifier.
 * Modifiers: date, time, datetime (applied via {field|modifier} syntax).
 * ISO date strings without a modifier default to datetime.
 */
function formatResolved(resolved: unknown, modifier?: string): string {
    if (resolved == null) return '';
    const str = String(resolved);
    const isIso = typeof resolved === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(str);

    if (modifier === 'date' && isIso) {
        try { return new Date(str).toLocaleDateString(); } catch { /* fall through */ }
    }
    if (modifier === 'time' && isIso) {
        try { return new Date(str).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); } catch { /* fall through */ }
    }
    if (modifier === 'datetime' && isIso) {
        try { return new Date(str).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { /* fall through */ }
    }
    // Auto-format ISO dates as datetime when no modifier
    if (!modifier && isIso) {
        try { return new Date(str).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { /* fall through */ }
    }
    return str;
}

/**
 * Apply a listDisplayPattern to a value.
 * Supports:
 *   {field.path}          — dot-path traversal on objects
 *   {field.path|modifier} — with format modifier (date, time, datetime)
 *   {count}               — array length
 * Static text is preserved as-is.
 */
function applyDisplayPattern(value: unknown, pattern: string): string {
    return pattern.replace(/\{([^}]+)\}/g, (_, expr: string) => {
        const trimmed = expr.trim();

        if (trimmed === 'count') {
            if (Array.isArray(value)) return String(value.length);
            return '0';
        }

        // Parse optional modifier: {field|modifier}
        const pipeIndex = trimmed.indexOf('|');
        const path = pipeIndex >= 0 ? trimmed.substring(0, pipeIndex) : trimmed;
        const modifier = pipeIndex >= 0 ? trimmed.substring(pipeIndex + 1) : undefined;

        const resolved = resolvePath(value, path);
        return formatResolved(resolved, modifier);
    });
}

function formatCellValue(value: unknown, meta: FieldMetadata): string {
    // Apply display pattern if defined
    if (meta.listDisplayPattern) {
        if (value == null) return '\u2014';
        return applyDisplayPattern(value, meta.listDisplayPattern);
    }

    if (value == null) return '\u2014';
    if (typeof value === 'object') {
        if (value !== null && '@id' in value) {
            const obj = value as Record<string, unknown>;
            return (obj.name || obj.title || obj.slug || obj['@id'] || '') as string;
        }
        if (Array.isArray(value)) return `${value.length}`;
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
    const [listSearch, setListSearch] = useState('');

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

    const allAvailableFields = Array.from(childSchema.fields.entries()).filter(
        ([, meta]) => {
            if (meta.listColumn === false) return false;
            if (['html', 'markdown', 'hidden', 'collection', 'geolocation', 'seo_title', 'seo_description', 'og_image_picker', 'canonical_url_display'].includes(meta.type)) return false;
            return true;
        }
    );
    const explicitColumns = allAvailableFields.filter(([, meta]) => meta.listColumn === true);
    const listFields = (explicitColumns.length > 0
        ? explicitColumns
        : allAvailableFields.filter(([name]) => name === 'name' || name === 'title').slice(0, 1)
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

    const filteredChildren = useMemo(() => {
        if (!listSearch.trim()) return children;
        const terms = listSearch.toLowerCase().trim().split(/\s+/);
        return children.filter((item) => {
            const values = Object.values(item)
                .filter((v) => v != null && typeof v !== 'object')
                .map((v) => String(v).toLowerCase());
            return terms.every((term) => values.some((v) => v.includes(term)));
        });
    }, [children, listSearch]);

    const sectionLabel = childSchema.contentType?.name || childResource;

    return (
        <Paper sx={{ mt: 3, p: 2 }} variant="outlined">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ flexShrink: 0 }}>
                    {translate(`resources.${childResource}.name`, { _: sectionLabel })}
                </Typography>
                {children.length > 3 && (
                    <TextField
                        size="small"
                        placeholder={translate('ra.action.search', { _: 'Search' })}
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ flex: 1, maxWidth: 280 }}
                    />
                )}
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
                        ) : filteredChildren.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={listFields.length + 1} align="center">
                                    {children.length === 0
                                        ? translate('ra.page.empty')
                                        : translate('ra.navigation.no_results', { _: 'No results found' })}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredChildren.map((child, idx) => (
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
