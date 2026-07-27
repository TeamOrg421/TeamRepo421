using FakeBank.BusinessLogic.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FakeBank.BusinessLogic.Service
{
    public class PaymentService : IPaymentService
    {
        public Task<bool> ProcessPaymentAsync(Guid transactionId, decimal amount)
        {
            throw new NotImplementedException();
        }
    }
}
