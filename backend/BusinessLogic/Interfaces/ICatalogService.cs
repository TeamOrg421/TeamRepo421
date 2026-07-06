using DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
    public interface ICatalogService
    {
        // CarBrand
        Task CreateCarBrandAsync(CarBrand brand);
        Task DeleteCarBrandAsync(Guid brandId);
        Task UpdateCarBrandAsync(CarBrand brand);
        Task<CarBrand> GetCarBrandAsync(Guid brandId);
        Task<IList<CarBrand>> GetCarBrandsAsync(int? page, int size = 10);

        // CarModel
        Task CreateCarModelAsync(CarModel model);
        Task DeleteCarModelAsync(Guid modelId);
        Task UpdateCarModelAsync(CarModel model);
        Task<CarModel> GetCarModelAsync(Guid modelId);
        Task<IList<CarModel>> GetCarModelsAsync(int? page, int size = 10);
        Task<IList<CarModel>> GetCarModelsByBrandAsync(Guid brandId, int? page, int size = 10);

        // Catalog
        Task<IList<CarModel>?> GetModelsByBrandSlugAsync(string brandSlug);
        Task<CarModel?> GetModelBySlugAsync(string brandSlug, string modelSlug);
        Task<string> CreateBrandAsync(CarBrand brand);
        Task<int> BrandCount();
        Task<int> ModelCount();
        Task<Dictionary<CarBrand, CarModel>> GetBrandsWithModelsAsync(int? size = 10, int page = 0);
        Task<CarBrand> SearchBrandsAsync(string search);
        Task<CarModel> SearchModelsAsync(string search);
    }
}
