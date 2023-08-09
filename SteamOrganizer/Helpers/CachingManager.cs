    using SteamOrganizer.Infrastructure;
using System;
using System.Collections.Concurrent;
using System.Drawing;
using System.IO;
using System.Web;
using System.Windows;
using System.Windows.Media.Imaging;

namespace SteamOrganizer.Helpers
{
    internal enum EAvatarSize
    {
        small,
        medium,
        full
    }

    internal static class CachingManager
    {
        internal static string ImagesCachePath;
        internal static string GamesCachePath;
        private static readonly ConcurrentDictionary<string,BitmapImage> CachedImages = new ConcurrentDictionary<string,BitmapImage>();

        public static void Init()
        {
            var attributes = FileAttributes.Directory | FileAttributes.Hidden | FileAttributes.NotContentIndexed;

            Utils.CreateDirIfNotExists(App.CacheFolderPath, attributes);
            Utils.CreateDirIfNotExists(ImagesCachePath = Path.Combine(App.CacheFolderPath,"images"), attributes);
            Utils.CreateDirIfNotExists(GamesCachePath = Path.Combine(App.CacheFolderPath, "games"), attributes);

        }

        public static BitmapImage GetCachedAvatar(string avatarHash, int decodeWidth = 0, int decodeHeight = 0, BitmapCacheOption cacheOption = BitmapCacheOption.OnLoad, EAvatarSize size = EAvatarSize.medium)
        {
            var cachedName = $"{avatarHash}_{size}";

            if (CachedImages.ContainsKey(cachedName))
            {
                return CachedImages[cachedName];
            }

            if (avatarHash == null)
            {
                if (!CreateBitmap(out BitmapImage bitmap))
                    return bitmap;

                bitmap.StreamSource = Application.GetResourceStream(new Uri("Resources/Images/default_steam_profile.bmp", UriKind.Relative)).Stream;
                bitmap.EndInit();
                bitmap.Freeze();
                return bitmap;
            }


            var path = $"{ImagesCachePath}\\{cachedName}";

            try
            {
                if (File.Exists(path))
                {
                    if (!CreateBitmap(out BitmapImage bitmap))
                        return bitmap;

                    using (var fstream = new FileStream(path, FileMode.Open, FileAccess.ReadWrite))
                    {
                        bitmap.StreamSource = fstream;
                        bitmap.EndInit();
                        bitmap.Freeze();
                        return bitmap;
                    }
                }

                if(!WebBrowser.IsNetworkAvailable)
                {
                    return GetCachedAvatar(null, decodeWidth, decodeHeight, cacheOption, size);
                }

                return Application.Current.Dispatcher.Invoke(() =>
                {
                    if (!CreateBitmap(out BitmapImage STAbitmap))
                        return STAbitmap;

                    STAbitmap.UriSource = new Uri($"{WebBrowser.SteamAvatarsHost}{cachedName}.jpg");
                    STAbitmap.DownloadCompleted += OnBitmapAvatarLoaded;
                    STAbitmap.EndInit();
                    return STAbitmap;
                });


            }
            catch (Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }

            return null;

            bool CreateBitmap(out BitmapImage image)
            {
                image = new BitmapImage();

                if (!CachedImages.TryAdd(cachedName, image))
                {
                    image = CachedImages[cachedName];
                    return false ;
                }

                image.BeginInit();
                image.DecodePixelWidth  = decodeWidth;
                image.DecodePixelHeight = decodeHeight;
                image.CacheOption       = cacheOption;
                return true;
            }

            void OnBitmapAvatarLoaded(object sender, EventArgs e)
            {
                if (File.Exists(path))
                    return;

                var bitmapSource = sender as BitmapSource;

                if (bitmapSource.CanFreeze)
                    bitmapSource.Freeze();

                using (var fstream = new FileStream(path, FileMode.Create, FileAccess.ReadWrite))
                {
                    var encoder = new BmpBitmapEncoder();
                    encoder.Frames.Add(BitmapFrame.Create(bitmapSource));
                    encoder.Save(fstream);
                }
            }
        }


    }
}
