using System;
using System.IO;

namespace Steam_Account_Manager
{
    internal class DotEnv
    {
        public static void Load(string filePath)
        {
            if (!File.Exists(filePath))
                return;
            foreach (var line in File.ReadAllLines(filePath))
            {
                var parts = line.Split('=');
                if (parts.Length != 2)
                    continue;
                Environment.SetEnvironmentVariable(parts[0], parts[1]);
            }
        }
    }
}
