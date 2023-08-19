using Microsoft.Win32;
using SteamOrganizer.Log;
using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using System.Windows;
using System.Windows.Controls.Primitives;
using System.Windows.Media.Imaging;
using System.IO;
using System.Windows.Media;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows.Controls;
using SteamKit2;
using System.Diagnostics;
using System.Windows.Media.Animation;
using System.Management;
using System.Net;
using System.Drawing.Imaging;
using System.Drawing;

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

        public static bool Exists<T>(this ObservableCollection<T> collection, Func<T, bool> match)
        {
            foreach (var item in collection)
            {
                if(match(item))
                {
                    return true;
                }
            }
            return false;
        }

        public static bool Exists<T>(this ObservableCollection<T> collection, Func<T, bool> match, out T element) where T : class
        {
            element = null;

            foreach (var item in collection)
            {
                if(match(item))
                {
                    element = item;
                    return true;
                }
            }
            return false;
        }

        public static bool Exists<T>(this ObservableCollection<T> collection, Func<T,bool> match,out int index)
        {
            index = -1;
            for (int i = 0; i < collection.Count; i++)
            {
                if (match(collection[i]))
                {
                    index = i;
                    return true;
                }
            }
            return false;
        }

        public static string ToReadable(this Version version)
        =>  $"{version}{(version.Revision == 0 ? "" : " Pre-release")}";
        

        public static async void InBackground(Action action, bool longRunning = false)
        {
            action.ThrowIfNull();

            TaskCreationOptions options = TaskCreationOptions.DenyChildAttach;

            if (longRunning)
            {
                options |= TaskCreationOptions.LongRunning | TaskCreationOptions.PreferFairness;
            }

            await Task.Factory.StartNew(action, CancellationToken.None, options, TaskScheduler.Default).ConfigureAwait(false);
        }

        public static void InBackground<T>(Func<T> function, bool longRunning = false)
        {
            function.ThrowIfNull();

            InBackground(new Action(() => function()), longRunning);
        }

        public static async Task<T> InBackgroundAwait<T>(Func<T> action)
        {
            action.ThrowIfNull();

            return await Task.Run(action);
        }

        public static async Task InBackgroundAwait(Action action)
        {
            action.ThrowIfNull();

            await Task.Run(action);
        }

        public static void CreateDirIfNotExists(string path, FileAttributes? attributes = null)
        {
            if (Directory.Exists(path))
                return;

            var dr = Directory.CreateDirectory(path);

            if(attributes != null)
                dr.Attributes = attributes.Value;
        }

        public static void OpenPopup(this Popup popup, FrameworkElement target, PlacementMode placement,bool invertHorizontal = false, bool invertVertical = false)
        {
            popup.PlacementTarget = target;
            popup.Placement = placement;

            if (invertHorizontal)
                popup.HorizontalOffset = -popup.Width + target.ActualWidth;

            if (invertVertical)
                popup.VerticalOffset = -popup.Height + target.ActualHeight;

            popup.IsOpen = true;
        }

        public static BitmapImage GetImageFromUrl(string  url,int pixelHeight = 0, int pixelWidth = 0) 
        {
            var img = new BitmapImage();

            img.BeginInit();
            img.DecodePixelHeight = pixelHeight;
            img.DecodePixelWidth  = pixelWidth;
            img.CacheOption       = BitmapCacheOption.OnLoad;
            img.UriSource         = new Uri(url);
            img.EndInit();
            return img;
        }

        internal static ThicknessAnimation ShakingAnimation(FrameworkElement element,double amplitude = 40d, double repeat = 3d, double timeMs = 0.1d)
        {
            var marginAnim = new ThicknessAnimation(element.Margin,
                new Thickness(element.Margin.Left + amplitude, element.Margin.Top, element.Margin.Right, element.Margin.Bottom), System.TimeSpan.FromSeconds(timeMs))
            {
                RepeatBehavior = new RepeatBehavior(repeat),
                AutoReverse = true,
                EasingFunction = App.Current.FindResource("BaseAnimationFunction") as IEasingFunction
            };

            marginAnim.Freeze();
            return marginAnim;
        }

        public static T FindVisualChild<T>(DependencyObject obj) where T : DependencyObject
        {
            for (int i = 0; i < VisualTreeHelper.GetChildrenCount(obj); i++)
            {
                DependencyObject child = VisualTreeHelper.GetChild(obj, i);

                if (child != null && child is T)
                {
                    return (T)child;
                }

                T childOfChild = FindVisualChild<T>(child);

                if (childOfChild != null)
                {
                    return childOfChild;
                }
            }

            return null;
        }

        public static unsafe string InjectionReplace(this string str, char from, char to)
        {
            fixed (char* lpstr = str)
            {
                for (char* i = lpstr; *i != '\0'; i++)
                {
                    if (*i == from)
                    {
                        *i = to;
                    }
                }
            }
            return str;
        }

        public static object GetUserRegistryValue(string path, string valueName)
        {
            try
            {
                using (var registryKey = Registry.CurrentUser.OpenSubKey(path, false))
                {
                    return registryKey.GetValue(valueName);
                }
            }
            catch (Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }

            return null;
        }

        public static bool SetUserRegistryValue(string path, string valueName, object value, RegistryValueKind kind)
        {
            try
            {
                using (var registryKey = Registry.CurrentUser.OpenSubKey(path, true))
                {
                    registryKey.SetValue(valueName,value, kind);
                }
                return true;
            }
            catch (Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }

            return false;
        }

        public static bool DeleteRegistryValue(string path, string valueName)
        {
            try
            {
                using (var registryKey = Registry.CurrentUser.OpenSubKey(path, true))
                {
                    registryKey.DeleteValue(valueName);
                }
                return true;
            }
            catch (Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }

            return false;
        }

        public static void StartProcess(string path, string args = null)
        {
            using (Process processSteam = new Process())
            {
                processSteam.StartInfo.FileName        = path;
                processSteam.StartInfo.Arguments       = args;
                processSteam.Start();
            };
        }

        public static async Task OpenAutoClosableToolTip(FrameworkElement target, object content, int delay = 1000)
        {
            var toolTip             = App.Current.FindResource("AutoClosableToolTip") as ToolTip;
            toolTip.Content         = content;
            toolTip.PlacementTarget = target;
            toolTip.IsOpen          = true;

            await Task.Delay(delay);

            toolTip.IsOpen = false;
        }

        public static Icon IconFromImage(Bitmap img)
        {
            using (var ms = new MemoryStream())
            {
                using (var bw = new BinaryWriter(ms))
                {
                    // Header
                    bw.Write((short)0);   // 0 : reserved
                    bw.Write((short)1);   // 2 : 1=ico, 2=cur
                    bw.Write((short)1);   // 4 : number of images

                    var w = img.Width;
                    if (w >= 256) w = 0;
                    bw.Write((byte)w);    // 0 : width of image
                    var h = img.Height;
                    if (h >= 256) h = 0;
                    bw.Write((byte)h);    // 1 : height of image
                    bw.Write((byte)0);    // 2 : number of colors in palette
                    bw.Write((byte)0);    // 3 : reserved
                    bw.Write((short)0);   // 4 : number of color planes
                    bw.Write((short)0);   // 6 : bits per pixel
                    var sizeHere = ms.Position;
                    bw.Write(0);          // 8 : image size
                    var start = (int)ms.Position + 4;
                    bw.Write(start);      // 12: offset of image data

                    img.Save(ms, ImageFormat.Png);
                    var imageSize = (int)ms.Position - start;
                    ms.Seek(sizeHere, System.IO.SeekOrigin.Begin);
                    bw.Write(imageSize);
                    ms.Seek(0, System.IO.SeekOrigin.Begin);

                    return new Icon(ms);
                }
            }
        }

        public static DateTime? UnixTimeToDateTime(long unixtime)
        {
            if (unixtime == 0)
                return null;
            DateTime origin = new DateTime(1970, 1, 1, 0, 0, 0);
            return origin.AddSeconds(unixtime);
        }

        public static long GetUnixTime() => (long)DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1)).TotalSeconds;
    }
}
