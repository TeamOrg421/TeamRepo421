<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> e347eaf (.)
﻿using Azure;
using BusinessLogic.Interfaces;
using DataAccess.Entities;
using DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System;
<<<<<<< HEAD
=======
﻿using System;
>>>>>>> 94383dc (ICatalogService)
=======
>>>>>>> e347eaf (.)
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogic.Services
{
<<<<<<< HEAD
<<<<<<< HEAD
    public class CatalogService : ICatalogService
    {
        private readonly IRepository<CarBrand> carBrandRepository;
        private readonly IRepository<CarModel> carModelRepository;

        public CatalogService(
            IRepository<CarBrand> carBrandRepository,
            IRepository<CarModel> carModelRepository)
        {
            this.carBrandRepository = carBrandRepository;
            this.carModelRepository = carModelRepository;
        }

        // ============= CRUD for CarBrand ===============
        public async Task<CarBrand> CreateBrandAsync(CarBrand brand)
        {
            brand.Slug = brand.Name.ToLower().Replace(" ", "-");
            await carBrandRepository.AddAsync(brand);

            return brand;
        }
        public async Task DeleteCarBrandAsync(Guid brandId)
        {
            var brand = await carBrandRepository.GetByIdAsync(brandId);

            if (brand == null)
                throw new Exception("Car brand not found");

            await carBrandRepository.DeleteAsync(brand);
        }
        public async Task UpdateCarBrandAsync(CarBrand brand)
        {
            var existingBrand = await carBrandRepository.GetByIdAsync(brand.Id);

            if (existingBrand == null)
                throw new Exception("Car brand not found");

            await carBrandRepository.UpdateAsync(brand);
        }
        public async Task<CarBrand> GetCarBrandAsync(Guid brandId)
        {
            var brand = await carBrandRepository.GetByIdAsync(brandId);

            if (brand == null)
                throw new Exception("Car brand not found");

            return brand;
        }
        public async Task<IList<CarBrand>> GetCarBrandsAsync(int? page, int size = 10)
        {
            var brands = await carBrandRepository.GetAllAsync(page, size);
            return brands.ToList();
        }
        // ============= CRUD for CarModel ===============
        public async Task CreateCarModelAsync(CarModel model)
        {
            model.Slug = model.Name
                .ToLower()
                .Replace(" ", "-");
            await carModelRepository.AddAsync(model);
        }
        public async Task DeleteCarModelAsync(Guid modelId)
        {
            var model = await carModelRepository.GetByIdAsync(modelId);

            if (model == null)
                throw new Exception("Car model not found");

            await carModelRepository.DeleteAsync(model);
        }
        public async Task UpdateCarModelAsync(CarModel model)
        {
            var existingModel = await carModelRepository.GetByIdAsync(model.Id);

            if (existingModel == null)
                throw new Exception("Car model not found");

            await carModelRepository.UpdateAsync(model);
        }
        public async Task<CarModel> GetCarModelAsync(Guid modelId)
        {
            var model = await carModelRepository.GetByIdAsync(modelId);

            if (model == null)
                throw new Exception("Car model not found");

            return model;
        }
        public async Task<IList<CarModel>> GetCarModelsAsync(int? page, int size = 10)
        {
            var models = await carModelRepository.GetAllAsync(page, size);
            return models.ToList();
        }
        // ==================================================

        public async Task<IList<CarModel>> GetCarModelsByBrandAsync(Guid brandId, int? page, int size = 10)
        {
            var models = await carModelRepository.GetAllAsync(page, size);
            return models.Where(m => m.BrandId == brandId).ToList();
        }

        public async Task<IList<CarModel>?> GetModelsByBrandSlugAsync(string brandSlug)
        {
            return await carModelRepository.FindAllAsync(
                m => m.Brand.Slug.ToLower() == brandSlug.ToLower());
        }

        public async Task<CarModel?> GetModelBySlugAsync(string brandSlug, string modelSlug)
        {
            var model = await carModelRepository.FindAsync(m => m.Brand.Slug == brandSlug && m.Slug == modelSlug);
            if (model == null) throw new Exception("Car model not found");

            return model;
        }

        public async Task<int> BrandCount()
        {
            return await carBrandRepository.Count();
        }
        public async Task<int> ModelCount()
        {
            return await carModelRepository.Count();
        }
        public async Task<Dictionary<CarBrand, IList<CarModel>>> GetBrandsWithModelsAsync(int? size = 10, int page = 0)
        {
            var brands = await carBrandRepository.GetAllAsync(page, size.Value);
            Dictionary<CarBrand, IList <CarModel>> dict = new Dictionary<CarBrand, IList<CarModel>>();

            foreach (var brand in brands)
            {
                var models = await carModelRepository.FindAllAsync(m => m.BrandId == brand.Id);
                dict.Add(brand, models.ToList());
            }
            return dict;
        }
        public async Task<IList<CarBrand>?> SearchBrandsAsync(string search)
        {
            return await carBrandRepository.FindAllAsync(m =>
                            m.Name.ToLower().Contains(search.ToLower()));

        }
        public async Task<IList<CarModel>?> SearchModelsAsync(string search)
        {
            return await carModelRepository.FindAllAsync(m =>
                            m.Name.ToLower().Contains(search.ToLower()));

        }
=======
    internal class CatalogService
    {
>>>>>>> 94383dc (ICatalogService)
=======
    public class CatalogService : ICatalogService
    {
        private readonly IRepository<Car> carRepository;
        private readonly IRepository<CarBrand> carBrandRepository;
        private readonly IRepository<CarModel> carModelRepository;

        public CatalogService(
            IRepository<Car> carRepository,
            IRepository<CarBrand> carBrandRepository,
            IRepository<CarModel> carModelRepository)
        {
            this.carRepository = carRepository;
            this.carBrandRepository = carBrandRepository;
            this.carModelRepository = carModelRepository;
        }

        // ============= CRUD for CarBrand ===============
        public async Task CreateCarBrandAsync(CarBrand brand)
        {
            await carBrandRepository.AddAsync(brand);
        }
        public async Task DeleteCarBrandAsync(Guid brandId)
        {
            var brand = await carBrandRepository.GetByIdAsync(brandId);

            if (brand == null)
                throw new Exception("Car brand not found");

            await carBrandRepository.DeleteAsync(brand);
        }
        public async Task UpdateCarBrandAsync(CarBrand brand)
        {
            var existingBrand = await carBrandRepository.GetByIdAsync(brand.Id);

            if (existingBrand == null)
                throw new Exception("Car brand not found");

            await carBrandRepository.UpdateAsync(brand);
        }
        public async Task<CarBrand> GetCarBrandAsync(Guid brandId)
        {
            var brand = await carBrandRepository.GetByIdAsync(brandId);

            if (brand == null)
                throw new Exception("Car brand not found");

            return brand;
        }
        public async Task<IList<CarBrand>> GetCarBrandsAsync(int? page, int size = 10)
        {
            var brands = await carBrandRepository.GetAllAsync(page, size);
            return brands.ToList();
        }
        // ============= CRUD for CarModel ===============
        public async Task CreateCarModelAsync(CarModel model)
        {
            await carModelRepository.AddAsync(model);
        }
        public async Task DeleteCarModelAsync(Guid modelId)
        {
            var model = await carModelRepository.GetByIdAsync(modelId);

            if (model == null)
                throw new Exception("Car model not found");

            await carModelRepository.DeleteAsync(model);
        }
        public async Task UpdateCarModelAsync(CarModel model)
        {
            var existingModel = await carModelRepository.GetByIdAsync(model.Id);

            if (existingModel == null)
                throw new Exception("Car model not found");

            await carModelRepository.UpdateAsync(model);
        }
        public async Task<CarModel> GetCarModelAsync(Guid modelId)
        {
            var model = await carModelRepository.GetByIdAsync(modelId);

            if (model == null)
                throw new Exception("Car model not found");

            return model;
        }
        public async Task<IList<CarModel>> GetCarModelsAsync(int? page, int size = 10)
        {
            var models = await carModelRepository.GetAllAsync(page, size);
            return models.ToList();
        }
        // ==================================================

        public async Task<IList<CarModel>> GetCarModelsByBrandAsync(Guid brandId, int? page, int size = 10)
        {
            var models = await carModelRepository.GetAllAsync(page, size);
            return models.Where(m => m.BrandId == brandId).ToList();
        }

        public async Task<IList<CarModel>?> GetModelsByBrandSlugAsync(string brandSlug)
        {
            return await carModelRepository.FindAllAsync(
                m => m.Brand.Slug.ToLower() == brandSlug.ToLower());
        }

        public async Task<CarModel?> GetModelBySlugAsync(string brandSlug, string modelSlug)
        {
            var model = await carModelRepository.FindAsync(m => m.Brand.Slug == brandSlug && m.Slug == modelSlug);
            if (model == null) throw new Exception("Car model not found");

            return model;
        }
        public async Task<string> CreateBrandAsync(CarBrand brand)
        {
            brand.Slug = brand.Name.ToLower().Replace(" ", "-");
            await carBrandRepository.AddAsync(brand);

            return brand.Slug;
        }
        public async Task<int> BrandCount()
        {
            return await carBrandRepository.Count();
        }
        public async Task<int> ModelCount()
        {
            return await carModelRepository.Count();
        }
        public async Task<Dictionary<CarBrand, CarModel>> GetBrandsWithModelsAsync(int? size = 10, int page = 0)
        {
            var brands = await carBrandRepository.GetAllAsync(page, size.Value);
            Dictionary<CarBrand, CarModel> dict = new Dictionary<CarBrand, CarModel>();
            foreach (var brand in brands)
            {
                var models = await carModelRepository.FindAllAsync(m => m.BrandId == brand.Id);
                foreach (var model in models)
                {
                    dict.Add(brand, model);
                }
            }
            return dict;
        }
        public async Task<CarBrand> SearchBrandsAsync(string search)
        {
            var brand = await carBrandRepository.FindAsync(b => b.Name.ToLower() == search.ToLower());

            if (brand == null)
                throw new Exception("Car brand not found");
            return brand;
        }
        public async Task<CarModel> SearchModelsAsync(string search)
        {
            var model = await carModelRepository.FindAsync(b => b.Name.ToLower() == search.ToLower());

            if (model == null)
                throw new Exception("Car brand not found");
            return model;
        }
>>>>>>> e347eaf (.)
    }
}
