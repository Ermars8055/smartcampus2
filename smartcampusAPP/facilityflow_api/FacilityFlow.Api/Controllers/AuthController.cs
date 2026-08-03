using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FacilityFlow.Core.Entities;
using FacilityFlow.Infrastructure.Data;

namespace FacilityFlow.Api.Controllers;

public class LoginRequest
{
    public string Workspace { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly FacilityFlowDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(FacilityFlowDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // 1. Validate Workspace
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == request.Workspace);
        if (tenant == null)
            return Unauthorized("Invalid workspace.");

        // 2. Validate User
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() && (u.IsDeleted == null || u.IsDeleted == false) && (u.IsActive == null || u.IsActive == true));
        
        if (user == null)
            return Unauthorized("Invalid username or password.");

        // 3. Verify Membership (unless platform admin)
        if (user.IsPlatformAdmin != true)
        {
            var membership = await _context.TenantMemberships.FirstOrDefaultAsync(m => m.UserId == user.Id && m.TenantId == tenant.Id);
            if (membership == null)
                return Unauthorized("User does not have access to this workspace.");
        }

        // 4. Verify Bcrypt Password
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.HashedPassword);

        if (!isPasswordValid)
            return Unauthorized("Invalid username or password.");

        var tokenHandler = new JwtSecurityTokenHandler();
        var secretKey = _config["Jwt:Key"] ?? "nissigrid-production-secret-change-this-now";
        var key = Encoding.UTF8.GetBytes(secretKey);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim("tenant_id", tenant.Id.ToString())
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return Ok(new LoginResponse
        {
            Token = tokenHandler.WriteToken(token),
            Email = user.Email,
            FullName = user.FullName
        });
    }
}
