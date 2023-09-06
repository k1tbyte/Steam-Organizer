using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;

namespace SteamOrganizer.Infrastructure
{
    internal static class Win32
    {

        #region Imports

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetCursorPos(ref Point pt);

        [DllImport("user32")]
        internal static extern bool GetMonitorInfo(IntPtr hMonitor, MonitorInfo lpmi);

        [DllImport("User32")]
        internal static extern IntPtr MonitorFromWindow(IntPtr handle, int flags);

        [DllImport("shell32.dll", SetLastError = true)]
        internal static extern IntPtr SHAppBarMessage(AppBarMessage dwMessage, [In] ref AppBarData pData);

        [DllImport("user32.dll", SetLastError = true)]
        internal static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [return: MarshalAs(UnmanagedType.Bool)]
        [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        static extern bool MoveFileEx(string existingFileName, string newFileName, int flags);

        [DllImport("user32.dll")]
        public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr GetModuleHandle(string lpModuleName);

        [DllImport("user32.dll", ExactSpelling = true, CharSet = CharSet.Auto)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool ShowWindow(IntPtr hWnd, EShowWindow flags);

        [DllImport("user32.dll", EntryPoint = "BlockInput")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool BlockInput([MarshalAs(UnmanagedType.Bool)] bool fBlockIt);

        [DllImport("User32.dll", EntryPoint = "SendMessage")]
        private static extern int SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, ref COPYDATASTRUCT lParam);

        #endregion

        #region Structs
        internal delegate IntPtr HookProc(int code, IntPtr wParam, IntPtr lParam);

        [StructLayout(LayoutKind.Sequential)]
        internal struct Point
        {
            public int X;
            public int Y;
        }

        [StructLayout(LayoutKind.Sequential)]
        internal struct MinMaxInfo
        {
            public Point Reserved;
            public Point MaxSize;
            public Point MaxPosition;
            public Point MinTrackSize;
            public Point MaxTrackSize;
        };

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        internal class MonitorInfo
        {
            public int cbSize = Marshal.SizeOf(typeof(MonitorInfo));
            public Rect rcMonitor = new Rect();
            public Rect rcWork = new Rect();
            public int dwFlags = 0;
        }

        [StructLayout(LayoutKind.Sequential, Pack = 0)]
        internal struct Rect
        {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [StructLayout(LayoutKind.Sequential)]
        internal struct CopyData
        {
            public IntPtr dwData;
            public int cbData;

            [MarshalAs(UnmanagedType.LPWStr)]
            public string lpData;
        }

        [StructLayout(LayoutKind.Sequential)]
        internal struct AppBarData
        {
            public uint cbSize;
            public IntPtr hWnd;
            public uint uCallbackMessage;
            public AppBarEdge uEdge;
            public Rect rect;
            public int lParam;
        }

        [ComImport, TypeLibType(0x1040), Guid("F935DC23-1CF0-11D0-ADB9-00C04FD58A0B")]
        private interface IWshShortcut
        {
            [DispId(0)]
            string FullName { [return: MarshalAs(UnmanagedType.BStr)][DispId(0)] get; }
            [DispId(0x3e8)]
            string Arguments { [return: MarshalAs(UnmanagedType.BStr)][DispId(0x3e8)] get; [param: In, MarshalAs(UnmanagedType.BStr)][DispId(0x3e8)] set; }
            [DispId(0x3e9)]
            string Description { [return: MarshalAs(UnmanagedType.BStr)][DispId(0x3e9)] get; [param: In, MarshalAs(UnmanagedType.BStr)][DispId(0x3e9)] set; }
            [DispId(0x3ea)]
            string Hotkey { [return: MarshalAs(UnmanagedType.BStr)][DispId(0x3ea)] get; [param: In, MarshalAs(UnmanagedType.BStr)][DispId(0x3ea)] set; }
            [DispId(0x3eb)]
            string IconLocation { [return: MarshalAs(UnmanagedType.BStr)][DispId(0x3eb)] get; [param: In, MarshalAs(UnmanagedType.BStr)][DispId(0x3eb)] set; }
            [DispId(0x3ec)]
            string RelativePath { [param: In, MarshalAs(UnmanagedType.BStr)][DispId(0x3ec)] set; }
            [DispId(0x3ed)]
            string TargetPath { [return: MarshalAs(UnmanagedType.BStr)][DispId(0x3ed)] get; [param: In, MarshalAs(UnmanagedType.BStr)][DispId(0x3ed)] set; }
            [DispId(0x3ee)]
            int WindowStyle { [DispId(0x3ee)] get; [param: In][DispId(0x3ee)] set; }
            [DispId(0x3ef)]
            string WorkingDirectory { [return: MarshalAs(UnmanagedType.BStr)][DispId(0x3ef)] get; [param: In, MarshalAs(UnmanagedType.BStr)][DispId(0x3ef)] set; }
            [TypeLibFunc((short)0x40), DispId(0x7d0)]
            void Load([In, MarshalAs(UnmanagedType.BStr)] string PathLink);
            [DispId(0x7d1)]
            void Save();
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct COPYDATASTRUCT
        {
            public IntPtr dwData;
            public int cbData;

            [MarshalAs(UnmanagedType.LPWStr)]
            public string lpData;
        }

        #endregion

        #region Enums
        private const int WS_EX_APPWINDOW = 262144, WS_EX_TOOLWINDOW = 128, GWL_EX_STYLE = -20;
        private static Type m_type        = Type.GetTypeFromProgID("WScript.Shell");
        private static object m_shell     = Activator.CreateInstance(m_type);
        private const int WM_COPYDATA     = 0x004A;

        internal enum AppBarMessage : uint
        {
            New              = 0x00000000,
            Remove           = 0x00000001,
            QueryPos         = 0x00000002,
            SetPos           = 0x00000003,
            GetState         = 0x00000004,
            GetTaskbarPos    = 0x00000005,
            Activate         = 0x00000006,
            GetAutoHideBar   = 0x00000007,
            SetAutoHideBar   = 0x00000008,
            WindowPosChanged = 0x00000009,
            SetState         = 0x0000000A,
        }

        public enum EShowWindow
        {
            Hide                 = 0,
            ShowNormal           = 1,
            ShowMinimized        = 2,
            Maximize             = 3,
            ShowNormalNoActivate = 4,
            Show                 = 5,
            Minimize             = 6,
            ShowMinNoActivate    = 7,
            ShowNoActivate       = 8,
            Restore              = 9,
            ShowDefault          = 10,
            ForceMinimized       = 11
        };

        internal enum AppBarEdge : uint
        {
            Left   = 0,
            Top    = 1,
            Right  = 2,
            Bottom = 3
        }

        internal enum AppBarState
        {
            AutoHide    = 0x01,
            AlwaysOnTop = 0x02,
        }

        #endregion

        internal static Point GetMousePosition()
        {
            var w32Mouse = new Point();
            GetCursorPos(ref w32Mouse);

            return w32Mouse;
        }

        internal static void BringWindowToFront(IntPtr hWnd)
        {
            ShowWindow(hWnd, EShowWindow.Restore);
            SetForegroundWindow(hWnd);
        }

        internal static void MoveFile(string existingFileName, string newFileName, bool overwrite)
        {
            if(overwrite)
            {
                MoveFileEx(existingFileName, newFileName, 0x1 | 0x8 | 0x2);
                return;
            }

            MoveFileEx(existingFileName, newFileName, 0x8 | 0x2);
        }

        public static void CreateShortcut(string fileName, string targetPath, string arguments, string workingDirectory, string description, string hotkey, string iconPath)
        {
            IWshShortcut shortcut     = (IWshShortcut)m_type.InvokeMember("CreateShortcut", System.Reflection.BindingFlags.InvokeMethod, null, m_shell, new object[] { fileName });
            shortcut.Description      = description;
            shortcut.Hotkey           = hotkey;
            shortcut.TargetPath       = targetPath;
            shortcut.WorkingDirectory = workingDirectory;
            shortcut.Arguments        = arguments;
            if (!string.IsNullOrEmpty(iconPath))
                shortcut.IconLocation = iconPath;
            shortcut.Save();
        }

        public static void SendMessage(IntPtr hwnd, string message)
        {
            var messageBytes = Encoding.Unicode.GetBytes(message);
            var data = new COPYDATASTRUCT
            {
                dwData = IntPtr.Zero,
                lpData = message,
                cbData = messageBytes.Length + 1 /* +1 because of \0 string termination */
            };

            if (SendMessage(hwnd, WM_COPYDATA, IntPtr.Zero, ref data) != 0)
                throw new Win32Exception(Marshal.GetLastWin32Error());
        }

        /// <summary>
        /// Hides the window from alt-tab
        /// </summary>
        public static void HideWindow(IntPtr HWND) 
            => SetWindowLong(HWND, GWL_EX_STYLE, (Win32.GetWindowLong(HWND, GWL_EX_STYLE) | WS_EX_TOOLWINDOW) & ~WS_EX_APPWINDOW);
    }
}
