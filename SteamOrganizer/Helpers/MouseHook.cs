using SteamOrganizer.Infrastructure;
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace SteamOrganizer.Helpers
{
    internal static class MouseHook
    {
        internal static event Action<int,int> OnMouseAction  = delegate { };
        private static readonly Win32.HookProc HookProc      = HookCallback;
        private static IntPtr _hookID                        = IntPtr.Zero;
        private const int WH_MOUSE_LL                        = 14;

        private enum MouseMessages
        {
            WM_LBUTTONDOWN = 0x0201,
            WM_LBUTTONUP   = 0x0202,
            WM_MOUSEMOVE   = 0x0200,
            WM_MOUSEWHEEL  = 0x020A,
            WM_RBUTTONDOWN = 0x0204,
            WM_RBUTTONUP   = 0x0205
        }

        [StructLayout(LayoutKind.Sequential)]
        internal struct MouseHookStruct
        {
            public Win32.Point pt;
            public uint mouseData;
            public uint flags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        public static bool Hook()
        {
            if (_hookID != IntPtr.Zero)
                return false;

            _hookID = SetHook(HookProc);
            return true;


        }
        public static void Unhook()
        {
            if (_hookID == IntPtr.Zero)
                return;

            Win32.UnhookWindowsHookEx(_hookID);
            _hookID = IntPtr.Zero;
        }

        private static IntPtr SetHook(Win32.HookProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule)
            {
                return Win32.SetWindowsHookEx(WH_MOUSE_LL, proc,
                  Win32.GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private static IntPtr HookCallback(
          int nCode, IntPtr wParam, IntPtr lParam)
        {
            var mouse = (MouseMessages)wParam;
            if (nCode >= 0 && (mouse == MouseMessages.WM_LBUTTONDOWN || mouse == MouseMessages.WM_RBUTTONDOWN))
            {
                MouseHookStruct mouseStruct = (MouseHookStruct)Marshal.PtrToStructure(lParam, typeof(MouseHookStruct));
                OnMouseAction?.Invoke(mouseStruct.pt.X, mouseStruct.pt.Y);
            }
            return Win32.CallNextHookEx(_hookID, nCode, wParam, lParam);
        }
    }
}
