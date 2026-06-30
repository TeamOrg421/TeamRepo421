using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
namespace BusinessLogic.Helpers
{
    public static class IQuerableExtensions
    {
        public static async Task<IQueryable<T>> PaginateAsync<T>(this IQueryable<T> source, int pageNumber, int pageSize)
        {
            var count = await source.CountAsync();
            return source.Skip((pageNumber - 1) * pageSize).Take(pageSize);
        }
    }
}
