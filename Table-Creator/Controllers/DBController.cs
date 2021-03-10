using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Tesseract;



namespace Table_Creator.Controllers
{

    [ApiController]
    [Route("[controller]")]
    public class DBController : Controller
    {
        private Database MySqlDatabase { get; set; }
        public DBController(Database mySqlDatabase)
        {
            this.MySqlDatabase = mySqlDatabase;
        }

        //[HttpPost]
        //public Login
    }

}
