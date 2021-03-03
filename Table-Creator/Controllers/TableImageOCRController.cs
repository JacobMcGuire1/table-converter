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
                var engine = new TesseractEngine(@"./tessdata", "eng");

                byte[] streamarray;
                using (var memoryStream = new MemoryStream())
                {
                    file.OpenReadStream().CopyTo(memoryStream);
                    streamarray =  memoryStream.ToArray();
                }

                Pix pix = Pix.LoadFromMemory(streamarray);
                var page = engine.Process(pix);
                var text = page.GetText();
                //page.get
                //should remove lines and stuff

                return new TableImageOCR { Text = text };
            }
            catch(Exception e)
            {
                return new TableImageOCR { Text = "FAILED" };
            }
            
            
        }
    }
}
