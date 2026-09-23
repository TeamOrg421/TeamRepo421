using BusinessLogic.Interfaces;
using DataAccess.Data;
using DataAccess.Entities;
using DataAccess.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogic.Services
{
    public class CommentService : ICommentService
    {
        private readonly ApplicationDbContext dbContext;

        public CommentService(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<IList<CommentResponseDto>> GetCarCommentsAsync(Guid carId)
        {
            var listing = await FindListingAsync(carId);
            var listingId = listing?.Id;

            var commentsQuery = dbContext.Comments
                .Include(c => c.User)
                .AsNoTracking();

            List<Comment> comments;
            if (listingId.HasValue)
            {
                comments = await commentsQuery
                    .Where(c => c.ListingId == listingId.Value || (c.Listing != null && c.Listing.CarId == carId))
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();
            }
            else
            {
                comments = await commentsQuery
                    .Where(c => c.Listing != null && c.Listing.CarId == carId)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();
            }

            return comments.Select(c => ToDto(c, c.User, listing)).ToList();
        }

        public async Task<AddCommentResult> AddCommentAsync(Guid carId, Guid userId, string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return AddCommentResult.Fail(AddCommentErrorType.EmptyText, "Comment text cannot be empty.");

            var user = await dbContext.Users.FindAsync(userId);
            if (user == null)
                return AddCommentResult.Fail(AddCommentErrorType.UserNotFound, "User not found.");

            var listing = await FindListingAsync(carId);
            if (listing == null)
            {
                listing = new AuctionLot
                {
                    Id = Guid.NewGuid(),
                    CarId = carId,
                    SellerId = userId,
                    Title = "Listing",
                    Description = "Listing",
                    Status = ListingStatus.Active
                };
                await dbContext.CarListings.AddAsync(listing);
                await dbContext.SaveChangesAsync();
            }

            var comment = new Comment
            {
                Id = Guid.NewGuid(),
                ListingId = listing.Id,
                UserId = userId,
                Text = text.Trim(),
                CreatedAt = DateTime.UtcNow,
                Likes = 0
            };

            await dbContext.Comments.AddAsync(comment);
            await dbContext.SaveChangesAsync();

            return AddCommentResult.Ok(ToDto(comment, user, listing));
        }

        public async Task<int?> LikeCommentAsync(Guid commentId)
        {
            var comment = await dbContext.Comments.FindAsync(commentId);
            if (comment == null)
                return null;

            comment.Likes += 1;
            await dbContext.SaveChangesAsync();

            return comment.Likes;
        }

        private async Task<AuctionLot?> FindListingAsync(Guid carId)
        {
            return await dbContext.CarListings
                .Where(l => l.CarId == carId || l.Id == carId)
                .OrderByDescending(l => l.Status == ListingStatus.Active)
                .ThenByDescending(l => l.AuctionStart)
                .FirstOrDefaultAsync();
        }

        private static CommentResponseDto ToDto(Comment comment, ApplicationUser? user, AuctionLot? listing)
        {
            return new CommentResponseDto
            {
                Id = comment.Id.ToString(),
                UserId = comment.UserId.ToString(),
                User = !string.IsNullOrWhiteSpace(user?.Name) ? user!.Name : (!string.IsNullOrWhiteSpace(user?.UserName) ? user!.UserName : "User"),
                UserAvatar = user?.ProfileImageUrl,
                Text = comment.Text,
                Time = comment.CreatedAt.ToString("o"),
                IsSeller = listing != null && comment.UserId == listing.SellerId,
                Likes = comment.Likes
            };
        }
    }
}