import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

/**
 * Reusable confirmation dialog for dangerous actions.
 * Usage:
 *   <ConfirmDialog
 *     open={confirmOpen}
 *     title="Reject PO?"
 *     message="Are you sure you want to reject this Purchase Order? This action cannot be undone."
 *     confirmText="Yes, Reject"
 *     confirmColor="error"
 *     onConfirm={() => { doAction(); setConfirmOpen(false); }}
 *     onCancel={() => setConfirmOpen(false)}
 *   />
 */
export default function ConfirmDialog({ open, title, message, confirmText = 'Confirm', confirmColor = 'primary', onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ fontWeight: 500 }}>Cancel</Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm} sx={{ fontWeight: 600 }}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
