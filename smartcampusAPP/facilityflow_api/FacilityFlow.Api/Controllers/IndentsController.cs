using FacilityFlow.Core.Entities;
using FacilityFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FacilityFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Enforce Firebase Auth
public class IndentsController : ControllerBase
{
    private readonly FacilityFlowDbContext _context;

    public IndentsController(FacilityFlowDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetIndents()
    {
        var indents = await _context.Indents
            .Include(i => i.Items)
                .ThenInclude(i => i.Material)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new {
                id = i.Id,
                indentNumber = i.IndentNumber,
                department = i.Department ?? "",
                location = i.Location ?? "",
                remarks = i.Remarks ?? "",
                status = i.Status,
                date = i.CreatedAt,
                items = i.Items.Select(item => new {
                    material_id = item.MaterialId,
                    materialName = item.Material != null ? item.Material.Name : "Unknown Material",
                    requestedQuantity = item.RequestedQuantity,
                    approvedQuantity = item.ApprovedQuantity ?? 0,
                    issuedQuantity = item.IssuedQuantity,
                    acknowledgedQuantity = item.AcknowledgedQuantity
                }).ToList()
            })
            .ToListAsync();
            
        return Ok(indents);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetIndent(int id)
    {
        var indent = await _context.Indents
            .Include(i => i.Items)
                .ThenInclude(i => i.Material)
            .Where(i => i.Id == id)
            .Select(i => new {
                id = i.Id,
                indentNumber = i.IndentNumber,
                department = i.Department ?? "",
                location = i.Location ?? "",
                remarks = i.Remarks ?? "",
                status = i.Status,
                date = i.CreatedAt,
                items = i.Items.Select(item => new {
                    material_id = item.MaterialId,
                    materialName = item.Material != null ? item.Material.Name : "Unknown Material",
                    requestedQuantity = item.RequestedQuantity,
                    approvedQuantity = item.ApprovedQuantity ?? 0,
                    issuedQuantity = item.IssuedQuantity,
                    acknowledgedQuantity = item.AcknowledgedQuantity
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (indent == null) return NotFound();
        return Ok(indent);
    }

    [HttpPost]
    public async Task<IActionResult> CreateIndent([FromBody] CreateIndentRequest request)
    {
        // Example creation mapping
        var indent = new Indent
        {
            IndentNumber = "IND-" + DateTimeOffset.Now.ToUnixTimeSeconds(), // Mock generator
            TenantId = 1, // Usually from claims
            SiteId = 1,
            Department = request.Department,
            Remarks = request.Remarks,
            RequesterId = 1, // from claims
            Status = "Awaiting Approval"
        };

        foreach (var reqItem in request.Items)
        {
            indent.Items.Add(new IndentItem
            {
                MaterialId = reqItem.MaterialId,
                RequestedQuantity = reqItem.RequestedQuantity
            });
        }

        _context.Indents.Add(indent);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetIndent), new { id = indent.Id }, indent);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveIndent(int id, [FromBody] ApproveIndentRequest request)
    {
        var indent = await _context.Indents.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
        if (indent == null) return NotFound();

        if (indent.Status != "Awaiting Approval")
            return BadRequest("Indent is not awaiting approval");

        if (request != null && request.Items != null)
        {
            foreach (var reqItem in request.Items)
            {
                var item = indent.Items.FirstOrDefault(i => i.MaterialId == reqItem.MaterialId);
                if (item != null)
                {
                    item.ApprovedQuantity = reqItem.ApprovedQuantity;
                }
            }
        }

        indent.Status = "Approved";
        indent.ApprovedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return Ok(new { message = "Fully Approved", status = indent.Status });
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectIndent(int id)
    {
        var indent = await _context.Indents.FindAsync(id);
        if (indent == null) return NotFound();

        indent.Status = "Rejected";
        await _context.SaveChangesAsync();
        return Ok(new { message = "Rejected", status = indent.Status });
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelIndent(int id)
    {
        var indent = await _context.Indents.FindAsync(id);
        if (indent == null) return NotFound();

        indent.Status = "Cancelled";
        await _context.SaveChangesAsync();
        return Ok(new { message = "Cancelled", status = indent.Status });
    }
}

public record CreateIndentRequest(string Department, string Remarks, List<IndentItemRequest> Items);
public record IndentItemRequest(int MaterialId, double RequestedQuantity);
public record ApproveIndentRequest(List<ApproveIndentItemRequest> Items);
public record ApproveIndentItemRequest(int MaterialId, double ApprovedQuantity);
