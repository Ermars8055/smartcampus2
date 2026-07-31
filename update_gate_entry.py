import re

with open('/home/ngadmin/smartcampus2/frontend/src/pages/GateEntry.jsx', 'r') as f:
    content = f.read()

new_dialog_content = """        <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={3}>
            {/* Invoice Section (Left Half) */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Invoice Details {(form.invoice_number || form.invoice_date || form.invoice_amount || form.invoice_scan_url) ? <span style={{color: '#d32f2f'}}>*</span> : ''}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Invoice Number *" value={form.invoice_number} onChange={e => { setForm({ ...form, invoice_number: e.target.value }); setErrors(prev => ({ ...prev, invoice_number: null })); }} error={!!errors.invoice_number} helperText={errors.invoice_number} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Invoice Date *" type="date" value={form.invoice_date} onChange={e => { setForm({ ...form, invoice_date: e.target.value }); setErrors(prev => ({ ...prev, invoice_date: null })); }} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] }} error={!!errors.invoice_date} helperText={errors.invoice_date} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth className="no-spin" label="Amount" type="number" inputProps={{ step: "0.01", min: "0" }} value={form.invoice_amount} onChange={e => setForm({ ...form, invoice_amount: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  {form.invoice_scan_url ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid #E2E8F0', borderRadius: 1 }}>
                      <AttachFile sx={{ color: '#1E3A8A' }} />
                      <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#1E3A8A' }}>Invoice attached ✓</Typography>
                      <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.invoice_scan_url), '_blank')}>View</Button>
                      <Button size="small" color="error" onClick={() => setForm({ ...form, invoice_scan_url: '' })}>Remove</Button>
                    </Box>
                  ) : (
                    <Button fullWidth variant="outlined" component="label" disabled={uploading}
                      color={errors.invoice_scan_url ? 'error' : 'primary'}
                      sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}>
                      {uploading ? 'Uploading...' : '📎 Upload Invoice'}
                      <input type="file" hidden accept="image/*,application/pdf" capture="environment"
                        onChange={e => handleUpload(e.target.files[0], 'invoice_scan_url')} />
                    </Button>
                  )}
                  {errors.invoice_scan_url && <FormHelperText error>{errors.invoice_scan_url}</FormHelperText>}
                </Grid>
              </Grid>
            </Grid>

            {/* DC Section (Right Half) */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Delivery Challan Details {(form.dc_number || form.dc_date || form.dc_scan_url) ? <span style={{color: '#d32f2f'}}>*</span> : ''}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="DC Number *" value={form.dc_number} onChange={e => { setForm({ ...form, dc_number: e.target.value }); setErrors(prev => ({ ...prev, dc_number: null })); }} error={!!errors.dc_number} helperText={errors.dc_number} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="DC Date *" type="date" value={form.dc_date} onChange={e => { setForm({ ...form, dc_date: e.target.value }); setErrors(prev => ({ ...prev, dc_date: null })); }} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] }} error={!!errors.dc_date} helperText={errors.dc_date} />
                </Grid>
                <Grid item xs={12}>
                  {form.dc_scan_url ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid #E2E8F0', borderRadius: 1 }}>
                      <AttachFile sx={{ color: '#1E3A8A' }} />
                      <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#1E3A8A' }}>DC attached ✓</Typography>
                      <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.dc_scan_url), '_blank')}>View</Button>
                      <Button size="small" color="error" onClick={() => setForm({ ...form, dc_scan_url: '' })}>Remove</Button>
                    </Box>
                  ) : (
                    <Button fullWidth variant="outlined" component="label" disabled={uploading}
                      color={errors.dc_scan_url ? 'error' : 'primary'}
                      sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}>
                      {uploading ? 'Uploading...' : '📎 Upload Delivery Challan'}
                      <input type="file" hidden accept="image/*,application/pdf" capture="environment"
                        onChange={e => handleUpload(e.target.files[0], 'dc_scan_url')} />
                    </Button>
                  )}
                  {errors.dc_scan_url && <FormHelperText error>{errors.dc_scan_url}</FormHelperText>}
                </Grid>
              </Grid>
            </Grid>

            {/* Delivery Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 2, fontWeight: 600 }}>Delivery Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Vehicle Number" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Delivery Person Name *" value={form.delivery_person_name} onChange={e => { setForm({ ...form, delivery_person_name: e.target.value }); setErrors(prev => ({ ...prev, delivery_person_name: null })); }} error={!!errors.delivery_person_name} helperText={errors.delivery_person_name} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField inputProps={{ maxLength: 255 }} fullWidth label="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Any additional notes..." />
                </Grid>
              </Grid>
            </Grid>

            {/* Vehicle Weight Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 2, fontWeight: 600 }}>Vehicle Weight Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth className="no-spin" label="Tare Weight (Empty)" type="number" inputProps={{ step: "0.01", min: "0" }} value={form.tare_weight} onChange={e => {
                    const val = e.target.value;
                    const net = (form.gross_weight && val) ? (parseFloat(form.gross_weight) - parseFloat(val)).toFixed(2) : '';
                    setForm({ ...form, tare_weight: val, net_weight: net });
                    setErrors(prev => ({ ...prev, gross_weight: null }));
                  }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth className="no-spin" label="Gross Weight (Loaded)" type="number" inputProps={{ step: "0.01", min: "0" }} value={form.gross_weight} onChange={e => {
                    const val = e.target.value;
                    const net = (val && form.tare_weight) ? (parseFloat(val) - parseFloat(form.tare_weight)).toFixed(2) : '';
                    setForm({ ...form, gross_weight: val, net_weight: net });
                    setErrors(prev => ({ ...prev, gross_weight: null }));
                  }} error={!!errors.gross_weight} helperText={errors.gross_weight} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth className="no-spin" label="Net Weight" type="number" value={form.net_weight} InputProps={{ readOnly: true }} disabled />
                </Grid>
                <Grid item xs={12} sm={3}>
                  {form.weight_report_url ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid #E2E8F0', borderRadius: 1 }}>
                      <AttachFile sx={{ color: '#475569' }} />
                      <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#475569' }}>Report ✓</Typography>
                      <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.weight_report_url), '_blank')}>View</Button>
                      <Button size="small" color="error" onClick={() => setForm({ ...form, weight_report_url: '' })}>Remove</Button>
                    </Box>
                  ) : (
                    <Button fullWidth variant="outlined" component="label" disabled={uploading}
                      sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, color: '#475569', borderColor: '#475569' }}>
                      {uploading ? 'Uploading...' : '📎 Upload Report'}
                      <input type="file" hidden accept="image/*,application/pdf" capture="environment"
                        onChange={e => handleUpload(e.target.files[0], 'weight_report_url')} />
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Grid>

          </Grid>
        </DialogContent>"""

pattern = re.compile(r'<DialogContent sx=\{\{ px: 4, py: 2 \}\}>.*?</DialogContent>', re.DOTALL)
new_content = pattern.sub(new_dialog_content, content)

with open('/home/ngadmin/smartcampus2/frontend/src/pages/GateEntry.jsx', 'w') as f:
    f.write(new_content)

print("Updated GateEntry.jsx successfully")
