using BusinessLogic.DTOs;
using BusinessLogic.Interfaces;
using System.Net.Http.Json;
using System.Text.Json;

namespace BusinessLogic.Services
{
    public class BankApiClient : IBankApiClient
    {
        private readonly HttpClient _httpClient;
        public BankApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<BusinessLogic.DTOs.BankCardDto> AddBankCardAsync(BusinessLogic.DTOs.CreateBankCardDto card)
        {
            var request = new Shared.Contracts.CreateBankCardDto
            {
                Name = card.Name,
                CardNumber = card.CardNumber,
                CardHolderName = card.CardHolderName,
                ExpiryDate = card.ExpiryDate,
                Cvv = card.Cvv,
                Balance = 1000000m
            };

            var response = await _httpClient.PostAsJsonAsync("api/payment/add-card", request);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(await ReadErrorAsync(response));

            var createdCard = await response.Content.ReadFromJsonAsync<Shared.Contracts.BankCardDto>()
                ?? throw new Exception("Empty response.");

            return new BusinessLogic.DTOs.BankCardDto
            {
                Id = createdCard.Id,
                MaskedCardNumber = createdCard.MaskedCardNumber,
                CardHolderName = createdCard.CardHolderName,
                ExpiryDate = createdCard.ExpiryDate,
                BillingAddress = string.Empty,
                IsDefault = false,
                BankCardToken = createdCard.BankCardToken
            };
        }

        public async Task<PaymentResponseDto> PayAsync(Shared.Contracts.PaymentRequestDto dto)
        {
            var response = await _httpClient.PostAsJsonAsync("api/payment/pay", dto);

            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(await ReadErrorAsync(response));

            var transaction = await response.Content.ReadFromJsonAsync<Shared.Contracts.PaymentResultDto>()
                ?? throw new Exception("Empty response.");

            return new PaymentResponseDto
            {
                Success = transaction.Status == Shared.Contracts.TransactionStatus.Success,
                Message = transaction.Status == Shared.Contracts.TransactionStatus.Success ? "Payment completed." : "Payment failed.",
                TransactionId = transaction.TransactionId,
                Balance = transaction.Balance,
                CreatedAt = transaction.CreatedAt
            };
        }

        private static async Task<string> ReadErrorAsync(HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrWhiteSpace(content))
                return $"FakeBank request failed with status {(int)response.StatusCode}.";

            try
            {
                var error = JsonSerializer.Deserialize<Dictionary<string, string>>(content);

                if (error != null && error.TryGetValue("error", out var message))
                    return message;
            }
            catch (JsonException)
            {
                // відповідь не JSON
            }

            return content;
        }

        public async Task<decimal> GetBalanceAsync(Guid token)
        {
            var response = await _httpClient.GetAsync($"api/payment/card/{token}/balance");

            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(await ReadErrorAsync(response));

            var balance = await response.Content.ReadFromJsonAsync<CardBalanceDto>()
                ?? throw new Exception("Empty response.");
            return balance.Balance;
        }

        public async Task<decimal> DepositAsync(Guid token, decimal amount)
        {
            var request = new Shared.Contracts.DepositDto
            {
                CardId = token,
                Amount = amount
            };

            var response = await _httpClient.PostAsJsonAsync("api/payment/deposit", request);

            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(await ReadErrorAsync(response));

            return await GetBalanceAsync(token);
        }

        public class CardBalanceDto
        {
            public Guid CardId { get; set; }
            public decimal Balance { get; set; }
        }
    }
}

