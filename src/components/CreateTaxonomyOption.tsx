import { useState, useEffect } from 'react';
import { useCreateSuggestionContext } from 'react-admin';
import { TaxonomyCreateDialog } from './TaxonomyCreateDialog.tsx';

interface CreateTaxonomyOptionProps {
    /** Taxonomy type the autocomplete is filtered by (`countries`, `genres`, …). */
    taxonomyType: string;
}

/**
 * Component rendered by `<AutocompleteInput create={…}>` when the user clicks
 * the "Add a new entry" suggestion. Pulls the typed text and the wired
 * `onCreate` / `onCancel` callbacks from `useCreateSuggestionContext`, opens
 * `TaxonomyCreateDialog`, and once the row is created hands back a choice
 * shaped `{ id: slug, name }` so react-admin adopts it into the form.
 */
export function CreateTaxonomyOption({ taxonomyType }: CreateTaxonomyOptionProps) {
    const { filter, onCreate, onCancel } = useCreateSuggestionContext();
    const [open, setOpen] = useState(true);

    // Re-open the dialog if the context fires again (e.g. user reopens after
    // cancel within the same input).
    useEffect(() => {
        setOpen(true);
    }, [filter]);

    const handleClose = () => {
        setOpen(false);
        onCancel();
    };

    const handleCreated = (created: { slug: string; name: string }) => {
        setOpen(false);
        // The `id` field is what react-admin uses as the form value (slugs are
        // the API identifiers — cf. backend/api.md "Identifier Convention:
        // Slug"). The `name` is what the AutocompleteInput renders (we keep
        // `optionText="name"` on the parent input).
        onCreate({ id: created.slug, name: created.name });
    };

    return (
        <TaxonomyCreateDialog
            open={open}
            taxonomyType={taxonomyType}
            defaultName={filter}
            onClose={handleClose}
            onCreated={handleCreated}
        />
    );
}
