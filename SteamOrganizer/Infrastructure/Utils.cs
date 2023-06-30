using Microsoft.Win32;
using SteamOrganizer.Log;
using System;
using System.Security.Cryptography;
using System.Text;

namespace SteamOrganizer.Infrastructure
{
    internal static class Utils
    {
        internal static void ThrowIfNull(this object obj)
        {
            if(obj == null) 
            {
                throw new ArgumentNullException(nameof(obj));
            }
        }

        internal static void ThrowIfNullOrEmpty(this string str)
        {
            if (string.IsNullOrEmpty(str))
            {
                throw new ArgumentNullException(nameof(str));
            }
        }

        public static byte[] XorData(byte[] key, byte[] input)
        {
            var bytes = new byte[input.Length];
            for (int i = 0; i < input.Length; i++)
            {
                bytes[i] = (byte)(input[i] ^ key[i % key.Length]);
            }

            return bytes;
        }

        public static byte[] HashData(byte[] data)
        {
            using (var crypt = new SHA256Managed())
            {
                return crypt.ComputeHash(data);
            }
        }

        internal static byte[] GetLocalMachineGUID()
        {
            if (!(RegistryKey
                .OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64)?
                .OpenSubKey(@"SOFTWARE\Microsoft\Cryptography")?
                .GetValue("MachineGuid") is string GUID))
            {
                throw new ArgumentNullException(nameof(GUID));
            }

            return HashData(
                XorData(App.EncryptionKey, Encoding.UTF8.GetBytes(GUID.Replace("-", "") + Encoding.UTF8.GetString(App.EncryptionKey))));
        }
    }
}
