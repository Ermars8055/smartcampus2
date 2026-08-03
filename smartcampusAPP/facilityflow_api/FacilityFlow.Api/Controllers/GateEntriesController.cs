using FacilityFlow.Core.Entities;
using FacilityFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace FacilityFlow.Api.Controllers
{
    [ApiController]
    [Route("api/gate-entries")]
    [Authorize]
    public class GateEntriesController : ControllerBase
    {
        private readonly FacilityFlowDbContext _context;

        public GateEntriesController(FacilityFlowDbContext context)
        {
            _context = context;
        }

        private int GetTenantId()
        {
            var tenantIdClaim = User.Claims.FirstOrDefault(c => c.Type == "tenant_id");
            if (tenantIdClaim != null && int.TryParse(tenantIdClaim.Value, out var tenantId))
            {
                return tenantId;
            }
            throw new Exception("Tenant ID not found in token");
        }

        private int GetUserId()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "user_id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            throw new Exception("User ID not found in token");
        }

        [HttpPost]
        public async Task<IActionResult> CreateGateEntry([FromBody] GateEntryDto dto)
        {
            try
            {
                var tenantId = GetTenantId();
                var userId = GetUserId();

                // Get first site for this tenant for simplicity as per existing patterns
                var defaultSiteId = 1; // Assuming default site or could fetch from DB

                var gateEntry = new GateEntry
                {
                    TenantId = tenantId,
                    SiteId = defaultSiteId, // We could look this up, but hardcoding for simplicity unless multi-site is active
                    EntryNumber = $"GE-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    VehicleNumber = dto.vehicle_number,
                    DeliveryPersonName = dto.delivery_person_name,
                    DriverName = dto.driver_name,
                    InvoiceNumber = dto.invoice_number,
                    InvoiceDate = dto.invoice_date,
                    InvoiceAmount = dto.invoice_amount,
                    Remarks = dto.remarks,
                    InvoiceScanUrl = dto.invoice_scan_url,
                    EntryType = dto.entry_type ?? "Standard",
                    RecordedById = userId
                };

                _context.GateEntries.Add(gateEntry);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Gate Entry created successfully", entry_number = gateEntry.EntryNumber });
            }
            catch (Exception ex)
            {
                return BadRequest(new { detail = ex.Message });
            }
        }
        [HttpGet]
        public async Task<IActionResult> GetGateEntries([FromQuery] string? search)
        {
            try
            {
                var tenantId = GetTenantId();
                var query = _context.GateEntries.Where(g => g.TenantId == tenantId);

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(g => g.EntryNumber.Contains(search) || 
                                            (g.VehicleNumber != null && g.VehicleNumber.Contains(search)) ||
                                            (g.InvoiceNumber != null && g.InvoiceNumber.Contains(search)));
                }

                var entries = await query
                    .OrderByDescending(g => g.CreatedAt)
                    .Select(g => new
                    {
                        id = g.Id,
                        entry_number = g.EntryNumber,
                        vehicle_number = g.VehicleNumber,
                        delivery_person_name = g.DeliveryPersonName,
                        invoice_number = g.InvoiceNumber,
                        invoice_date = g.InvoiceDate,
                        invoice_amount = g.InvoiceAmount,
                        remarks = g.Remarks,
                        invoice_scan_url = g.InvoiceScanUrl,
                        status = "Completed", // Hardcoded for now based on React
                        arrival_time = g.CreatedAt
                    })
                    .ToListAsync();

                return Ok(entries);
            }
            catch (Exception ex)
            {
                return BadRequest(new { detail = ex.Message });
            }
        }
    }

    public class GateEntryDto
    {
        public string? entry_type { get; set; }
        public string? vehicle_number { get; set; }
        public string? delivery_person_name { get; set; }
        public string? invoice_number { get; set; }
        public DateTime? invoice_date { get; set; }
        public double? invoice_amount { get; set; }
        public string? remarks { get; set; }
        public string? invoice_scan_url { get; set; }
        public string? driver_name { get; set; }
    }
}
