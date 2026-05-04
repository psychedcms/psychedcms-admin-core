import { useCallback } from 'react';
import { useInput, useTranslate } from 'react-admin';
import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
    Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FieldMetadata } from '../types/psychedcms.ts';

interface CollectionInputProps {
    source: string;
    label?: string;
    meta: FieldMetadata;
}

interface SchemaEntryObject {
    type: string;
    values?: string[] | Record<string, string>;
    label?: string;
}

type SchemaEntry = string | SchemaEntryObject;
type SchemaMap = Record<string, SchemaEntry>;

function entryType(entry: SchemaEntry): string {
    return typeof entry === 'string' ? entry : entry.type;
}

function entryLabel(name: string, entry: SchemaEntry): string {
    if (typeof entry === 'object' && entry.label) return entry.label;
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
}

function makeEmptyItem(schema: SchemaMap): Record<string, unknown> {
    const item: Record<string, unknown> = {};
    for (const name of Object.keys(schema)) {
        item[name] = '';
    }
    return item;
}

/**
 * Format integer seconds as "m:ss" or "h:mm:ss".
 */
function formatDuration(value: unknown): string {
    if (typeof value === 'number' && value >= 0) {
        const total = Math.floor(value);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${m}:${String(s).padStart(2, '0')}`;
    }
    if (typeof value === 'string') return value;
    return '';
}

/**
 * Parse a duration string ("3:05", "1:02:33", or plain "185") to integer seconds.
 * Returns null when invalid; the empty string returns null too.
 */
function parseDuration(input: string): number | null {
    const s = input.trim();
    if (s === '') return null;
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    const parts = s.split(':');
    if (parts.length < 2 || parts.length > 3) return null;
    const nums = parts.map((p) => (/^\d+$/.test(p) ? parseInt(p, 10) : NaN));
    if (nums.some((n) => Number.isNaN(n))) return null;
    if (nums.length === 2) return nums[0] * 60 + nums[1];
    return nums[0] * 3600 + nums[1] * 60 + nums[2];
}

interface FieldRendererProps {
    name: string;
    entry: SchemaEntry;
    value: unknown;
    onChange: (value: unknown) => void;
}

function SubFieldRenderer({ name, entry, value, onChange }: FieldRendererProps) {
    const type = entryType(entry);
    const label = entryLabel(name, entry);

    if (type === 'duration') {
        const display = formatDuration(value);
        return (
            <TextField
                size="small"
                label={label}
                placeholder="m:ss"
                value={display}
                onChange={(e) => onChange(e.target.value)}
                onBlur={(e) => {
                    const parsed = parseDuration(e.target.value);
                    onChange(parsed);
                }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <Typography variant="caption" color="text.secondary">
                                m:ss
                            </Typography>
                        </InputAdornment>
                    ),
                }}
                sx={{ minWidth: 110, maxWidth: 140 }}
            />
        );
    }

    if (type === 'number') {
        return (
            <TextField
                size="small"
                type="number"
                label={label}
                value={value === null || value === undefined ? '' : String(value)}
                onChange={(e) => {
                    const v = e.target.value;
                    onChange(v === '' ? null : Number(v));
                }}
                sx={{ maxWidth: 120 }}
            />
        );
    }

    if (type === 'select' && typeof entry === 'object' && entry.values) {
        const options = Array.isArray(entry.values)
            ? entry.values.map((v) => ({ value: v, label: v }))
            : Object.entries(entry.values).map(([v, l]) => ({ value: v, label: l }));
        return (
            <Select
                size="small"
                value={String(value ?? '')}
                onChange={(e) => onChange(e.target.value)}
                displayEmpty
                sx={{ minWidth: 120 }}
            >
                <MenuItem value="">
                    <em>{label}</em>
                </MenuItem>
                {options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>
        );
    }

    // Default: text
    return (
        <TextField
            size="small"
            label={label}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            fullWidth
        />
    );
}

interface SortableRowProps {
    id: string;
    schema: SchemaMap;
    item: Record<string, unknown>;
    onChange: (fieldName: string, value: unknown) => void;
    onRemove: () => void;
    sortable: boolean;
    translate: (key: string, options?: object) => string;
}

function CollectionRow({
    id,
    schema,
    item,
    onChange,
    onRemove,
    sortable,
    translate,
}: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !sortable });

    const style = sortable
        ? {
              transform: CSS.Transform.toString(transform),
              transition,
              opacity: isDragging ? 0.5 : 1,
          }
        : undefined;

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}
        >
            {sortable && (
                <Tooltip title={translate('ra.action.move', { _: 'Drag to reorder' })}>
                    <IconButton
                        size="small"
                        sx={{ cursor: 'grab', touchAction: 'none' }}
                        {...attributes}
                        {...listeners}
                        aria-label="drag handle"
                    >
                        <DragIndicatorIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            {Object.entries(schema).map(([name, entry]) => (
                <SubFieldRenderer
                    key={name}
                    name={name}
                    entry={entry}
                    value={item[name]}
                    onChange={(v) => onChange(name, v)}
                />
            ))}
            <IconButton size="small" onClick={onRemove} color="error">
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}

export function CollectionInput({ source, label, meta }: CollectionInputProps) {
    const { field } = useInput({ source });
    const translate = useTranslate();
    const schema = (meta.schema ?? {}) as SchemaMap;
    const sortable = Boolean((meta as FieldMetadata & { sortable?: boolean }).sortable);
    const items: Record<string, unknown>[] = Array.isArray(field.value) ? field.value : [];

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const handleAdd = useCallback(() => {
        field.onChange([...items, makeEmptyItem(schema)]);
    }, [items, field, schema]);

    const handleRemove = useCallback(
        (index: number) => {
            field.onChange(items.filter((_, i) => i !== index));
        },
        [items, field],
    );

    const handleChange = useCallback(
        (index: number, fieldName: string, value: unknown) => {
            const next = items.map((item, i) =>
                i === index ? { ...item, [fieldName]: value } : item,
            );
            field.onChange(next);
        },
        [items, field],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = parseInt(String(active.id), 10);
            const newIndex = parseInt(String(over.id), 10);
            if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return;
            field.onChange(arrayMove(items, oldIndex, newIndex));
        },
        [items, field],
    );

    const rows = items.map((item, index) => (
        <CollectionRow
            key={index}
            id={String(index)}
            schema={schema}
            item={item}
            sortable={sortable}
            translate={translate}
            onChange={(name, value) => handleChange(index, name, value)}
            onRemove={() => handleRemove(index)}
        />
    ));

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

            {sortable ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map((_, i) => String(i))} strategy={verticalListSortingStrategy}>
                        {rows}
                    </SortableContext>
                </DndContext>
            ) : (
                rows
            )}

            {items.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ py: 1, textAlign: 'center' }}>
                    {translate('ra.page.empty')}
                </Typography>
            )}
        </Paper>
    );
}
