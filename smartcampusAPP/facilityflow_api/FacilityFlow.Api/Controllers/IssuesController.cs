using FacilityFlow.Core.Entities;
using FacilityFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FacilityFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IssuesController : ControllerBase
{
    private readonly FacilityFlowDbContext _context;

    public IssuesController(FacilityFlowDbContext context)
    {
        _context = context;
    }

    [HttpPut("{id}/acknowledge")]
    public async Task<IActionResult> AcknowledgeIssue(int id)
    {
        var issue = await _context.MaterialIssues.FindAsync(id);
        if (issue == null) return NotFound();

        if (issue.IsAcknowledged)
            return BadRequest("Already acknowledged");

        issue.IsAcknowledged = true;
        issue.AcknowledgedAt = DateTime.UtcNow;
        issue.AcknowledgedById = 1; // from claims

        await _context.SaveChangesAsync();
        return Ok(new { message = "Issue acknowledged successfully" });
    }
}
