import { Box, Card, CardContent, Typography } from '@mui/material';
import {
    TextField,
    DateField,
    Labeled,
    useRecordContext,
    useResourceContext,
} from 'react-admin';
import { SidebarSlot } from '../slots/SidebarSlot.tsx';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';

/**
 * Edit form sidebar showing content metadata (slug, dates)
 * plus any plugin sidebar widgets (e.g. locale switcher).
 */
export function ContentSidebar() {
    const record = useRecordContext();
    const resource = useResourceContext();
    const schema = usePsychedSchema(resource ?? '');

    if (!record) return null;

    return (
        <Box sx={{ width: 280, ml: 2 }}>
            <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                        {schema?.contentType?.singularName ?? 'Content'}
                    </Typography>
                    <Labeled label="Slug">
                        <TextField source="slug" />
                    </Labeled>
                    {record.createdAt && (
                        <Labeled label="Created">
                            <DateField source="createdAt" showTime />
                        </Labeled>
                    )}
                    {record.updatedAt && (
                        <Labeled label="Updated">
                            <DateField source="updatedAt" showTime />
                        </Labeled>
                    )}
                </CardContent>
            </Card>
            <SidebarSlot resource={resource} />
        </Box>
    );
}
