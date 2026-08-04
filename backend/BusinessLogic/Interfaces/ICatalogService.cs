using DataAccess.Entities;
using static BusinessLogic.Services.CatalogService;

namespace BusinessLogic.Interfaces
{
    public interface ICatalogService
    {
        // CarBrand
        Task DeleteCarBrandAsync(Guid brandId);
        Task UpdateCarBrandAsync(CarBrand brand);
        Task<CarBrand> GetCarBrandAsync(Guid brandId);
        Task<IList<CarBrand>> GetCarBrandsAsync(int? page, int? size = null);

        // CarModel
        Task CreateCarModelAsync(CarModel model);
        Task DeleteCarModelAsync(Guid modelId);
        Task UpdateCarModelAsync(CarModel model);
        Task<CarModel> GetCarModelAsync(Guid modelId);
        Task<IList<CarModel>> GetCarModelsAsync(int? page, int? size = null);
        Task<IList<CarModel>> GetCarModelsByBrandAsync(Guid brandId, int? page, int? size = null);

        // Catalog
        Task<IList<CarModel>?> GetModelsByBrandSlugAsync(string brandSlug);
        Task<CarModel?> GetModelBySlugAsync(string brandSlug, string modelSlug);
        Task<CarBrand> CreateBrandAsync(CarBrandDTO brand);
        Task<int> BrandCount();
        Task<int> ModelCount();
        Task<Dictionary<CarBrand, IList<CarModel>>> GetBrandsWithModelsAsync(int? size = null, int? page = null);
        Task<IList<CarBrand>?> SearchBrandsAsync(string search);
        Task<IList<CarModel>?> SearchModelsAsync(string search);
    }
}
