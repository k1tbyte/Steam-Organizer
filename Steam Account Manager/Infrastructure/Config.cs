using System;
using System.IO;
using System.Collections.Generic;
using System.Windows;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.Cryptography;
using System.Linq;
using System.Globalization;
using System.Threading;
using Steam_Account_Manager.Infrastructure.Base;
using FuzzySharp;

namespace Steam_Account_Manager.Infrastructure
{
    [Serializable]
    internal class Config
    {
        public static Config _config;

        public static string TempUserKey;

        public string SteamDirection;

        public bool NoConfirmMode;
        public bool TakeAccountInfo;
        public bool AutoClose;
        public string WebApiKey;
        public string UserCryptoKey;
        public string Password;

        private Config()
        {

            SupportedThemes = new List<Themes>
            {
                Themes.Dark,
                Themes.Light,
                Themes.Nebula
            };
            SupportedLanguages = new List<CultureInfo>
            {
                new CultureInfo("en-US"),
                new CultureInfo("ru-RU"),
                new CultureInfo("uk-UA")
            };

            NoConfirmMode = TakeAccountInfo = AutoClose = false;
            WebApiKey = "";
            UserCryptoKey = CryptoKey;
            Theme = SupportedThemes[2];
            Language = SupportedLanguages[0];
            try
            {
                SteamDirection = Utilities.GetSteamRegistryDirection();
            }
            catch 
            {
                SteamDirection = "";
            }
            
        }

        #region Themes

        public enum Themes
        {
            Dark = 0,
            Light = 1,
            Nebula = 2
        }

        public List<Themes> SupportedThemes { get; set; }

        private Themes _theme;
        public Themes Theme
        {
            get
            {
                return _theme;
            }
            set
            {
                _theme = value;
                ResourceDictionary dict = new ResourceDictionary();
                switch (value)
                {
                    case Themes.Light:
                        dict.Source = new Uri("Themes/ColorSchemes/Light.xaml", UriKind.Relative);
                        break;
                    case Themes.Dark:
                        dict.Source = new Uri("Themes/ColorSchemes/Dark.xaml", UriKind.Relative);
                        break;
                    case Themes.Nebula:
                        dict.Source = new Uri("Themes/ColorSchemes/Nebula.xaml", UriKind.Relative);
                        break;
                    default:
                        dict.Source = new Uri("Themes/ColorSchemes/Light.xaml", UriKind.Relative);
                        break;
                }
                ResourceDictionary oldDict = (from d in Application.Current.Resources.MergedDictionaries
                                              where d.Source != null && d.Source.OriginalString.StartsWith("Themes/ColorSchemes/")
                                              select d).First();
                if (oldDict != null)
                {
                    int ind = Application.Current.Resources.MergedDictionaries.IndexOf(oldDict);
                    Application.Current.Resources.MergedDictionaries.Remove(oldDict);
                    Application.Current.Resources.MergedDictionaries.Insert(ind, dict);
                }
                else
                {
                    Application.Current.Resources.MergedDictionaries.Add(dict);
                }
            }
        } 

        #endregion


        public enum Languages
        {
            English = 0,
            Russian = 1,
            Ukrainian = 2
        }
        public List<CultureInfo> SupportedLanguages { get; set; }
        private CultureInfo _language;
        public CultureInfo Language
        {
            get => _language; 
            set
            {
                if (value == null) throw new ArgumentNullException(nameof(value));
                if (value == Thread.CurrentThread.CurrentUICulture) return;
                Thread.CurrentThread.CurrentUICulture = value;
                ResourceDictionary dict = new ResourceDictionary();
                switch (value.Name)
                {
                    case "en-US":
                        dict.Source = new Uri($"Locale/lang.{value.Name}.xaml", UriKind.Relative);
                        break;
                    case "ru-RU":
                        dict.Source = new Uri($"Locale/lang.{value.Name}.xaml", UriKind.Relative);
                        break;
                    case "uk-UA":
                        dict.Source = new Uri($"Locale/lang.{value.Name}.xaml", UriKind.Relative);
                        break;
                    default:
                        dict.Source = new Uri("Locale/lang.en-US.xaml", UriKind.Relative);
                        break;
                }
                ResourceDictionary oldDict = (from d in Application.Current.Resources.MergedDictionaries
                                              where d.Source != null && d.Source.OriginalString.StartsWith("Locale/lang.")
                                              select d).First();
                if (oldDict != null)
                {
                    var ind = Application.Current.Resources.MergedDictionaries.IndexOf(oldDict);
                    Application.Current.Resources.MergedDictionaries.Remove(oldDict);
                    Application.Current.Resources.MergedDictionaries.Insert(ind, dict);
                }
                else
                {
                    Application.Current.Resources.MergedDictionaries.Add(dict);
                }

                _language = Thread.CurrentThread.CurrentUICulture;
            }
        }



