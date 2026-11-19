using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Middleware;
using SportHub.API.Models;
using SportHub.API.Repositories;
using SportHub.API.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context (SQL Server)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

// Đăng ký SportHubDbContext với SQL Server
builder.Services.AddDbContext<SportHubDbContext>(options =>
    options.UseSqlServer(connectionString));

// 2. JWT Settings & Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
var ephemeralDevJwtKey = false;

if (string.IsNullOrWhiteSpace(jwtSettings.Key) || Encoding.UTF8.GetByteCount(jwtSettings.Key) < 32)
{
    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "Jwt:Key must be configured with at least 32 bytes via User Secrets or Environment Variables.");
    }

    jwtSettings.Key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
    ephemeralDevJwtKey = true;
}

builder.Services.AddSingleton(jwtSettings);

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key));

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var idValue = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var tokenRole = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                if (!long.TryParse(idValue, out var userId) || string.IsNullOrWhiteSpace(tokenRole))
                {
                    context.Fail("Token identity is invalid.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<SportHubDbContext>();
                var user = await db.Users.AsNoTracking()
                    .Where(u => u.Id == userId)
                    .Select(u => new { u.Role, u.IsActive })
                    .FirstOrDefaultAsync(context.HttpContext.RequestAborted);
                if (user is null || !user.IsActive ||
                    !string.Equals(UserRoleExtensions.NormalizeRole(user.Role),
                        UserRoleExtensions.NormalizeRole(tokenRole), StringComparison.OrdinalIgnoreCase))
                {
                    context.Fail("User is inactive or the role in this token is outdated. Please sign in again.");
                }
            }
        };

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

// 3. Dependency Injection: Repositories & Services
builder.Services.AddScoped<IFieldRepository, FieldRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IMatchRepository, MatchRepository>();

builder.Services.AddSingleton<IPasswordHasher, LegacyAwarePasswordHasher>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFieldService, FieldService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<FieldOwnerBookingService>();

// 4. Controllers, JSON Serialization & Unified Validation Error Contract
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new FlexibleTimeOnlyJsonConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .SelectMany(entry =>
                {
                    var fieldName = string.IsNullOrEmpty(entry.Key)
                        ? "request"
                        : char.ToLowerInvariant(entry.Key[0]) + entry.Key[1..];
                    return entry.Value!.Errors.Select(err =>
                        $"{fieldName}: {(string.IsNullOrWhiteSpace(err.ErrorMessage) ? "Invalid value" : err.ErrorMessage)}");
                });

            var errorResponse = new ApiErrorResponseDto(
                DateTime.Now,
                StatusCodes.Status400BadRequest,
                "Bad Request",
                string.Join("; ", errors),
                context.HttpContext.Request.Path.Value ?? string.Empty);

            return new BadRequestObjectResult(errorResponse);
        };
    });

// 5. CORS Policy
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("SportHubCors", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

// 6. Swagger / OpenAPI with JWT Bearer Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SportHub 2.0 API",
        Version = "v1",
        Description = "ASP.NET Core 8 Web API for SportHub - Sports Field Booking & Community Platform"
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter JWT Bearer token: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };

    options.AddSecurityDefinition("Bearer", securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();

if (ephemeralDevJwtKey)
{
    app.Logger.LogWarning(
        "Jwt:Key is not configured in User Secrets. Using an ephemeral key for this Development session. " +
        "Run: dotnet user-secrets set \"Jwt:Key\" \"<at-least-32-char-secret>\"");
}

// Initialize Database & Optional Development Seed Data
if (app.Environment.IsDevelopment())
{
    await DbInitializer.InitializeAsync(app.Services, app.Configuration, app.Logger);
}

app.UseMiddleware<ApiExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors("SportHubCors");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "UP",
    service = "SportHub.API",
    timestamp = DateTime.Now
})).AllowAnonymous();

app.MapControllers();

app.Run();
