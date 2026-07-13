import { useState, useRef, useEffect } from 'react';
import { Popper, ClickAwayListener, Paper, InputBase, Box } from '@mui/material';
import './SearchableSelect.css';

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SearchableSelect = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = 'Select option...', 
  searchPlaceholder = 'Search...',
  disabled = false,
  required = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const anchorRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option display text
  const selectedOption = options.find(opt => String(opt.id) === String(value));
  const displayText = selectedOption ? selectedOption.name : '';

  // Handle option selection
  const handleSelect = (option) => {
    onChange(option.id, option.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', '');
    setSearchTerm('');
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box className={`searchable-select ${disabled ? 'disabled' : ''}`} sx={{ width: '100%' }}>
        <Box 
          ref={anchorRef}
          className={`select-trigger ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className="select-value">
            {displayText || placeholder}
          </span>
          <Box className="select-actions">
            {value && !disabled && (
              <button 
                type="button" 
                className="clear-btn" 
                onClick={handleClear}
                title="Clear selection"
              >
                <IconX />
              </button>
            )}
            <span className="chevron">
              <IconChevronDown />
            </span>
          </Box>
        </Box>

        <Popper
          open={isOpen}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          disablePortal={false}
          style={{ zIndex: 9999, width: anchorRef.current?.offsetWidth }}
        >
          <Paper className="select-dropdown" sx={{ mt: 0.5, borderRadius: 2, overflow: 'hidden', bgcolor: 'var(--color-bg-sidebar)', border: '1px solid var(--color-border-hr)' }}>
            <Box className="search-box" sx={{ p: 1.5, borderBottom: '1px solid var(--color-border-hr)', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'var(--color-bg-primary)' }}>
              <IconSearch />
              <InputBase
                inputRef={searchInputRef}
                placeholder={searchPlaceholder}
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ fontSize: '0.875rem', fontFamily: "inherit", color: 'var(--color-text-primary)' }}
              />
            </Box>
            
            <Box className="options-list" sx={{ maxHeight: 250, overflowY: 'auto' }}>
              {filteredOptions.length === 0 ? (
                <Box className="no-options" sx={{ p: 2, textAlign: 'center', color: 'var(--color-text-placeholder)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                  {searchTerm ? 'No matches found' : 'No options available'}
                </Box>
              ) : (
                filteredOptions.map((option) => (
                  <Box
                    key={option.id}
                    className={`option-item ${String(option.id) === String(value) ? 'selected' : ''}`}
                    onClick={() => handleSelect(option)}
                    sx={{
                      p: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-primary)',
                      borderBottom: '1px solid var(--color-border-hr)',
                      '&:hover': { bgcolor: 'var(--color-bg-primary)', color: 'var(--color-primary-main)' },
                      ...(String(option.id) === String(value) && { bgcolor: 'var(--color-bg-secondary)', color: 'var(--color-primary-main)', fontWeight: 600 })
                    }}
                  >
                    {option.name}
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default SearchableSelect;
