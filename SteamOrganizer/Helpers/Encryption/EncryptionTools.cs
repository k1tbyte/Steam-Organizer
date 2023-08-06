using System;
using System.Collections.Generic;
using System.Linq;
using System.Management;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Documents;

namespace SteamOrganizer.Helpers.Encryption
{
    internal static class EncryptionTools
    {
        public static unsafe string ReplacementXorString(byte[] key, string input)
        {
            fixed (char* lpstr = input)
            {
                int j = 0;
                for (var surrogatePair = (byte*)lpstr; j < input.Length * 2; surrogatePair++, j++)
                {
                    *surrogatePair ^= key[j % key.Length];
                }
            }
            return input;
        }

        public static unsafe string XorString(byte[] key, string input)
        {
            byte[] bytes = new byte[input.Length * 2];
            fixed (char* lpstr = input)
            {
                int j = 0;
                for (var surrogatePair = (byte*)lpstr; j < bytes.Length; surrogatePair++, j++)
                {
                    bytes[j] = (byte)(*surrogatePair ^ key[j % key.Length]);
                }
                fixed (byte* xorbytes = bytes)
                {
                    return new string((char*)xorbytes);
                }
            }
        }

        public static string XorString(string input)
            => XorString(App.EncryptionKey, input);


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
