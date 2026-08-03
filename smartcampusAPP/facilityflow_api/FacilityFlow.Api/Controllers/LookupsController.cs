using FacilityFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace FacilityFlow.Api.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class LookupsController : ControllerBase
    {
        private readonly FacilityFlowDbContext _context;

        public LookupsController(FacilityFlowDbContext context)
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

        [HttpGet("institutions")]
        public async Task<IActionResult> GetInstitutions()
        {
            try
            {
                var tenantId = GetTenantId();
                var institutions = await _context.Institutions
                    .Where(i => i.TenantId == tenantId)
                    .Select(i => new { id = i.Id, name = i.Name, code = i.Code })
                    .ToListAsync();
                return Ok(institutions);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { detail = ex.Message });
            }
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            try
            {
                var tenantId = GetTenantId();
                var departments = await _context.Departments
                    .Where(d => d.TenantId == tenantId)
                    .Select(d => new { id = d.Id, name = d.Name, institution_id = d.InstitutionId })
                    .ToListAsync();
                return Ok(departments);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { detail = ex.Message });
            }
        }

        [HttpGet("buildings")]
        public async Task<IActionResult> GetBuildings()
        {
            try
            {
                var tenantId = GetTenantId();
                var buildings = await _context.Buildings
                    .Where(b => b.TenantId == tenantId)
                    .Select(b => new { id = b.Id, name = b.Name, institution_id = b.InstitutionId, department_name = b.DepartmentName })
                    .ToListAsync();
                return Ok(buildings);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { detail = ex.Message });
            }
        }

        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms([FromQuery] string department_name)
        {
            try
            {
                var tenantId = GetTenantId();
                
                var query = _context.Rooms
                    .Where(r => r.TenantId == tenantId);
                    
                if (!string.IsNullOrEmpty(department_name))
                {
                    query = query.Where(r => r.DepartmentName == department_name);
                }

                var rooms = await query
                    .Select(r => new { 
                        id = r.Id, 
                        name = r.Name, 
                        floor_id = r.FloorId 
                    })
                    .ToListAsync();
                
                // For a proper response, the frontend expects building_id and building_name inside the room object.
                // We'll join with Floors and Buildings to get this.
                
                var detailedRooms = await (from r in query
                                          join f in _context.Floors on r.FloorId equals f.Id into rf
                                          from f in rf.DefaultIfEmpty()
                                          join b in _context.Buildings on f.BuildingId equals b.Id into fb
                                          from b in fb.DefaultIfEmpty()
                                          select new 
                                          {
                                              id = r.Id,
                                              name = r.Name,
                                              floor_id = r.FloorId,
                                              floor_name = f != null ? f.Name : null,
                                              building_id = f != null ? f.BuildingId : null,
                                              building_name = b != null ? b.Name : null
                                          }).ToListAsync();

                return Ok(detailedRooms);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { detail = ex.Message });
            }
        }
        
        [HttpGet("materials")]
        public async Task<IActionResult> GetMaterials([FromQuery] int limit = 10000)
        {
            try
            {
                var tenantId = GetTenantId();
                var materials = await _context.Materials
                    .Where(m => m.TenantId == tenantId)
                    .Take(limit)
                    .Select(m => new { id = m.Id, name = m.Name })
                    .ToListAsync();
                return Ok(new { items = materials }); // Frontend expects { items: [...] }
            }
            catch (Exception ex)
            {
                return Unauthorized(new { detail = ex.Message });
            }
        }
    }
}
