import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
        }}>
            <Typography variant="h5" fontWeight={600}>{title}</Typography>
            {actions && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {actions}
                </Box>
            )}
        </Box>
    );
}
