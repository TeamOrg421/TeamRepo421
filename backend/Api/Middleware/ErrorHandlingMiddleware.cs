using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Api.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred.");

                context.Response.ContentType = "application/json";

                var statusCode = GetStatusCode(ex);
                context.Response.StatusCode = statusCode;

                await context.Response.WriteAsJsonAsync(new
                {
                    statusCode,
                    message = ex.Message
                });
            }
        }

        private static int GetStatusCode(Exception ex)
        {
            if (ex is KeyNotFoundException)
                return StatusCodes.Status404NotFound;

            if (ex is ArgumentException || ex is InvalidOperationException)
                return StatusCodes.Status400BadRequest;

            if (ex is UnauthorizedAccessException)
                return StatusCodes.Status401Unauthorized;

            var message = ex.Message ?? string.Empty;

            if (message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                || message.Contains("не знайдено", StringComparison.OrdinalIgnoreCase))
                return StatusCodes.Status404NotFound;

            if (message.Contains("invalid", StringComparison.OrdinalIgnoreCase)
                || message.Contains("невірний", StringComparison.OrdinalIgnoreCase)
                || message.Contains("password", StringComparison.OrdinalIgnoreCase))
                return StatusCodes.Status400BadRequest;

            return StatusCodes.Status500InternalServerError;
        }
    }
}
