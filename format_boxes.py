import re

with open('/home/ngadmin/smartcampus2/frontend/src/pages/GateEntry.jsx', 'r') as f:
    content = f.read()

new_content = content.replace('''            {/* Invoice Section (Left Half) */}
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
            </Grid>''', '''            {/* Invoice Section (Left Half) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Invoice Details {(form.invoice_number || form.invoice_date || form.invoice_amount || form.invoice_scan_url) ? <span style={{color: '#d32f2f'}}>*</span> : ''}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Invoice Number *" value={form.invoice_number} onChange={e => { setForm({ ...form, invoice_number: e.target.value }); setErrors(prev => ({ ...prev, invoice_number: null })); }} error={!!errors.invoice_number} helperText={errors.invoice_number} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Invoice Date *" type="date" value={form.invoice_date} onChange={e => { setForm({ ...form, invoice_date: e.target.value }); setErrors(prev => ({ ...prev, invoice_date: null })); }} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] }} error={!!errors.invoice_date} helperText={errors.invoice_date} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth className="no-spin" label="Amount" type="number" inputProps={{ step: "0.01", min: "0" }} value={form.invoice_amount} onChange={e => setForm({ ...form, invoice_amount: e.target.value })} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12}>
                    {form.invoice_scan_url ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: 'white' }}>
                        <AttachFile sx={{ color: '#1E3A8A' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#1E3A8A' }}>Invoice attached ✓</Typography>
                        <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.invoice_scan_url), '_blank')}>View</Button>
                        <Button size="small" color="error" onClick={() => setForm({ ...form, invoice_scan_url: '' })}>Remove</Button>
                      </Box>
                    ) : (
                      <Button fullWidth variant="outlined" component="label" disabled={uploading}
                        color={errors.invoice_scan_url ? 'error' : 'primary'}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{uploading ? 'Uploading...' : '📎 Upload Invoice'}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem', mt: 0.5, textTransform: 'none' }}>(PDF, PNG, JPG allowed)</Typography>
                        <input type="file" hidden accept="image/*,application/pdf" capture="environment"
                          onChange={e => handleUpload(e.target.files[0], 'invoice_scan_url')} />
                      </Button>
                    )}
                    {errors.invoice_scan_url && <FormHelperText error>{errors.invoice_scan_url}</FormHelperText>}
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* DC Section (Right Half) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Delivery Challan Details {(form.dc_number || form.dc_date || form.dc_scan_url) ? <span style={{color: '#d32f2f'}}>*</span> : ''}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="DC Number *" value={form.dc_number} onChange={e => { setForm({ ...form, dc_number: e.target.value }); setErrors(prev => ({ ...prev, dc_number: null })); }} error={!!errors.dc_number} helperText={errors.dc_number} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="DC Date *" type="date" value={form.dc_date} onChange={e => { setForm({ ...form, dc_date: e.target.value }); setErrors(prev => ({ ...prev, dc_date: null })); }} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] }} error={!!errors.dc_date} helperText={errors.dc_date} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12}>
                    {form.dc_scan_url ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: 'white' }}>
                        <AttachFile sx={{ color: '#1E3A8A' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#1E3A8A' }}>DC attached ✓</Typography>
                        <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.dc_scan_url), '_blank')}>View</Button>
                        <Button size="small" color="error" onClick={() => setForm({ ...form, dc_scan_url: '' })}>Remove</Button>
                      </Box>
                    ) : (
                      <Button fullWidth variant="outlined" component="label" disabled={uploading}
                        color={errors.dc_scan_url ? 'error' : 'primary'}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{uploading ? 'Uploading...' : '📎 Upload Delivery Challan'}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem', mt: 0.5, textTransform: 'none' }}>(PDF, PNG, JPG allowed)</Typography>
                        <input type="file" hidden accept="image/*,application/pdf" capture="environment"
                          onChange={e => handleUpload(e.target.files[0], 'dc_scan_url')} />
                      </Button>
                    )}
                    {errors.dc_scan_url && <FormHelperText error>{errors.dc_scan_url}</FormHelperText>}
                  </Grid>
                </Grid>
              </Box>
            </Grid>''')

with open('/home/ngadmin/smartcampus2/frontend/src/pages/GateEntry.jsx', 'w') as f:
    f.write(new_content)

print("Updated Box and Caption formatting successfully")
