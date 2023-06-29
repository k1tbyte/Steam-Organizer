using SteamOrganizer.Infrastructure;
using System;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.Cryptography;

namespace SteamOrganizer.Helpers
{
    internal static class SerializationManager
    {

        private const int KeySize             = 256;
        private const int IvSize              = 16;
            
        internal static bool Serialize(object obj, string filePath, byte[] encryptionKey = null)
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
                    if (encryptionKey == null)
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
                    Win32.MoveFile(filePath,oldFilePath,true);
                }

                return true;

            }
            catch (Exception e)
            {
                //LOG Exception
                return false;
            }
        }

        internal static bool Deserialize<T>(string filePath, out T result, byte[] decryptionKey = null) where T : class
        {
            filePath.ThrowIfNullOrEmpty();

            try
            {
                using (var fileStream = new FileStream(filePath, FileMode.Open))
                {
                    if (decryptionKey == null)
                    {
                        result = ReadObjectFromStream(fileStream) as T;
                    }
                    else
                    {
                        using (var cryptoStream = CreateDecryptionStream(decryptionKey, fileStream))
                        {
                            result = ReadObjectFromStream(cryptoStream) as T;
                        }
                    }

                    return true;
                }
            }
            catch(SerializationException e)
            {
                //LOG Exception
            }
            catch (Exception e)
            {
                //LOG Exception
            }

            result = null;
            return false;
        }

        private static CryptoStream CreateEncryptionStream(byte[] key, Stream outputStream)
        {
            byte[] iv = new byte[IvSize];
            using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider()) rng.GetNonZeroBytes(iv);

            outputStream.Write(iv, 0, iv.Length);
            Rijndael rijndael = new RijndaelManaged();
            rijndael.KeySize = KeySize;
            CryptoStream encryptor = new CryptoStream(outputStream, rijndael.CreateEncryptor(key, iv), CryptoStreamMode.Write);
            return encryptor;
        }

        private static CryptoStream CreateDecryptionStream(byte[] key, Stream inputStream)
        {
            byte[] iv = new byte[IvSize];

            if (inputStream.Read(iv, 0, iv.Length) != iv.Length)
            {
                throw new SerializationException("Failed to read IV from stream.");
            }

            Rijndael rijndael = new RijndaelManaged();
            rijndael.KeySize = KeySize;
            CryptoStream decryptor = new CryptoStream(inputStream, rijndael.CreateDecryptor(key, iv), CryptoStreamMode.Read);
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



    }
}
