using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Tesseract;
using Microsoft.Data.Sqlite;
using Newtonsoft.Json;



namespace Table_Creator.Controllers
{

    [ApiController]
    [Route("[controller]")]
    public class DBController : Controller
    {
        private SqliteConnection Connect()
        {
            SqliteConnection conn = new SqliteConnection("Data Source=MyTableDB.db");
            conn.Open();
            return conn;
        }


        [HttpPost("InsertTable")]
        public bool InsertTable([FromForm] IFormCollection form)//(string name, string password, string tablejson, string tablename)
        {
            var name = form["username"].ToString();
            var password = form["password"].ToString();
            var tablejson = form["tablejson"].ToString();
            var tablename = form["tablename"].ToString();

            var conn = Connect();

            var userid = authenticate(name, password);

            if (userid == "") return false;
            //need to delete old table.
            var command2 = conn.CreateCommand();
            command2.CommandText =
                "insert into tables " +
                "values(null, $userid, $tablename, $tablejson)";
            command2.Parameters.AddWithValue("$userid", userid);
            command2.Parameters.AddWithValue("$tablename", tablename);
            command2.Parameters.AddWithValue("$tablejson", tablejson);

            var result = command2.ExecuteNonQuery();
            conn.Close();
            if (result == 0) return false;
            return true;
        }

        [HttpPost("GetMyTables")]
        public string GetMyTables([FromForm] IFormCollection form)//(string name, string password, string tablejson, string tablename)
        {
            /*var te = form.Keys.ToList();
            var name = te[0];
            var password = te[1];*/

            var name = form["username"].ToString();
            var password = form["password"].ToString();

            var conn = Connect();

            var userid = authenticate(name, password);

            if (userid == "") return null;
            //need to delete old table.
            string output = JsonConvert.SerializeObject(getTables(userid));
            return output;
            

        }

        [HttpPost("GetTable")]
        public string GetTable([FromForm] IFormCollection form)
        {
            /*var te = form.Keys.ToList();
            var name = te[0];
            var password = te[1];
            var tableid = te[2];*/

            var name = form["username"].ToString();
            var password = form["password"].ToString();
            var tableid = form["tableid"].ToString();

            var userid = authenticate(name, password);
            if (userid == "") return null;

            var conn = Connect();

            var command = conn.CreateCommand();
            command.CommandText =
                "select tablejson from tables " +
                "where tableid = $tableid and userid = $userid";
            command.Parameters.AddWithValue("$tableid", tableid);
            command.Parameters.AddWithValue("$userid", userid);
            var tablejson = "";
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    tablejson = reader.GetString(0);
                }
                reader.Close();
            }
            conn.Close();

            return tablejson;


        }

        [HttpPost("DeleteTable")]
        public bool deleteTable([FromForm] IFormCollection form)
        {
            var username = form["username"].ToString();
            var password = form["password"].ToString();
            var tableid = form["tableid"].ToString();

            var userid = authenticate(username, password);

            var conn = Connect();
            var command2 = conn.CreateCommand();
            command2.CommandText =
                "delete from tables " +
                "where userid = $userid and tableid = $tableid";
            command2.Parameters.AddWithValue("$userid", userid);
            command2.Parameters.AddWithValue("$tableid", tableid);

            var r = command2.ExecuteNonQuery();
            conn.Close();
            if (r == 0) return false;
            return true;
        }

        private List<(string, string)> getTables(string userid)
        {
            var conn = Connect();
            var command2 = conn.CreateCommand();
            command2.CommandText =
                "select tableid, tablename from tables " +
                "where userid = $userid";
            command2.Parameters.AddWithValue("$userid", userid);

            List<(string, string)> tables = new List<(string, string)>();
            using (var r = command2.ExecuteReader())
            {
                while (r.Read())
                {
                    var tableid = r.GetString(0);
                    var tablename = r.GetString(1);
                    tables.Add((tableid, tablename));
                }
                r.Close();
            }
            conn.Close();

            return tables;
        }

        


        //Returns the corresponding userid or creates an account if the username doesn't exist, then returns the newly created userid.
        //Returns empty string if the details are wrong.
        private string authenticate(string name, string password)
        {
            var conn = Connect();

            var command = conn.CreateCommand();
            command.CommandText =
                "select userid from users " +
                "where username = $username and password = $password";
            command.Parameters.AddWithValue("$username", name);
            command.Parameters.AddWithValue("$password", password);

            var userid = "";

            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    userid = reader.GetString(0);
                }
                reader.Close();
            }

            if (userid != "") return userid;

            var c2 = conn.CreateCommand();
            c2.CommandText =
                "select userid from users " +
                "where username = $username";
            c2.Parameters.AddWithValue("$username", name);

            var existance = "";

            using (var reader = c2.ExecuteReader())
            {
                while (reader.Read())
                {
                    existance = reader.GetString(0);
                }
                reader.Close();
            }

            if (existance == "")
            {
                var command2 = conn.CreateCommand();
                command2.CommandText =
                    "insert into users " +
                    "values(null, $name, $password)";
                command2.Parameters.AddWithValue("$name", name);
                command2.Parameters.AddWithValue("$password", password);
                command2.ExecuteNonQuery();

                var c3 = conn.CreateCommand();
                c3.CommandText =
                    "select userid from users where username = $name and password = $password";
                c3.Parameters.AddWithValue("$name", name);
                c3.Parameters.AddWithValue("$password", password);

                using (var reader = c3.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        userid = reader.GetString(0);
                    }
                    reader.Close();
                }
                return userid;
            }

            return "";
            
        }
    }

    
}
