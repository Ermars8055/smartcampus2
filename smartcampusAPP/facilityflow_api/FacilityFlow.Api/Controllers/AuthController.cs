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
    public string Email { get; set; } = string.Empty;
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
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && (u.IsDeleted == null || u.IsDeleted == false));

        if (user == null)
            return Unauthorized("Invalid email or password.");

        // Verify Bcrypt Password
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.HashedPassword);

        if (!isPasswordValid)
            return Unauthorized("Invalid email or password.");

        var tokenHandler = new JwtSecurityTokenHandler();
        // Fallback to a hardcoded string if configuration is missing, just for migration safety
        var secretKey = _config["Jwt:Key"] ?? "nissigrid-production-secret-change-this-now";
        var key = Encoding.UTF8.GetBytes(secretKey);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName)
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
