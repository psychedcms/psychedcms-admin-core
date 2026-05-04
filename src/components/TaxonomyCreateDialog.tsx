import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
} from '@mui/material';
import { useDataProvider, useNotify, useTranslate } from 'react-admin';
import { useQueryClient } from '@tanstack/react-query';
import { useLocaleSettings } from '../hooks/useLocaleSettings.ts';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface TaxonomyCreateDialogProps {
    open: boolean;
    /** Taxonomy type (e.g. "countries", "cities", "genres"). */
    taxonomyType: string;
    /** Pre-fill from the autocomplete's current search text. */
    defaultName?: string;
    onClose: () => void;
    /** Called with the created taxonomy on success — `slug` is the API id. */
    onCreated: (created: { slug: string; name: string }) => void;
}

/**
 * Slugify helper — lowercase, dashes, ASCII only. Matches the API regex
 * `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Intentionally simple: no unicode folding, the
 * editor can adjust the slug manually.
 */
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Inline taxonomy creation modal — opened from a `<RelationInput>` autocomplete
 * when the editor types a value that isn't in the list. Creates the taxonomy
 * via `POST /api/taxonomies` with the primary-locale name, optionally
 * persisting one extra-locale translation in the same request via the inline
 * `translations` array (Gedmo personal translations exposed by API Platform).
 *
 * On Mercure 5xx (or any error) we re-GET the slug before declaring failure —
 * the row is often persisted server-side even if the hub publish fails. This
 * matches the resilience pattern already used in `EnrichmentFormHook`.
 */
export function TaxonomyCreateDialog({
    open,
    taxonomyType,
    defaultName,
    onClose,
    onCreated,
}: TaxonomyCreateDialogProps) {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const translate = useTranslate();
    const queryClient = useQueryClient();
    const { defaultLocale, supportedLocales } = useLocaleSettings();

    // Locales other than the primary one (FR by default in this project).
    const extraLocales = useMemo(
        () => supportedLocales.filter((l) => l !== defaultLocale),
        [defaultLocale, supportedLocales],
    );

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state on open. Pre-fill the name from the autocomplete's typed text.
    useEffect(() => {
        if (open) {
            const initialName = defaultName ?? '';
            setName(initialName);
            setSlug(initialName ? generateSlug(initialName) : '');
            setSlugManuallyEdited(false);
            setTranslations({});
            setError(null);
        }
    }, [open, defaultName]);

    const handleNameChange = useCallback(
        (value: string) => {
            setName(value);
            if (!slugManuallyEdited) {
                setSlug(generateSlug(value));
            }
        },
        [slugManuallyEdited],
    );

    const handleSlugChange = useCallback((value: string) => {
        setSlugManuallyEdited(true);
        setSlug(value);
    }, []);

    const slugValid = SLUG_REGEX.test(slug);
    const canSubmit = name.trim().length > 0 && slugValid && !saving;

    const handleCreate = useCallback(async () => {
        if (!canSubmit) return;
        setSaving(true);
        setError(null);

        const trimmedName = name.trim();
        const cleanSlug = slug.trim();

        // Build the inline translations array (Gedmo personal translations are
        // serialized as a nested collection — verified on the live API).
        const translationsPayload = extraLocales
            .map((locale) => {
                const value = (translations[locale] ?? '').trim();
                if (!value || value === trimmedName) return null;
                return { locale, field: 'name', content: value };
            })
            .filter((v): v is { locale: string; field: string; content: string } => v !== null);

        const payload: Record<string, unknown> = {
            type: taxonomyType,
            slug: cleanSlug,
            name: trimmedName,
        };
        if (translationsPayload.length > 0) {
            payload.translations = translationsPayload;
        }

        try {
            const { data } = await dataProvider.create('taxonomies', { data: payload });
            const createdSlug = (data as { id?: string }).id ?? cleanSlug;
            const createdName = (data as { name?: string }).name ?? trimmedName;
            // Invalidate the cached `taxonomies` queries so the ReferenceInput
            // that opened us refetches and includes the freshly created row.
            await queryClient.invalidateQueries({ queryKey: ['taxonomies'] });
            onCreated({ slug: createdSlug, name: createdName });
        } catch (err) {
            // Mercure publish errors return 5xx after the row is persisted (cf.
            // local hub TLS issues). Re-GET the slug before declaring failure.
            try {
                const { data } = await dataProvider.getOne('taxonomies', { id: cleanSlug });
                if (data) {
                    const createdSlug = (data as { id?: string }).id ?? cleanSlug;
                    const createdName = (data as { name?: string }).name ?? trimmedName;
                    await queryClient.invalidateQueries({ queryKey: ['taxonomies'] });
                    onCreated({ slug: createdSlug, name: createdName });
                    return;
                }
            } catch {
                // Fall through to the user-visible error below.
            }
            const message =
                err instanceof Error ? err.message : translate('psyched.taxonomy.create_failed');
            setError(message);
            notify('psyched.taxonomy.create_failed', { type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [
        canSubmit,
        dataProvider,
        extraLocales,
        name,
        notify,
        onCreated,
        queryClient,
        slug,
        taxonomyType,
        translate,
        translations,
    ]);

    const titleType = translate(
        `resources.taxonomies.types.${taxonomyType}`,
        { _: taxonomyType },
    );
    const title = translate('psyched.taxonomy.create_title', { type: titleType });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label={translate('psyched.taxonomy.name_label')}
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                        fullWidth
                        size="small"
                        autoFocus
                    />

                    <TextField
                        label={translate('psyched.taxonomy.slug_label')}
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        required
                        fullWidth
                        size="small"
                        error={slug.length > 0 && !slugValid}
                        helperText={
                            slug.length > 0 && !slugValid
                                ? translate('psyched.taxonomy.slug_invalid')
                                : translate('psyched.taxonomy.slug_helper')
                        }
                    />

                    {extraLocales.length > 0 && (
                        <>
                            <Typography
                                variant="caption"
                                sx={{ fontWeight: 600, color: 'text.secondary', mt: 1 }}
                            >
                                {translate('psyched.taxonomy.translations_section')}
                            </Typography>
                            {extraLocales.map((locale) => (
                                <TextField
                                    key={locale}
                                    label={translate(`psyched.taxonomy.${locale}_label`, {
                                        _: translate('psyched.taxonomy.translation_label', {
                                            locale: locale.toUpperCase(),
                                        }),
                                    })}
                                    value={translations[locale] ?? ''}
                                    onChange={(e) =>
                                        setTranslations((prev) => ({
                                            ...prev,
                                            [locale]: e.target.value,
                                        }))
                                    }
                                    fullWidth
                                    size="small"
                                />
                            ))}
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    {translate('psyched.taxonomy.cancel')}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={!canSubmit}
                >
                    {translate('psyched.taxonomy.create')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
