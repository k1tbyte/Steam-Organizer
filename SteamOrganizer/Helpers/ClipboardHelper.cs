using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace SteamOrganizer.Helpers
{
    internal static class ClipboardHelper
    {
        [DllImport("user32.dll")]
        private static extern bool OpenClipboard(IntPtr hWndNewOwner);

        [DllImport("user32.dll")]
        private static extern bool CloseClipboard();

        [DllImport("user32.dll")]
        private static extern bool SetClipboardData(uint uFormat, IntPtr data);
        private const uint CF_UNICODETEXT = 13;

        private static readonly SemaphoreSlim ClipboardLocker = new SemaphoreSlim(1);

        /// <param name="text"></param>
        /// <param name="copiedFrom">If not null will show a popup notification over the FrameworkElement that the data is copied</param>
        /// <returns></returns>
        public static async Task<bool> SetText(string text, FrameworkElement copiedFrom = null)
        {
            var global = Marshal.StringToHGlobalUni(text);
            for (int i = 0; i < 5; i++)
            {
                if (OpenClipboard(IntPtr.Zero) && SetClipboardData(CF_UNICODETEXT, global) && CloseClipboard())
                {
                    if(copiedFrom != null)
                    {
                        await ClipboardLocker.WaitAsync(1000);
                        var toolTip             = App.Current.FindResource("CopiedToTooltip") as ToolTip;
                        toolTip.PlacementTarget = copiedFrom;
                        toolTip.IsOpen          = true;

                        await Task.Delay(1000);

                        toolTip.IsOpen          = false;
                        ClipboardLocker.Release();
                    }
                    
                    return true;
                }
                    
                await Task.Delay(50);

            }
            return false;
        }
    }
}
