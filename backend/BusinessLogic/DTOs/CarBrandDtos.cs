using System;
using System.Collections.Generic;

namespace BusinessLogic.DTOs
{
    public class CreateCarBrandDto
    {
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
    }

    public class UpdateCarBrandDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
    }

    public class CarBrandDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public int ModelsCount { get; set; }
    }

    public class BrandWithModelsDto
    {
        public CarBrandDto Brand { get; set; } = null!;
        public List<CarModelDto> Models { get; set; } = new();
    }
}
