using FacilityFlow.Core.Entities;
using FacilityFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FacilityFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ComplaintsController : ControllerBase
{
    private readonly FacilityFlowDbContext _context;

    public ComplaintsController(FacilityFlowDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetComplaints()
    {
        var complaints = await _context.Complaints
            .Include(c => c.Images)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new {
                id = c.Id,
                docketNo = c.DocketNo,
                complaintDate = c.ComplaintDate,
                location = c.Location ?? "",
                natureOfComplaint = c.NatureOfComplaint ?? "",
                individualDetailed = c.IndividualDetailed ?? "",
                status = c.Status,
                materialRequired = c.MaterialRequired,
                resolutionRemarks = c.ResolutionRemarks ?? "",
                images = c.Images.Select(img => img.ImageUrl).ToList()
            })
            .ToListAsync();
        return Ok(complaints);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetComplaint(int id)
    {
        var complaint = await _context.Complaints
            .Include(c => c.Images)
            .Where(c => c.Id == id)
            .Select(c => new {
                id = c.Id,
                docketNo = c.DocketNo,
                complaintDate = c.ComplaintDate,
                location = c.Location ?? "",
                natureOfComplaint = c.NatureOfComplaint ?? "",
                individualDetailed = c.IndividualDetailed ?? "",
                status = c.Status,
                materialRequired = c.MaterialRequired,
                resolutionRemarks = c.ResolutionRemarks ?? "",
                images = c.Images.Select(img => img.ImageUrl).ToList()
            })
            .FirstOrDefaultAsync();
            
        if (complaint == null) return NotFound();
        return Ok(complaint);
    }

    [HttpPost]
    public async Task<IActionResult> CreateComplaint([FromBody] CreateComplaintRequest request)
    {
        var complaint = new Complaint
        {
            DocketNo = "CMP-" + DateTimeOffset.Now.ToUnixTimeSeconds(),
            TenantId = 1,
            SiteId = 1,
            ComplaintDate = DateTime.UtcNow,
            DepartmentName = request.DepartmentName,
            Location = request.Location,
            NatureOfComplaint = request.NatureOfComplaint,
            CreatedById = 1, // From claims
            Status = "Registered"
        };

        if (request.ImageUrls != null)
        {
            foreach (var url in request.ImageUrls)
            {
                complaint.Images.Add(new ComplaintImage { ImageUrl = url, IsResolutionImage = false });
            }
        }

        _context.Complaints.Add(complaint);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetComplaint), new { id = complaint.Id }, complaint);
    }

    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> ResolveComplaint(int id, [FromBody] ResolveComplaintRequest request)
    {
        var complaint = await _context.Complaints.FindAsync(id);
        if (complaint == null) return NotFound();

        complaint.Status = "Closed";
        complaint.ResolutionRemarks = request.ResolutionRemarks;
        
        if (request.ResolutionImageUrls != null)
        {
            foreach (var url in request.ResolutionImageUrls)
            {
                _context.ComplaintImages.Add(new ComplaintImage { ComplaintId = id, ImageUrl = url, IsResolutionImage = true });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Resolved successfully", status = complaint.Status });
    }
}

public record CreateComplaintRequest(string DepartmentName, string Location, string NatureOfComplaint, List<string> ImageUrls);
public record ResolveComplaintRequest(string ResolutionRemarks, List<string> ResolutionImageUrls);
