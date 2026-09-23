using BusinessLogic.Interfaces;
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
    private readonly INotificationsService service;
    public NotificationsController(INotificationsService service) => this.service = service;

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();

        var notifications = await service.GetMine(userId);
        return Ok(notifications);
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        await service.ReadAll(userId);
        return NoContent();
    }

    private bool TryGetUserId(out Guid userId) => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}
