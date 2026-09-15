using BusinessLogic.Interfaces;
using Shared.Contracts;

namespace Api.Services
{
    public class AuctionPaymentService : IAuctionPaymentService
    {
        private readonly IBankCardService _bankCardService;
        private readonly IBankApiClient _bankApiClient;

        public AuctionPaymentService(
            IBankCardService bankCardService,
            IBankApiClient bankApiClient)
        {
            _bankCardService = bankCardService;
            _bankApiClient = bankApiClient;
        }

        public async Task<bool> ProcessAuctionPaymentAsync(Guid winnerId, Guid sellerId, decimal amount, Guid listingId)
        {
            var winnerToken = await _bankCardService.GetTokenDefoultBankCard(winnerId);
            var sellerToken = await _bankCardService.GetTokenDefoultBankCard(sellerId);

            await _bankApiClient.TransferAsync(new TransferDto
            {
                FromCardId = winnerToken,
                ToCardId = sellerToken,
                Amount = amount,
                Description = $"Auction payment for listing {listingId}"
            });

            return true;
        }
    }
}
