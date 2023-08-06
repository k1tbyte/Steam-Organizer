using System.Management;
using System.Security.Cryptography;
using System.Text;

namespace SteamOrganizer.Helpers.Encryption
{
    internal static class EncryptionTools
    {
        public static unsafe string ReplacementXorString(byte[] key, string input)
        {
            fixed (char* lpstr = input)
            {
                for (var i = 0; i < input.Length; i++)
                {
                    *(lpstr + i) ^= (char)key[i % key.Length];
                }
            }
            return input;
        }

        public static string XorString(byte[] key, string input)
        {
            char[] chars = new char[input.Length];
            for (var i = 0; i < input.Length; i++)
            {
                chars[i] = (char)(input[i] ^ key[i % key.Length]);
            }

            return new string(chars);
        }

        public static string XorString(string input)
            => XorString(App.Config.DatabaseKey, input);


        public static byte[] HashData(byte[] data)
        {
            using (var crypt = new SHA256Managed())
            {
                return crypt.ComputeHash(data);
            }
        }

        internal static byte[] GetLocalMachineHash()
        {
            ManagementObjectCollection mbsList = null;
            ManagementObjectSearcher mos = new ManagementObjectSearcher("Select ProcessorID From Win32_processor");
            mbsList = mos.Get();
            string processorId = string.Empty;
            foreach (ManagementBaseObject mo in mbsList)
            {
                processorId = mo["ProcessorID"] as string;
                break;
            }

            mos = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
            mbsList = mos.Get();
            string systemId = string.Empty;
            foreach (ManagementBaseObject mo in mbsList)
            {
                systemId = mo["UUID"] as string;
                break;
            }

            return HashData(Encoding.ASCII.GetBytes($"{processorId}{systemId}"));
        }
    }
}
