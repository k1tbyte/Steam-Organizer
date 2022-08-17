using System;
using SteamAuth;
using Newtonsoft.Json;
using System.IO;
using System.Threading.Tasks;
using System.Net;
using System.Text;
using Microsoft.Win32;
using System.Diagnostics;

namespace ConsoleProgramm
{
    internal class Program
    {

        static void Main(string[] args)
        {
            string password = "Ggg777Ggg777";
            string login = "kurandos";
            UserLogin userLogin = new UserLogin(login, password);
            LoginResult response = LoginResult.BadCredentials;

        }
    }
}
