import React from 'react';
import { Chip } from '@mui/material';

const StatusChip = ({ label, color, bg, Icon, ...props }) => {
  return (
    <Chip
      label={label}
      icon={Icon ? <Icon sx={{ fontSize: '1rem !important' }} /> : undefined}
      sx={{
        backgroundColor: bg || '#f1f5f9',
        color: color || '#475569',
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '6px',
        height: '24px',
        fontFamily: 'Manrope, sans-serif',
        '& .MuiChip-label': {
          px: 1,
        },
        '& .MuiChip-icon': {
          color: 'inherit',
          marginLeft: '4px',
          marginRight: '-4px',
        },
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default StatusChip;
