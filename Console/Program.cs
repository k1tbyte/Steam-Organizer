using System;
using SteamAuth;
using Newtonsoft.Json;
using System.IO;
using System.Threading.Tasks;
using System.Net;
using System.Text;
using Microsoft.Win32;
using System.Diagnostics;
using System.Security.Cryptography;

namespace ConsoleProgramm
{
    internal class Program
    {

        private static string CreateSalt(int size)
        {
            RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider();
            byte[] buff = new byte[size];
            rng.GetBytes(buff);
            return Convert.ToBase64String(buff);
        }

        static void Main(string[] args)
        {
            Console.WriteLine(CreateSalt(32));
        }
    }
}
