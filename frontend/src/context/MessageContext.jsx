import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button, 
  Box, 
  Typography,
  IconButton
} from '@mui/material';
import { 
  Info as InfoIcon, 
  CheckCircle as SuccessIcon, 
  Error as ErrorIcon, 
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const MessageContext = createContext();

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    severity: 'info', // 'info', 'success', 'error', 'warning'
    type: 'alert', // 'alert' or 'confirm'
    onConfirm: null,
    onCancel: null
  });

  const showMessage = useCallback((message, title = 'Information', severity = 'info') => {
    let formattedMessage = message;
    if (typeof message === 'object' && message !== null && !React.isValidElement(message)) {
      if (Array.isArray(message)) {
        formattedMessage = message.map(m => m.msg || JSON.stringify(m)).join(', ');
      } else {
        formattedMessage = message.msg || JSON.stringify(message);
      }
    }
    setConfig({
      title,
      message: formattedMessage,
      severity,
      type: 'alert',
      onConfirm: null,
      onCancel: null
    });
    setOpen(true);
  }, []);

  const showConfirm = useCallback((message, title = 'Confirmation', onConfirm, severity = 'warning') => {
    let formattedMessage = message;
    if (typeof message === 'object' && message !== null && !React.isValidElement(message)) {
      if (Array.isArray(message)) {
        formattedMessage = message.map(m => m.msg || JSON.stringify(m)).join(', ');
      } else {
        formattedMessage = message.msg || JSON.stringify(message);
      }
    }
    setConfig({
      title,
      message: formattedMessage,
      severity,
      type: 'confirm',
      onConfirm,
      onCancel: null
    });
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (config.type === 'confirm' && config.onCancel) config.onCancel();
  };

  const handleConfirm = () => {
    setOpen(false);
    if (config.onConfirm) config.onConfirm();
  };

  const getIcon = () => {
    switch (config.severity) {
      case 'success': return <SuccessIcon sx={{ color: 'success.main', fontSize: 40 }} />;
      case 'error': return <ErrorIcon sx={{ color: 'error.main', fontSize: 40 }} />;
      case 'warning': return <WarningIcon sx={{ color: 'warning.main', fontSize: 40 }} />;
      default: return <InfoIcon sx={{ color: 'info.main', fontSize: 40 }} />;
    }
  };

  return (
    <MessageContext.Provider value={{ showMessage, showConfirm }}>
      {children}
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ textAlign: 'center', pt: 0, px: 3 }}>
          <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '50%', 
              bgcolor: `${config.severity}.light`,
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              mb: 1
            }}>
              {React.cloneElement(getIcon(), { sx: { fontSize: 48, color: `${config.severity}.main` } })}
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {config.title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '1.05rem' }}>
            {config.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, px: 4, pt: 2, gap: 2 }}>
          {config.type === 'confirm' ? (
            <>
              <Button 
                variant="outlined" 
                onClick={handleClose} 
                fullWidth
                sx={{ 
                  py: 1.5, 
                  borderRadius: 3,
                  fontWeight: 700,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover', borderColor: 'text.primary' }
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color={config.severity === 'warning' ? 'warning' : 'primary'}
                onClick={handleConfirm} 
                fullWidth
                sx={{ 
                  py: 1.5, 
                  borderRadius: 3,
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                }}
              >
                Confirm
              </Button>
            </>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleClose} 
              fullWidth
              sx={{ 
                py: 1.5, 
                borderRadius: 3,
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
              }}
            >
              Okay
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </MessageContext.Provider>
  );
};
