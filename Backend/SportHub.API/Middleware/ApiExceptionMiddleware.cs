using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SportHub.API.DTOs;

namespace SportHub.API.Middleware;

public class ApiExceptionMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;

    public ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteErrorResponseAsync(context, HttpStatusCode.NotFound, "Not Found", ex.Message);
        }
        catch (ArgumentException ex)
        {
            await WriteErrorResponseAsync(context, HttpStatusCode.BadRequest, "Bad Request", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteErrorResponseAsync(context, HttpStatusCode.Forbidden, "Forbidden", ex.Message);
        }
        catch (DbUpdateConcurrencyException)
        {
            await WriteErrorResponseAsync(
                context,
                HttpStatusCode.Conflict,
                "Conflict",
                "Selected time slot was modified concurrently. Please refresh and try again.");
        }
        catch (DbUpdateException ex)
        {
            var innerMessage = ex.InnerException?.Message ?? ex.Message;
            var message = innerMessage.Contains("fk_owner", StringComparison.OrdinalIgnoreCase)
                ? "Owner ID không hợp lệ. Hãy dùng ID của tài khoản hiện có."
                : "Dữ liệu lưu không hợp lệ.";

            _logger.LogWarning(ex, "Database update error on {Path}", context.Request.Path);
            await WriteErrorResponseAsync(context, HttpStatusCode.BadRequest, "Bad Request", message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorResponseAsync(
                context,
                HttpStatusCode.InternalServerError,
                "Internal Server Error",
                "Unexpected server error");
        }
    }

    private static async Task WriteErrorResponseAsync(
        HttpContext context,
        HttpStatusCode statusCode,
        string errorTitle,
        string message)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var payload = new ApiErrorResponseDto(
            DateTime.Now,
            (int)statusCode,
            errorTitle,
            message,
            context.Request.Path.Value ?? string.Empty);

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }
}
