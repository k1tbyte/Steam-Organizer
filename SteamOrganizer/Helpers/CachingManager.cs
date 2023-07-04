using SteamOrganizer.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;
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
        private static string ImagesCachePath;

        public static void Init()
        {
            var attributes = FileAttributes.Directory | FileAttributes.Hidden | FileAttributes.NotContentIndexed;

            Utils.CreateDirIfNotExists(App.CacheFolderPath, attributes);
            Utils.CreateDirIfNotExists(ImagesCachePath = Path.Combine(App.CacheFolderPath,"images"), attributes);
        }

        public static BitmapImage GetCachedAvatar(string avatarHash,int decodeWidth = 0, int decodeHeight = 0, BitmapCacheOption cacheOption = BitmapCacheOption.OnLoad, EAvatarSize size = EAvatarSize.medium)
        {
            var cachedName = $"{avatarHash}{(size == EAvatarSize.small ? "" : $"_{size}")}";
            var path = $"{ImagesCachePath}\\{cachedName}";

            try
            {
                if (!File.Exists(path))
                {
                    return Application.Current.Dispatcher.Invoke(() =>
                    {
                        var STAbitmap       = CreateBitmap();
                        STAbitmap.UriSource = new Uri($"{WebBrowser.SteamAvatarsHost}{cachedName}.jpg");
                        STAbitmap.DownloadCompleted += OnBitmapAvatarLoaded;
                        STAbitmap.EndInit();
                        return STAbitmap;
                    });
                }

                using (var fstream = new FileStream(path, FileMode.Open, FileAccess.ReadWrite))
                {
                    var bitmap = CreateBitmap();
                    bitmap.StreamSource = fstream;
                    bitmap.EndInit();
                    bitmap.Freeze();
                    return bitmap;
                }

            }
            catch(Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }

            return null;

            BitmapImage CreateBitmap()
            {
                var img               = new BitmapImage();
                img.BeginInit();
                img.DecodePixelWidth  = decodeWidth;
                img.DecodePixelHeight = decodeHeight;
                img.CacheOption       = cacheOption;
                return img;
            }

            void OnBitmapAvatarLoaded(object sender, EventArgs e)
            {
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
