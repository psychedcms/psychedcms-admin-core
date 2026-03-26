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
    DialogContentText,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress,
    InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddLinkIcon from '@mui/icons-material/AddLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';
import type { FieldMetadata } from '../types/psychedcms.ts';

function formatCellValue(value: unknown, meta: FieldMetadata): string {
    if (meta.listDisplayPattern) {
        if (value == null) return '\u2014';
        return String(value);
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

interface AggregateRelationSectionProps {
    source: string;
    reference: string;
    displayField: string;
    label?: string;
}

export function AggregateRelationSection({ source, reference, displayField, label }: AggregateRelationSectionProps) {
    const record = useRecordContext();
    const parentResource = useResourceContext();
    const { schema, entrypoint } = usePsychedSchemaContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const translate = useTranslate();
    const navigate = useNavigate();

    const [items, setItems] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
    const [searching, setSearching] = useState(false);
    const [listSearch, setListSearch] = useState('');
    const [dissociateTarget, setDissociateTarget] = useState<Record<string, unknown> | null>(null);

    const childSchema = schema?.resources.get(reference);
    const parentIri = record?.['@id'] as string | undefined;

    // Extract identifier (slug) from a value that may be a slug, IRI, or embedded object
    const extractId = (val: unknown): string => {
        if (typeof val === 'string') {
            // Could be "/api/events/roadburn-2026" or just "roadburn-2026"
            return val.includes('/') ? val.split('/').pop()! : val;
        }
        if (val && typeof val === 'object') {
            const obj = val as Record<string, unknown>;
            if (obj['@id']) return String(obj['@id']).split('/').pop()!;
            if (obj.id) return String(obj.id).split('/').pop()!;
            if (obj.slug) return String(obj.slug);
        }
        return '';
    };

    // Get current identifiers from record
    const getCurrentIds = useCallback((): string[] => {
        if (!record?.[source]) return [];
        const val = record[source];
        if (!Array.isArray(val)) return [];
        return val.map(extractId).filter(Boolean);
    }, [record, source]);

    // Build an IRI from reference + id
    const toIri = (id: string) => `/api/${reference}/${id}`;

    // Fetch full records for associated items
    const fetchItems = useCallback(async () => {
        const ids = getCurrentIds();
        if (!ids.length || !entrypoint) {
            setItems([]);
            return;
        }

        setLoading(true);
        try {
            const fetched: Record<string, unknown>[] = [];
            for (const id of ids) {
                const url = `${entrypoint}/${reference}/${id}`;
                const response = await fetch(url, {
                    headers: {
                        Accept: 'application/ld+json',
                        Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                    },
                });
                if (response.ok) {
                    fetched.push(await response.json());
                }
            }
            setItems(fetched);
        } catch (err) {
            console.error('Failed to fetch aggregate items:', err);
        } finally {
            setLoading(false);
        }
    }, [getCurrentIds, entrypoint, reference]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Search for items to associate
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (!query || !entrypoint) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const url = `${entrypoint}/${reference}?${displayField}=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/ld+json',
                    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                const currentIds = new Set(getCurrentIds());
                const members = (data['hydra:member'] || []) as Record<string, unknown>[];
                setSearchResults(members.filter((m) => !currentIds.has(extractId(m))));
            }
        } catch (err) {
            console.error('Failed to search:', err);
        } finally {
            setSearching(false);
        }
    }, [entrypoint, reference, displayField, getCurrentIds]);

    // PATCH parent to update the relation
    const patchRelation = useCallback(async (updatedIris: string[]) => {
        if (!parentIri || !entrypoint || !parentResource) return false;

        const parentId = extractId(parentIri) || String(record?.id ?? '').replace(/.*\//, '');
        try {
            const url = `${entrypoint}/${parentResource}/${parentId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    Accept: 'application/ld+json',
                    'Content-Type': 'application/merge-patch+json',
                    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
                },
                body: JSON.stringify({ [source]: updatedIris }),
            });
            if (response.ok) {
                refresh();
                return true;
            }
            const err = await response.json().catch(() => ({}));
            notify(err['hydra:description'] || 'Error', { type: 'error' });
            return false;
        } catch {
            notify('ra.notification.http_error', { type: 'error' });
            return false;
        }
    }, [parentIri, parentResource, record, entrypoint, source, refresh, notify]);

    const handleAssociate = async (item: Record<string, unknown>) => {
        const iri = item['@id'] as string;
        const currentIds = getCurrentIds();
        const updatedIris = [...currentIds.map(toIri), iri];
        const success = await patchRelation(updatedIris);
        if (success) {
            setItems((prev) => [...prev, item]);
            setSearchResults((prev) => prev.filter((r) => extractId(r) !== extractId(item)));
        }
    };

    const handleDissociate = async (item: Record<string, unknown>) => {
        const itemId = extractId(item);
        const currentIds = getCurrentIds();
        const updatedIris = currentIds.filter((id) => id !== itemId).map(toIri);
        const success = await patchRelation(updatedIris);
        if (success) {
            setItems((prev) => prev.filter((i) => extractId(i) !== itemId));
        }
    };

    const handleOpen = (item: Record<string, unknown>) => {
        const id = String(item.id ?? '').replace(/.*\//, '') || String(item['@id'] ?? '').replace(/.*\//, '');
        navigate(`/${reference}/${id}`);
    };

    const handleCreate = () => {
        const parentId = String(record?.id ?? '').replace(/.*\//, '');
        navigate(`/${reference}/create`, {
            state: {
                associateAfterCreate: {
                    parentResource,
                    parentId,
                    parentIri,
                    source,
                },
            },
        });
    };

    if (!childSchema) return null;

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

    const filteredItems = useMemo(() => {
        if (!listSearch.trim()) return items;
        const terms = listSearch.toLowerCase().trim().split(/\s+/);
        return items.filter((item) => {
            const values = Object.values(item)
                .filter((v) => v != null && typeof v !== 'object')
                .map((v) => String(v).toLowerCase());
            return terms.every((term) => values.some((v) => v.includes(term)));
        });
    }, [items, listSearch]);

    const sectionLabel = label || childSchema.contentType?.name || reference;
    const resourceLabel = translate(`resources.${reference}.name`, { _: sectionLabel });

    return (
        <Paper sx={{ mt: 3, p: 2, minWidth: 0, overflow: 'hidden' }} variant="outlined">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ flexShrink: 0 }}>
                    {resourceLabel}
                </Typography>
                {items.length > 3 && (
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleCreate}
                    >
                        {translate('ra.action.create')}
                    </Button>
                    <Button
                        size="small"
                        startIcon={<AddLinkIcon />}
                        onClick={() => { setDialogOpen(true); setSearchQuery(''); setSearchResults([]); }}
                    >
                        {translate('psyched.aggregation.associate', { _: 'Associate' })}
                    </Button>
                </Box>
            </Box>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {listFields.map(([name, meta]) => (
                                <TableCell key={name}>
                                    {translate(`resources.${reference}.fields.${name}`, { _: meta.label || name })}
                                </TableCell>
                            ))}
                            <TableCell align="right">
                                {translate('ra.action.edit')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={listFields.length + 1} align="center">
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={listFields.length + 1} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        {items.length === 0
                                            ? translate('psyched.aggregation.no_items', { resource: resourceLabel, _: `No ${resourceLabel} associated yet.` })
                                            : translate('ra.navigation.no_results', { _: 'No results found' })}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item, idx) => (
                                <TableRow key={(item['@id'] as string) || idx}>
                                    {listFields.map(([name, meta]) => (
                                        <TableCell key={name}>
                                            {formatCellValue(item[name], meta)}
                                        </TableCell>
                                    ))}
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleOpen(item)} title={translate('psyched.aggregation.open', { _: 'Open' })}>
                                            <OpenInNewIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => setDissociateTarget(item)} title={translate('psyched.aggregation.dissociate', { _: 'Dissociate' })}>
                                            <LinkOffIcon fontSize="small" />
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
                    {translate('psyched.aggregation.associate_title', { resource: resourceLabel, _: `Associate ${resourceLabel}` })}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        placeholder={translate('psyched.aggregation.search', { _: 'Search...' })}
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        sx={{ mt: 1, mb: 1 }}
                    />
                    {searching ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : searchResults.length === 0 && searchQuery ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                            {translate('psyched.aggregation.no_results', { _: 'No results found.' })}
                        </Typography>
                    ) : (
                        <List dense>
                            {searchResults.map((result) => (
                                <ListItem key={result['@id'] as string}>
                                    <ListItemText primary={String(result[displayField] ?? result.name ?? result.title ?? '')} />
                                    <ListItemSecondaryAction>
                                        <Button
                                            size="small"
                                            onClick={() => handleAssociate(result)}
                                        >
                                            {translate('psyched.aggregation.associate', { _: 'Associate' })}
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={dissociateTarget !== null} onClose={() => setDissociateTarget(null)}>
                <DialogTitle>
                    {translate('psyched.aggregation.dissociate_confirm_title', { _: 'Confirm dissociation' })}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {translate('psyched.aggregation.dissociate_confirm_message', {
                            item: String(dissociateTarget?.[displayField] ?? dissociateTarget?.name ?? dissociateTarget?.title ?? ''),
                            _: `Dissociate "${String(dissociateTarget?.[displayField] ?? dissociateTarget?.name ?? dissociateTarget?.title ?? '')}"?`,
                        })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDissociateTarget(null)}>
                        {translate('ra.action.cancel')}
                    </Button>
                    <Button
                        color="error"
                        onClick={() => {
                            if (dissociateTarget) {
                                handleDissociate(dissociateTarget);
                            }
                            setDissociateTarget(null);
                        }}
                    >
                        {translate('psyched.aggregation.dissociate', { _: 'Dissociate' })}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
