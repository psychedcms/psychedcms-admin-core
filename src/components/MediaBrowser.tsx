import { useGetList, useNotify } from 'react-admin';
import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Pagination,
    CircularProgress,
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';

type MediaRecord = Record<string, any>;

interface MediaBrowserProps {
    open: boolean;
    onClose: () => void;
    onSelect: (media: MediaRecord) => void;
    mimeTypeFilter?: string;
}

const PER_PAGE = 24;

export function MediaBrowser({
    open,
    onClose,
    onSelect,
    mimeTypeFilter,
}: MediaBrowserProps) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [uploading, setUploading] = useState(false);
    const notify = useNotify();
    const { entrypoint } = usePsychedSchemaContext();

    const filter: Record<string, string> = {};
    if (search) {
        filter.originalFilename = search;
    }
    if (mimeTypeFilter) {
        filter.mimeType = mimeTypeFilter;
    }

    const { data, total, isLoading } = useGetList('media', {
        pagination: { page, perPage: PER_PAGE },
        sort: { field: 'createdAt', order: 'DESC' },
        filter,
    });

    const totalPages = total ? Math.ceil(total / PER_PAGE) : 0;

    const handleUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setUploading(true);
            try {
                const token = localStorage.getItem('token');
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`${entrypoint}/media`, {
                    method: 'POST',
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        Accept: 'application/ld+json',
                    },
                    body: formData,
                });

                if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

                const media = await response.json();
                onSelect(media);
                notify('File uploaded successfully', { type: 'success' });
            } catch (err) {
                notify(
                    `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                    { type: 'error' },
                );
            } finally {
                setUploading(false);
            }
        },
        [onSelect, notify, entrypoint],
    );

    const isImage = (mimeType?: string) => mimeType?.startsWith('image/');

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Media Library</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            component="label"
                            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                            disabled={uploading}
                        >
                            Upload
                            <input
                                type="file"
                                hidden
                                accept={mimeTypeFilter === 'image/' ? 'image/*' : undefined}
                                onChange={handleUpload}
                            />
                        </Button>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, v) => v && setViewMode(v)}
                            size="small"
                        >
                            <ToggleButton value="grid"><ViewModuleIcon /></ToggleButton>
                            <ToggleButton value="list"><ViewListIcon /></ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search by filename..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    sx={{ mb: 2 }}
                />

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : !data || data.length === 0 ? (
                    <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                        No media found.
                    </Typography>
                ) : viewMode === 'grid' ? (
                    <ImageList cols={4} rowHeight={140} gap={8}>
                        {data.map((media) => (
                            <ImageListItem
                                key={media.id}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 },
                                    border: '2px solid transparent',
                                    borderRadius: 1,
                                }}
                                onClick={() => onSelect(media)}
                            >
                                {isImage(media.mimeType) ? (
                                    <img
                                        src={media.thumbnailUrl || media.url}
                                        alt={media.altText ?? media.originalFilename ?? ''}
                                        style={{ objectFit: 'contain', height: '100%', backgroundColor: '#f5f5f5' }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'grey.100',
                                        }}
                                    >
                                        <InsertDriveFileIcon sx={{ fontSize: 48, color: 'grey.500' }} />
                                    </Box>
                                )}
                                <ImageListItemBar
                                    title={media.originalFilename}
                                    subtitle={media.mimeType}
                                    sx={{ '& .MuiImageListItemBar-title': { fontSize: '0.75rem' } }}
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                ) : (
                    <List>
                        {data.map((media) => (
                            <ListItem key={media.id} disablePadding>
                                <ListItemButton onClick={() => onSelect(media)}>
                                    <ListItemIcon>
                                        {isImage(media.mimeType) ? (
                                            <Box
                                                component="img"
                                                src={media.thumbnailUrl || media.url}
                                                alt=""
                                                sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 0.5 }}
                                            />
                                        ) : (
                                            <InsertDriveFileIcon />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={media.originalFilename}
                                        secondary={media.mimeType}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}

                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, p) => setPage(p)}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}
