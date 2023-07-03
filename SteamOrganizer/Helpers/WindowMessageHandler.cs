using SteamOrganizer.Infrastructure;
using System;
using System.Runtime.InteropServices;
using System.Windows.Interop;
using static SteamOrganizer.Infrastructure.Win32;

namespace SteamOrganizer.Helpers
{
    internal static class WindowMessageHandler
    {
        private const int WM_GETMINMAXINFO        = 0x24;
        private const int WM_COPYDATA             = 0x4A;
        private const string TaskbarClassName     = "Shell_TrayWnd";
        private static System.Windows.Window HookedWindow;

        /// <summary>
        /// This handler is called if arguments have been sent to a running process with SendMessage()
        /// </summary>
        internal static event Action<string> ArgumentsHandler;


        private static AppBarData appBarData = new AppBarData
        {
            cbSize = (uint)Marshal.SizeOf(typeof(AppBarData)),
            hWnd = FindWindow(TaskbarClassName, null)
        };

        /// <summary>
        /// Check windows app taskbar status
        /// </summary>
        private static bool IsTaskBarAutoHide
        {
            get
            {
                int state = SHAppBarMessage(AppBarMessage.GetState, ref appBarData).ToInt32();
                return ((AppBarState)state).HasFlag(AppBarState.AutoHide);
            }
        }

        internal static void AddHook(System.Windows.Window window)
        {
            window.ThrowIfNull();

            if (HookedWindow?.Equals(window) == true)
            {
                return;
            }
            else if(HookedWindow != null)
            {
                Unhook();
            }

            IntPtr handle = new WindowInteropHelper(window).Handle;
            HwndSource.FromHwnd(handle).AddHook(WindowProc);

            HookedWindow = window;
        }

        internal static bool Unhook()
        {
            if (HookedWindow == null) 
            {
                return false;
            }

            HwndSource.FromHwnd(new WindowInteropHelper(HookedWindow).Handle).RemoveHook(WindowProc);
            return true;
        }

        private static IntPtr WindowProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            try
            {
                switch (msg)
                {
                    case WM_GETMINMAXINFO:
                        OnMinMaxInfo(hwnd, lParam);
                        handled = true;
                        break;

                    case WM_COPYDATA:
                        OnCopyData(lParam);
                        handled = true;
                        break;

                }
            }
            catch(Exception e)
            {
                handled = false;
                App.Logger.Value.LogHandledException(e);
            }


            return IntPtr.Zero;
        }

        /// <summary>
        /// Sets the correct window size relative to the taskbar
        /// </summary>
        private static void OnMinMaxInfo(IntPtr hwnd, IntPtr lParam)
        {
            MinMaxInfo info = (MinMaxInfo)Marshal.PtrToStructure(lParam, typeof(MinMaxInfo));

            // Adjust the maximized size and position to fit the work area of the correct monitor
            int MONITOR_DEFAULTTONEAREST = 0x00000002;
            IntPtr monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);

            if (monitor != IntPtr.Zero)
            {
                MonitorInfo monitorInfo = new MonitorInfo();
                GetMonitorInfo(monitor, monitorInfo);

                Rect workArea       = monitorInfo.rcWork;
                Rect monitorArea    = monitorInfo.rcMonitor;
                info.MaxPosition.X  = Math.Abs(workArea.Left - monitorArea.Left);
                info.MaxPosition.Y  = Math.Abs(workArea.Top - monitorArea.Top);
                info.MaxSize.X      = Math.Abs(workArea.Right - workArea.Left);
                info.MinTrackSize.X = (int)HookedWindow.MinWidth;
                info.MinTrackSize.Y = (int)HookedWindow.MinHeight;

                // If the taskbar have auto-hide property, we need to indent 1 pixel in order for the user to open taskbar.
                info.MaxSize.Y     = Math.Abs(workArea.Bottom - workArea.Top) - (IsTaskBarAutoHide ? 1 : 0);
            }

            Marshal.StructureToPtr(info, lParam, true);
        }

        /// <summary>
        /// Used to capture arguments if they were passed to the process from a duplicate
        /// </summary>
        private static void OnCopyData(IntPtr lParam) 
        {
            var data = Marshal.PtrToStructure<CopyData>(lParam);
            var param = string.Copy(data.lpData);

            if (string.IsNullOrEmpty(param) || ArgumentsHandler == null)
                return;

            ArgumentsHandler.Invoke(param);
        }

    }
}
