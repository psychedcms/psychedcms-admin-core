import { Box, Typography } from '@mui/material';
import type { ReactElement, ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    icon?: ReactElement | null;
    actions?: ReactNode;
}

export function PageHeader({ title, icon, actions }: PageHeaderProps) {
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon}
                <Typography variant="h5" fontWeight={600}>{title}</Typography>
            </Box>
            {actions && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {actions}
                </Box>
            )}
        </Box>
    );
}
