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

        static string sha256(string randomString)
        {
            var crypt = new SHA256Managed();
            string hash = String.Empty;
            byte[] crypto = crypt.ComputeHash(Encoding.ASCII.GetBytes(randomString));
            foreach (byte theByte in crypto)
            {
                hash += theByte.ToString("x2");
            }
            return hash;
        }

        static void Main(string[] args)
        {
            string test = sha256("pass");
            string pass;
            while (true)
            {
                Console.WriteLine("Enter password:");
                 pass =  Console.ReadLine();
                if (sha256(pass) == test)
                    break;
                else
                    Console.WriteLine("Ivalid password\n");
            }
            Console.WriteLine("nice");
            Console.WriteLine(test);

        }
    }
}