        public void SaveChanges()
        {
            Serialize(_config, Environment.CurrentDirectory + @"\config.dat",CryptoKey);
        }

        public void Clear()
        {
            _config = new Config();
            SaveChanges();
        }

        public static Config GetInstance()
        {
            if (_config == null)
            {
                if (File.Exists("config.dat"))
                {
                    _config = (Config)Deserialize(Environment.CurrentDirectory + @"\config.dat",CryptoKey);
                    _config.Theme = _config.Theme;
                    _config.Language = _config.Language;
                }
                else _config = new Config();
            }
            return _config;
        }

        //Encrypting
        private static string CryptoKey = "Q3JpcHRvZ3JhZmlhcyBjb20gUmluamRhZWwgLyBBRVM=";
        private const int KeySize = 256;
        private const int IvSize = 16; // block size is 128-bit

        public static string GetDefaultCryptoKey => CryptoKey;

        public static string Sha256(string randomString)
        {
            var crypt = new SHA256Managed();
            string hash = String.Empty;
            byte[] crypto = crypt.ComputeHash(System.Text.Encoding.ASCII.GetBytes(randomString));
            foreach (byte theByte in crypto)
            {
                hash += theByte.ToString("x2");
            }
            return hash;
        }


        public static string GenerateCryptoKey()
        {
            //Generate a cryptographic random number.
            RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider();
            byte[] buff = new byte[32];
            rng.GetBytes(buff);

            // Return a Base64 string representation of the random number.
            return Convert.ToBase64String(buff);
        }

        private static void WriteObjectToStream(Stream outputStream, object obj)
        {
            if (ReferenceEquals(obj, null)) return;
            BinaryFormatter bf = new BinaryFormatter();
            bf.Serialize(outputStream, obj);
        }

        private static object ReadObjectFromStream(Stream inputStream)
        {
            BinaryFormatter binForm = new BinaryFormatter();
            var obj = binForm.Deserialize(inputStream);
            return obj;
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
                throw new ApplicationException("Failed to read IV from stream.");
            }

            Rijndael rijndael = new RijndaelManaged
            {
                KeySize = KeySize
            };

            CryptoStream decryptor = new CryptoStream(
                inputStream,
                rijndael.CreateDecryptor(key, iv),
                CryptoStreamMode.Read);
            return decryptor;
        }

        public static void Serialize(object obj, string path, string CryptoKey)
        {
            byte[] key = Convert.FromBase64String(CryptoKey);

            using (FileStream file = new FileStream(path, FileMode.Create))
            {
                using (CryptoStream cryptoStream = CreateEncryptionStream(key, file))
                {
                    WriteObjectToStream(cryptoStream, obj);
                }
            }
        }
        public static object Deserialize(string path,string CryptoKey)
        {
            byte[] key = Convert.FromBase64String(CryptoKey);

            using (FileStream file = new FileStream(path, FileMode.Open))
            using (CryptoStream cryptoStream = CreateDecryptionStream(key, file))
            {
                return ReadObjectFromStream(cryptoStream);
            }
        }

    }

    [Serializable]
    internal class CryptoBase
    {
        public List<Account> Accounts;
        public static CryptoBase _database;

        public CryptoBase()
        {
            this.Accounts = new List<Account>();
        }

        public static CryptoBase GetInstance()
        {
            if (_database == null)
            {
                if (File.Exists("database.dat"))
                {
                    _database = (CryptoBase)Config.Deserialize(Environment.CurrentDirectory + @"\database.dat", Config._config.UserCryptoKey);
                }
                else _database = new CryptoBase();
            }
            return _database;
        }

        public void SaveDatabase()
        {
            Config.Serialize(_database, Environment.CurrentDirectory + @"\database.dat", Config._config.UserCryptoKey);
        }
        

        public List<int> SearchByNickname(string nickname = "")
        {
            var foundAccountsIndexes = new List<int>();
            if (nickname != "")
            {
                for (int i = 0; i < Accounts.Count; i++)
                {
                    if (Accounts[i].Nickname.ToLower().StartsWith(nickname) ||
                        Fuzz.Ratio(nickname.ToLower(), Accounts[i].Nickname.ToLower()) > 40)
                    {
                        foundAccountsIndexes.Add(i);
                    }
                }
            }
            else
            {
                for (int i = 0; i < Accounts.Count; i++)
                    foundAccountsIndexes.Add(i);
            }
            return foundAccountsIndexes;
        }

    }
}
