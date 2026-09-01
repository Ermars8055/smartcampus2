import { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, InputAdornment, CircularProgress } from '@mui/material';
import { Inventory } from '@mui/icons-material';
import api from '../services/api';

export default function MaterialSelect({ value, onChange, materials, label = "Material", size = "small", disabled = false, error = false, helperText = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Maintain the selected object
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    if (value) {
      if (selectedMaterial && selectedMaterial.id === value) return;
      if (materials && materials.length > 0) {
        const found = materials.find(m => m.id === value);
        if (found) {
          setSelectedMaterial(found);
          setOptions(prev => prev.find(p => p.id === found.id) ? prev : [...prev, found]);
          return;
        }
      }
      api.get(`/api/materials/${value}`).then(res => {
         setSelectedMaterial(res.data);
         setOptions(prev => prev.find(p => p.id === res.data.id) ? prev : [...prev, res.data]);
      }).catch(err => console.error(err));
    } else {
      setSelectedMaterial(null);
    }
  }, [value, materials, selectedMaterial]);

  const fetchMaterials = useMemo(() => {
    let timeout;
    return (search) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setLoading(true);
        api.get('/api/materials', { params: { search, limit: 50 } })
          .then(res => {
             let newOptions = res.data.items || [];
             setOptions(prev => {
                const currentSelection = prev.find(p => p.id === value);
                if (currentSelection && !newOptions.find(o => o.id === currentSelection.id)) {
                  return [currentSelection, ...newOptions];
                }
                return newOptions;
             });
          })
          .catch(() => setOptions([]))
          .finally(() => setLoading(false));
      }, 300);
    };
  }, [value]);

  useEffect(() => {
    fetchMaterials(inputValue);
  }, [inputValue, fetchMaterials]);
  
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
      options={options}
      value={selectedMaterial}
      disabled={disabled}
      filterOptions={(x) => x}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, newValue) => {
        setSelectedMaterial(newValue);
        onChange(newValue ? newValue.id : '', newValue); // Pass the full object as second param
      }}
      getOptionLabel={(option) => `${option.code || ''} - ${option.name || ''}`}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      loading={loading}
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
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
