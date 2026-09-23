using BusinessLogic.DTOs;
using BusinessLogic.Services;

namespace BusinessLogic.Interfaces;

public interface IConversationService
{
    Task<object> GetMineAsync(Guid userId, bool isModerator);

    Task<object?> GetMessagesAsync(Guid listingId, Guid userId, bool isModerator);

    Task<SendConversationResult> SendAsync(Guid listingId, Guid userId, bool isModerator, SendMessageDto dto);
}