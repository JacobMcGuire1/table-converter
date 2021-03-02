using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;




namespace Table_Creator.Controllers
{

    [ApiController]
    [Route("[controller]")]
    public class TableImageOCRController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public TableImageOCR Get()
        {
            return new TableImageOCR { Text = "mytestext" };
        }

        [HttpPost("UploadTable")]
        public TableImageOCR UploadTable([FromForm]IFormCollection form)
        {
            try
            {
                IFormFile file = form.Files[0];
                return new TableImageOCR { Text = "Success" };
            }
            catch(Exception e)
            {
                return new TableImageOCR { Text = "FAILED" };
            }
            
            
        }
    }
}
