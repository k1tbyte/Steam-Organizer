using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Utils
{
    internal static class Win32
    {
        internal static class Clipboard
        {
            [DllImport("user32.dll")]
            private static extern bool OpenClipboard(IntPtr hWndNewOwner);

            [DllImport("user32.dll")]
            private static extern bool CloseClipboard();

            [DllImport("user32.dll")]
            private static extern bool SetClipboardData(uint uFormat, IntPtr data);
            private const uint CF_UNICODETEXT = 13;

            public static bool SetText(string text)
            {
                if (!OpenClipboard(IntPtr.Zero))
                {
                    return false;
                }

                var global = Marshal.StringToHGlobalUni(text);

                SetClipboardData(CF_UNICODETEXT, global);
                CloseClipboard();
                return true;
            }
        }

        #region Native imports
        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetCursorPos(ref Win32Point pt);

        [DllImport("user32.dll", ExactSpelling = true, CharSet = CharSet.Auto)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool ShowWindowAsync(HandleRef hWnd, int nCmdShow);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

        [return: MarshalAs(UnmanagedType.Bool)]
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr lpdwProcessId);

        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();

        [DllImport("kernel32.dll")]
        public static extern uint GetCurrentThreadId();

        [DllImport("user32.dll")]
        public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern bool BringWindowToTop(IntPtr hWnd);

        [DllImport("user32.dll", EntryPoint = "BlockInput")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool BlockInput([MarshalAs(UnmanagedType.Bool)] bool fBlockIt);

        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("User32.dll", EntryPoint = "SendMessage")]
        private static extern int SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, ref COPYDATASTRUCT lParam);

        #endregion

        #region Structs
        [StructLayout(LayoutKind.Sequential)]
        private struct Win32Point
        {
            public Int32 X;
            public Int32 Y;
        };

        [StructLayout(LayoutKind.Sequential)]
        private struct COPYDATASTRUCT
        {
            public IntPtr dwData;
            public int cbData;

            [MarshalAs(UnmanagedType.LPWStr)]
            public string lpData;
        }

        public enum WM : uint
        {
            KEYDOWN = 0x0100,
            KEYUP = 0x0101,
            CHAR = 0x0102
        }

        public enum VK : uint
        {
            RETURN = 0x0D,
            TAB = 0x09,
            CONTROL = 0X11,
            SPACE = 0x20
        }

        [ComImport, TypeLibType((short)0x1040), Guid("F935DC23-1CF0-11D0-ADB9-00C04FD58A0B")]
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

        private static Type m_type = Type.GetTypeFromProgID("WScript.Shell");
        private static object m_shell = Activator.CreateInstance(m_type);

        public const int SW_RESTORE = 9;
        private const int GWL_EX_STYLE = -20;
        private const int WS_EX_APPWINDOW = 0x00040000, WS_EX_TOOLWINDOW = 0x00000080;
        private const int WM_COPYDATA = 0x004A;
        #endregion

        public static void CreateShortcut(string fileName, string targetPath, string arguments, string workingDirectory, string description, string hotkey, string iconPath)
        {
            IWshShortcut shortcut = (IWshShortcut)m_type.InvokeMember("CreateShortcut", System.Reflection.BindingFlags.InvokeMethod, null, m_shell, new object[] { fileName });
            shortcut.Description = description;
            shortcut.Hotkey = hotkey;
            shortcut.TargetPath = targetPath;
            shortcut.WorkingDirectory = workingDirectory;
            shortcut.Arguments = arguments;
            if (!string.IsNullOrEmpty(iconPath))
                shortcut.IconLocation = iconPath;
            shortcut.Save();
        }

        public static Point GetMousePosition()
        {
            var w32Mouse = new Win32Point();
            GetCursorPos(ref w32Mouse);

            return new Point(w32Mouse.X, w32Mouse.Y);
        }

        public static void KeyboardEvent(byte code)
        {
            keybd_event(code, 0, 0x00, 0);
            Thread.Sleep(50);
            keybd_event(code, 0, 0x02, 0);
        }

        public static void SendVirtualKey(IntPtr HWND, VK key)
        {
            PostMessage(HWND, (int)WM.KEYDOWN, (IntPtr)key, IntPtr.Zero);
            PostMessage(HWND, (int)WM.KEYUP, (IntPtr)key, IntPtr.Zero);
        }

        public static void ForceWindowToForeground(IntPtr HWND)
        {
            const int SW_SHOW = 5;
            AttachedThreadInputAction(
                () =>
                {
                    BringWindowToTop(HWND);
                    ShowWindow(HWND, SW_SHOW);
                });
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

        public static void AttachedThreadInputAction(Action action)
        {
            var foreThread = GetWindowThreadProcessId(GetForegroundWindow(), IntPtr.Zero);
            var appThread = GetCurrentThreadId();
            bool threadsAttached = false;
            try
            {
                threadsAttached =
                    foreThread == appThread ||
                    AttachThreadInput(foreThread, appThread, true);
                if (threadsAttached) action();
                else throw new Exception("Attached steam thread failed");
            }
            finally
            {
                if (threadsAttached)
                    AttachThreadInput(foreThread, appThread, false);
            }
        }

        public static string GetMessage(int message, IntPtr lParam)
        {
            if (message == WM_COPYDATA)
            {
                try
                {
                    var data = Marshal.PtrToStructure<COPYDATASTRUCT>(lParam);
                    var result = string.Copy(data.lpData);
                    return result;
                }
                catch
                {
                    return null;
                }
            }
            return null;
        }

        /// <summary>
        /// Hides the window from alt-tab
        /// </summary>
        public static void HideWindow(IntPtr HWND) => SetWindowLong(HWND, GWL_EX_STYLE, (Win32.GetWindowLong(HWND, GWL_EX_STYLE) | WS_EX_TOOLWINDOW) & ~WS_EX_APPWINDOW);
        

    }
}
