using SteamOrganizer.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace SteamOrganizer.Helpers
{
    internal static class SerializationManager
    {

        private const int KeySize             = 256;
        private const int IvSize              = 16;
            
        internal static bool Serialize(object obj, string filePath, string encryptionKey = null)
        {
            obj.ThrowIfNull();
            filePath.ThrowIfNullOrEmpty();

            string oldFilePath = null;

            try
            {
                // If the file already exists, we must write the data to a separate file
                // so as not to damage the existing one in case of an error.
                if (File.Exists(filePath))
                {
                    oldFilePath = filePath;
                    filePath += ".new";
                }
                    

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    if (string.IsNullOrEmpty(encryptionKey))
                    {
                        WriteObjectToStream(fileStream, obj);
                    }
                    else
                    {
                        using (var cryptoStream = CreateEncryptionStream(encryptionKey, fileStream))
                        {
                            WriteObjectToStream(cryptoStream, obj);
                        }
                    }
                }

                // Everything went well so we can replace the file
                if (oldFilePath != null)
                {
                    File.Move(filePath, oldFilePath);
                }

                return true;

            }
            catch (Exception e)
            {
                //LOG Exception
                return false;
            }
        }

        /// <summary>
        /// Return null if bad decryptionKey
        /// </summary>
        internal static bool? Deserialize<T>(string filePath, out T result, string decryptionKey = null) where T : class
        {
            filePath.ThrowIfNullOrEmpty();

            try
            {
                using (var fileStream = new FileStream(filePath, FileMode.Open))
                {
                    if (string.IsNullOrEmpty(decryptionKey))
                    {
                        result = ReadObjectFromStream(fileStream) as T;
                        return true;
                    }

                    using (var cryptoStream = CreateDecryptionStream(decryptionKey, fileStream))
                    {
                        result =  ReadObjectFromStream(cryptoStream) as T;
                        return true;
                    }
                }
            }
            catch(DecryptionException e)
            {
                //LOG Exception
                return null;
            }
            catch (Exception e)
            {
                //LOG Exception
            }
            finally
            {
                result = default;
            }

            return false;
        }

        private static CryptoStream CreateEncryptionStream(string key, Stream outputStream)
        {
            byte[] keyBytes = Convert.FromBase64String(key);
            byte[] iv = new byte[IvSize];
            using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider()) rng.GetNonZeroBytes(iv);

            outputStream.Write(iv, 0, iv.Length);
            Rijndael rijndael = new RijndaelManaged();
            rijndael.KeySize = KeySize;
            CryptoStream encryptor = new CryptoStream(outputStream, rijndael.CreateEncryptor(keyBytes, iv), CryptoStreamMode.Write);
            return encryptor;
        }

        private static CryptoStream CreateDecryptionStream(string key, Stream inputStream)
        {
            byte[] keyBytes = Convert.FromBase64String(key);
            byte[] iv = new byte[IvSize];

            if (inputStream.Read(iv, 0, iv.Length) != iv.Length)
            {
                throw new DecryptionException("Failed to read IV from stream.");
            }

            Rijndael rijndael = new RijndaelManaged();
            rijndael.KeySize = KeySize;
            CryptoStream decryptor = new CryptoStream(inputStream, rijndael.CreateDecryptor(keyBytes, iv), CryptoStreamMode.Read);
            return decryptor;
        }

        private static void WriteObjectToStream(Stream outputStream, object obj)
        {
            BinaryFormatter formatter = new BinaryFormatter();
            formatter.Serialize(outputStream, obj);
        }

        private static object ReadObjectFromStream(Stream inputStream)
        {
            BinaryFormatter formatter = new BinaryFormatter();
            var obj = formatter.Deserialize(inputStream);
            return obj;
        }


        internal class DecryptionException : Exception
        {
            public DecryptionException(string msg) : base(msg) { }
        }
    }
}
