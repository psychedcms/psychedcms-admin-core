import { useInput, useDataProvider, useNotify } from 'react-admin';
import { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    IconButton,
    Card,
    CardMedia,
    CardActions,
    Typography,
    CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import DeleteIcon from '@mui/icons-material/Delete';
import { MediaBrowser } from './MediaBrowser.tsx';
import { usePsychedSchemaContext } from '../providers/PsychedSchemaContext.ts';

interface MediaImageInputProps {
    source: string;
    label?: string;
    helperText?: string;
    required?: boolean;
}

export function MediaImageInput({
    source,
    label,
    helperText,
    required,
}: MediaImageInputProps) {
    const {
        field,
        fieldState: { error },
    } = useInput({ source });

    const dataProvider = useDataProvider();
    const notify = useNotify();
    const { entrypoint } = usePsychedSchemaContext();

    const [uploading, setUploading] = useState(false);
    const [browserOpen, setBrowserOpen] = useState(false);
    const [preview, setPreview] = useState<{
        url?: string;
        thumbnailUrl?: string;
        altText?: string;
        originalFilename?: string;
    } | null>(null);

    // Load preview when field has an existing value (IRI or resolved object)
    useEffect(() => {
        if (preview) return;

        const value = field.value;
        if (!value) return;

        // Hydra data provider may resolve IRI to a nested object
        if (typeof value === 'object' && value['@id']) {
            setPreview({
                url: value.url,
                thumbnailUrl: value.thumbnailUrl,
                altText: value.altText,
                originalFilename: value.originalFilename,
            });
            return;
        }

        // Value is an IRI string - fetch media data
        if (typeof value === 'string' && value.startsWith('/api/media/')) {
            dataProvider
                .getOne('media', { id: value })
                .then(({ data }) => {
                    setPreview({
                        url: data.url,
                        thumbnailUrl: data.thumbnailUrl,
                        altText: data.altText,
                        originalFilename: data.originalFilename,
                    });
                })
                .catch(() => {
                    // Media may have been deleted
                });
        }
    }, [field.value, preview, dataProvider]);

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

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }

                const media = await response.json();
                field.onChange(media['@id']);
                setPreview({
                    url: media.url,
                    thumbnailUrl: media.thumbnailUrl,
                    altText: media.altText,
                    originalFilename: media.originalFilename,
                });
                notify('Image uploaded successfully', { type: 'success' });
            } catch (err) {
                notify(
                    `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                    { type: 'error' },
                );
            } finally {
                setUploading(false);
            }
        },
        [field, notify, entrypoint],
    );

    const handleBrowseSelect = useCallback(
        (media: Record<string, any>) => {
            field.onChange(media['@id']);
            setPreview({
                url: media.url,
                thumbnailUrl: media.thumbnailUrl,
                altText: media.altText,
                originalFilename: media.originalFilename,
            });
            setBrowserOpen(false);
        },
        [field],
    );

    const handleRemove = useCallback(() => {
        field.onChange(null);
        setPreview(null);
    }, [field]);

    const handleAltTextChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const newAltText = event.target.value;
            setPreview((prev) => (prev ? { ...prev, altText: newAltText } : null));

            if (field.value) {
                try {
                    const iri = typeof field.value === 'string' ? field.value : field.value['@id'];
                    const id = iri?.split('/').pop();
                    await dataProvider.update('media', {
                        id: iri,
                        data: { altText: newAltText },
                        previousData: { id },
                    });
                } catch {
                    // Silent fail for alt text updates
                }
            }
        },
        [field.value, dataProvider],
    );

    const hasValue = field.value != null && field.value !== '';

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                {label ?? source}
                {required && ' *'}
            </Typography>

            {hasValue && preview ? (
                <Card variant="outlined" sx={{ maxWidth: 400 }}>
                    <CardMedia
                        component="img"
                        image={preview.thumbnailUrl || preview.url}
                        alt={preview.altText ?? ''}
                        sx={{ height: 200, objectFit: 'contain', bgcolor: 'grey.100' }}
                    />
                    <Box sx={{ p: 1 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Alt text"
                            value={preview.altText ?? ''}
                            onChange={handleAltTextChange}
                            variant="outlined"
                            sx={{ mb: 1 }}
                        />
                        {preview.originalFilename && (
                            <Typography variant="caption" color="textSecondary">
                                {preview.originalFilename}
                            </Typography>
                        )}
                    </Box>
                    <CardActions>
                        <Button
                            size="small"
                            startIcon={<PhotoLibraryIcon />}
                            onClick={() => setBrowserOpen(true)}
                        >
                            Replace
                        </Button>
                        <IconButton size="small" color="error" onClick={handleRemove}>
                            <DeleteIcon />
                        </IconButton>
                    </CardActions>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                        disabled={uploading}
                    >
                        Upload
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleUpload}
                        />
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PhotoLibraryIcon />}
                        onClick={() => setBrowserOpen(true)}
                    >
                        Browse
                    </Button>
                </Box>
            )}

            {error && (
                <Typography variant="caption" color="error">
                    {error.message}
                </Typography>
            )}
            {helperText && !error && (
                <Typography variant="caption" color="textSecondary">
                    {helperText}
                </Typography>
            )}

            <MediaBrowser
                open={browserOpen}
                onClose={() => setBrowserOpen(false)}
                onSelect={handleBrowseSelect}
                mimeTypeFilter="image/"
            />
        </Box>
    );
}
