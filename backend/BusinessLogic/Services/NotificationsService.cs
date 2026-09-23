using BusinessLogic.Interfaces;
using DataAccess.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Services
{
    public class NotificationsService : INotificationsService
    {
        private readonly ApplicationDbContext _db;
        public NotificationsService(ApplicationDbContext db) => _db = db;

        public async Task<IList<NotificationDto>?> GetMine(Guid userId)
        {
            var notifications = await _db.Notifications.AsNoTracking()
            .Where(notification => notification.UserId == userId)
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(30)
            .Select(notification => new { notification.Id, notification.Title, notification.Message, notification.IsRead, notification.CreatedAt })
            .ToListAsync();

            var result = notifications.Select(notification => new NotificationDto
            {
                Id = notification.Id,
                Title = notification.Title,
                Message = notification.Message,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            }).ToList();
            return result ?? null;
        }
        public class NotificationDto
        {
            public Guid Id { get; set; }
            public string Title { get; set; }
            public string Message { get; set; }
            public bool IsRead { get; set; }
            public DateTime CreatedAt { get; set; }
        }
        public async Task ReadAll(Guid userId)
        {
            var unread = await _db.Notifications.Where(notification => notification.UserId == userId && !notification.IsRead).ToListAsync();
            unread.ForEach(notification => notification.IsRead = true);
            await _db.SaveChangesAsync();

        }
    }
}
