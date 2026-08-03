using FacilityFlow.Core.Entities;
using FacilityFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;
using System.Data;

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

    [HttpGet]
    public async Task<IActionResult> GetIssues()
    {
        var tenantIdClaim = User.Claims.FirstOrDefault(c => c.Type == "tenant_id");
        if (tenantIdClaim == null || !int.TryParse(tenantIdClaim.Value, out var tenantId))
        {
            return Unauthorized("Tenant ID not found in token");
        }

        var issues = new List<object>();

        using (var command = _context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = @"
                SELECT 
                    mi.id, mi.issue_number, mi.created_at, mi.purpose, mi.is_acknowledged, mi.indent_id,
                    ind.indent_number,
                    u.full_name as issued_by_name,
                    mi.issued_to_department, mi.issued_to_contractor, mi.received_by_name,
                    b.name as building_name, f.name as floor_name, r.name as room_name,
                    (SELECT json_agg(json_build_object(
                        'material_name', m.name,
                        'warehouse_name', w.name,
                        'uom_name', uom.abbreviation,
                        'quantity', mii.quantity
                    )) FROM material_issue_items mii 
                       LEFT JOIN materials m ON mii.material_id = m.id
                       LEFT JOIN unit_of_measures uom ON m.uom_id = uom.id
                       LEFT JOIN warehouses w ON mii.warehouse_id = w.id
                       WHERE mii.issue_id = mi.id) as items_json
                FROM material_issues mi
                LEFT JOIN indents ind ON mi.indent_id = ind.id
                LEFT JOIN users u ON mi.issued_by_id = u.id
                LEFT JOIN rooms r ON mi.issued_to_room_id = r.id
                LEFT JOIN floors f ON r.floor_id = f.id
                LEFT JOIN buildings b ON f.building_id = b.id
                WHERE mi.tenant_id = @tenantId
                ORDER BY mi.created_at DESC";

            var param = command.CreateParameter();
            param.ParameterName = "@tenantId";
            param.Value = tenantId;
            command.Parameters.Add(param);

            await _context.Database.OpenConnectionAsync();
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    issues.Add(new {
                        id = reader["id"],
                        issue_number = reader["issue_number"],
                        created_at = reader["created_at"],
                        purpose = reader["purpose"] == DBNull.Value ? null : reader["purpose"],
                        is_acknowledged = reader["is_acknowledged"],
                        indent_id = reader["indent_id"] == DBNull.Value ? null : reader["indent_id"],
                        indent_number = reader["indent_number"] == DBNull.Value ? null : reader["indent_number"],
                        issued_by_name = reader["issued_by_name"] == DBNull.Value ? null : reader["issued_by_name"],
                        issued_to_department = reader["issued_to_department"] == DBNull.Value ? null : reader["issued_to_department"],
                        issued_to_contractor = reader["issued_to_contractor"] == DBNull.Value ? null : reader["issued_to_contractor"],
                        received_by_name = reader["received_by_name"] == DBNull.Value ? null : reader["received_by_name"],
                        building_name = reader["building_name"] == DBNull.Value ? null : reader["building_name"],
                        floor_name = reader["floor_name"] == DBNull.Value ? null : reader["floor_name"],
                        room_name = reader["room_name"] == DBNull.Value ? null : reader["room_name"],
                        items = reader["items_json"] == DBNull.Value ? new object[0] : System.Text.Json.JsonSerializer.Deserialize<object[]>(reader["items_json"].ToString()!)
                    });
                }
            }
        }

        return Ok(issues);
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
