import { Autocomplete, TextField } from '@mui/material';

export default function MaterialSelect({ value, onChange, materials, label = "Material", size = "small", disabled = false, error = false, helperText = "" }) {
  // value is the material_id
  const selectedMaterial = materials.find(m => m.id === value) || null;

  return (
    <Autocomplete
      size={size}
      options={materials}
      value={selectedMaterial}
      disabled={disabled}
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
        />
      )}
    />
  );
}
