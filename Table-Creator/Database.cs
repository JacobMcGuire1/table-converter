using System;
using MySql.Data.MySqlClient;

namespace Table_Creator
{
    public class Database : IDisposable
    {
        public MySqlConnection Connection;

        public Database(string connectionString)
        {
            Connection = new MySqlConnection(connectionString);
            this.Connection.Open();
        }

        public void Dispose()
        {
            Connection.Close();
        }
    }
}