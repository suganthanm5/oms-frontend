import React from 'react';
import { Box, Typography } from '@mui/material';

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: 4,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            fontFamily: 'Space Grotesk, sans-serif',
            letterSpacing: '-0.02em',
            mb: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {action}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
