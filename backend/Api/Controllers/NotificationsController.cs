using DataAccess.Data;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public NotificationsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var notifications = await _db.Notifications.AsNoTracking()
            .Where(notification => notification.UserId == userId)
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(30)
            .Select(notification => new { notification.Id, notification.Title, notification.Message, notification.IsRead, notification.CreatedAt })
            .ToListAsync();
        return Ok(notifications);
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var unread = await _db.Notifications.Where(notification => notification.UserId == userId && !notification.IsRead).ToListAsync();
        unread.ForEach(notification => notification.IsRead = true);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private bool TryGetUserId(out Guid userId) => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}
