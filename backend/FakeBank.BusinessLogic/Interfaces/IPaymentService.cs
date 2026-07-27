using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FakeBank.BusinessLogic.Interfaces
{
    public interface IPaymentService
    {
        Task<bool> ProcessPaymentAsync(Guid transactionId, decimal amount);
    }
}
