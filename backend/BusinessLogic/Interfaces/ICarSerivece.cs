<<<<<<< HEAD
using DataAccess.Entities;
using System;
=======
<<<<<<< HEAD
﻿using DataAccess.Entities;
using System;
=======
﻿using System;
>>>>>>> origin/main
>>>>>>> origin/main
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BusinessLogic.Interfaces
{
<<<<<<< HEAD
    public interface ICarSerivece
    {
        Task CreateCarAsync(Car lot);
        Task DeleteCarAsync(Guid lotId);
        Task UpdateCarAsync(Car lot);
        Task<Car> GetCarAsync(Guid lotId);
        Task<IList<Car>> GetListCarAsync(int? page, int size = 10);
=======
<<<<<<< HEAD
    public interface ICarSerivece
    {
        Task CreateCarAsync(Car lot);
        Task DeleteCarAsync(Guid lotId);
        Task UpdateCarAsync(Car lot);
        Task<Car> GetCarAsync(Guid lotId);
        Task<IList<Car>> GetListCarAsync(int? page, int size = 10);
=======
    internal class ICarSerivece
    {
>>>>>>> origin/main
>>>>>>> origin/main
    }
}