import { Autocomplete, TextField, InputAdornment, createFilterOptions } from '@mui/material';
import { Inventory } from '@mui/icons-material';

const filterOptions = createFilterOptions({
  matchFrom: 'any',
  stringify: (option) => `${option.code || ''} ${option.name || ''} ${option.alias || ''}`
});

export default function MaterialSelect({ value, onChange, materials, label = "Material", size = "small", disabled = false, error = false, helperText = "" }) {
  // value is the material_id
  const materialsList = Array.isArray(materials) ? materials : [];
  const selectedMaterial = materialsList.find(m => m.id === value) || null;

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
          helperText={helperText}
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
