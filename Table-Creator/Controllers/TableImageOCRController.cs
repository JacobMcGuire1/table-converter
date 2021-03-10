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
            return null;
        }

        [HttpPost("UploadTable")]
        public TableImageOCR UploadTable([FromForm]IFormCollection form)
        {
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
                var table = ProcessTable(text);

                return new TableImageOCR { Table = table, Error=false };
            }

            
            
        }
        private string[][] ProcessTable(string tablestring)
        {
            var rows = tablestring.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
            var listtable = new List<string[]>();
            foreach (string row in rows)
            {
                if (!string.IsNullOrWhiteSpace(row))
                {
                    var cells = row.Split(new[] { "|", "    " }, StringSplitOptions.RemoveEmptyEntries);
                    cells = cells.Select(x => x.Trim()).ToArray();
                    listtable.Add(cells);
                }
            }
            return listtable.ToArray();
        }
    }
    
}
