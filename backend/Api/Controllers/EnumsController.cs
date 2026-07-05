using DataAccess.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [Route("api/enums")]
    [ApiController]
    public class EnumsController : ControllerBase 
    {
        // тут використовується -> Reflection (Рефлексія)
        // Bid - для доступу в збірку, де знаходяться всі enum
        [HttpGet("allNums")]
        public async Task<ActionResult<List<string>>> GetAllNumsAsync()
        {
            var dataAccessAssembly = typeof(Bid).Assembly;

            var enumNames = dataAccessAssembly.GetTypes()
                .Where(t => t.IsEnum) 
                .Select(t => t.Name)  
                .ToList();

            return Ok(enumNames);
        }
        [HttpGet("enumValues/{enumName}")]
        public async Task<ActionResult<List<string>>> GetEnumValuesAsync(string enumName)
        {
            var dataAccessAssembly = typeof(Bid).Assembly;

            var enumType = dataAccessAssembly.GetTypes()
                .FirstOrDefault(t => t.IsEnum && t.Name.Equals(enumName, StringComparison.OrdinalIgnoreCase));

            if (enumType == null)
            {
                return NotFound($"Enum '{enumName}' not found.");
            }

            var enumValues = Enum.GetNames(enumType).ToList();

            return Ok(enumValues);
        }
    }
}
