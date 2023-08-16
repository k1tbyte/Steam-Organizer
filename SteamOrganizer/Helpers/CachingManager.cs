    using SteamOrganizer.Infrastructure;
using System;
using System.Collections.Concurrent;
using System.Drawing;
using System.IO;
using System.Runtime.CompilerServices;
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
        internal static string AvatarsCachePath;
        internal static string GamesCachePath;
        internal static string PreviewsCachePath;
        private static readonly ConcurrentDictionary<string,BitmapImage> CachedImages = new ConcurrentDictionary<string,BitmapImage>();
        private const uint MinSteamAppId = 10u;

        public static void Init()
        {
            var attributes = FileAttributes.Directory | FileAttributes.Hidden | FileAttributes.NotContentIndexed;

            Utils.CreateDirIfNotExists(App.CacheFolderPath, attributes);
            Utils.CreateDirIfNotExists(AvatarsCachePath  = Path.Combine(App.CacheFolderPath,"avatars"), attributes);
            Utils.CreateDirIfNotExists(GamesCachePath    = Path.Combine(App.CacheFolderPath, "games"), attributes);
            Utils.CreateDirIfNotExists(PreviewsCachePath = Path.Combine(App.CacheFolderPath, "preview"), attributes);
        }

        public static BitmapImage GetCachedAvatar(string avatarHash, int decodeWidth = 0, int decodeHeight = 0, EAvatarSize size = EAvatarSize.medium)
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

                return bitmap.FinalizeBuild(Application.GetResourceStream(new Uri("Resources/Images/steam_unknown.bmp", UriKind.Relative)).Stream);
            }


            var path = $"{AvatarsCachePath}\\{cachedName}";

            try
            {
                if (File.Exists(path))
                {
                    if (!CreateBitmap(out BitmapImage bitmap))
                        return bitmap;

                    return bitmap.FinalizeBuild(new FileStream(path, FileMode.Open, FileAccess.ReadWrite));
                }

                if(!WebBrowser.IsNetworkAvailable)
                {
                    return GetCachedAvatar(null, decodeWidth, decodeHeight, size);
                }

                return Application.Current.Dispatcher.Invoke(() =>
                {
                    if (!CreateBitmap(out BitmapImage STAbitmap))
                        return STAbitmap;

                    return STAbitmap.FinalizeBuild(new Uri($"{WebBrowser.SteamAvatarsHost}{cachedName}.jpg"),path);
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

                image.BeginBuild().DecodePixelWidth = decodeWidth;
                image.DecodePixelHeight             = decodeHeight;
                return true;
            }

        }

        private static BitmapImage DefaultGameHeader;

        internal static BitmapImage GetGameHeaderPreview(uint gameId)
        {
            if (gameId < MinSteamAppId || gameId % 10 != 0)
            {
                return DefaultGameHeader ?? (DefaultGameHeader = new BitmapImage().BeginBuild()
                        .FinalizeBuild(Application.GetResourceStream(new Uri("Resources/Images/steam_unknown_horizontal.bmp", UriKind.Relative)).Stream));
            }

            var path = $"{PreviewsCachePath}\\{gameId}";

            if (File.Exists(path))
            {
                return new BitmapImage().BeginBuild().FinalizeBuild(new FileStream(path, FileMode.Open, FileAccess.ReadWrite));
            }

            if (!WebBrowser.IsNetworkAvailable)
                return GetGameHeaderPreview(0u);

            return App.Current.Dispatcher.Invoke(() =>
            {
                var STAbitmap = new BitmapImage().BeginBuild();
                STAbitmap.DecodePixelHeight = 56;
                STAbitmap.DecodePixelWidth = 120;
                return STAbitmap.FinalizeBuild(new Uri($"https://cdn.akamai.steamstatic.com/steam/apps/{gameId}/header.jpg"), path);
            });

        }


        #region Helpers

        /// <summary>
        ///  Default init for any bitmap
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static BitmapImage BeginBuild(this BitmapImage img)
        {
            img.BeginInit();
            img.CacheOption = BitmapCacheOption.OnLoad;
            return img;
        }

        /// <summary>
        /// Init from local cache bitmap with freezing and stream disposing 
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static BitmapImage FinalizeBuild(this BitmapImage img, Stream stream)
        {
            img.StreamSource = stream;
            img.EndInit();
            img.Freeze();
            stream.Dispose();
            return img;
        }

        /// <summary>
        /// Init from web uri and store cache on local disk
        /// </summary>
        /// <param name="path">Stored cache path</param>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static BitmapImage FinalizeBuild(this BitmapImage img, Uri uri, string path)
        {
            img.UriSource = uri;
            img.DownloadCompleted += (sender, e) => OnBitmapAvatarLoaded(sender as BitmapSource, path);
            img.EndInit();
            return img;
        }

        private static void OnBitmapAvatarLoaded(BitmapSource bitmapSource, string path)
        {
            if (File.Exists(path))
                return;

            if (bitmapSource.CanFreeze)
                bitmapSource.Freeze();

            using (var fstream = new FileStream(path, FileMode.Create, FileAccess.ReadWrite))
            {
                var encoder = new BmpBitmapEncoder();
                encoder.Frames.Add(BitmapFrame.Create(bitmapSource));
                encoder.Save(fstream);
            }
        }

        #endregion

    }
}
