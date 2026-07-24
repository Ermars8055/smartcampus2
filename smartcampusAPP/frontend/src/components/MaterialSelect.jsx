import { useState } from 'react';
import { Autocomplete, TextField, InputAdornment, createFilterOptions } from '@mui/material';
import { Inventory } from '@mui/icons-material';

const filterOptions = createFilterOptions({
  matchFrom: 'any',
  limit: 50,
  stringify: (option) => `${option.code || ''} ${option.name || ''} ${option.alias || ''}`
});

export default function MaterialSelect({ value, onChange, materials, label = "Material", size = "small", disabled = false, error = false, helperText = "" }) {
  // value is the material_id
  const [isExpanded, setIsExpanded] = useState(false);
  const materialsList = Array.isArray(materials) ? materials : [];
  const selectedMaterial = materialsList.find(m => m.id === value) || null;
  
  let materialDisplayText = '';
  if (selectedMaterial) {
    if (selectedMaterial.name.length > 32 && !isExpanded) {
      materialDisplayText = selectedMaterial.name.substring(0, 27) + '.....';
    } else {
      materialDisplayText = selectedMaterial.name;
    }
  }
  
  const displayHelperText = error ? helperText : (selectedMaterial ? materialDisplayText : helperText);

  return (
    <Autocomplete
      size={size}
      options={materialsList}
      value={selectedMaterial}
      disabled={disabled}
      filterOptions={filterOptions}
      onChange={(event, newValue) => {
        onChange(newValue ? newValue.id : '');
      }}
      getOptionLabel={(option) => `${option.code || ''} - ${option.name || ''}`}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      renderInput={(params) => (
        <TextField 
          {...params} 
          label={label} 
          required 
          error={error}
          helperText={displayHelperText}
          FormHelperTextProps={{
            onClick: () => {
              if (!error && selectedMaterial && selectedMaterial.name.length > 32) {
                setIsExpanded(!isExpanded);
              }
            },
            sx: {
              color: (!error && selectedMaterial) ? '#1e293b' : undefined,
              fontWeight: (!error && selectedMaterial) ? 600 : undefined,
              whiteSpace: (!error && selectedMaterial) ? 'normal' : undefined,
              wordWrap: (!error && selectedMaterial) ? 'break-word' : undefined,
              ml: (!error && selectedMaterial) ? 0 : undefined,
              cursor: (!error && selectedMaterial && selectedMaterial.name.length > 32) ? 'pointer' : undefined
            }
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <Inventory sx={{ color: '#94A3B8', fontSize: 18, ml: 0.5 }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
