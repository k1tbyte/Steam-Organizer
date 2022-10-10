using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Automation;

namespace Steam_Account_Manager.Infrastructure
{
    internal class SteamHandler
    {
        [DllImport("user32.dll", ExactSpelling = true, CharSet = CharSet.Auto)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindowAsync(HandleRef hWnd, int nCmdShow);

        [return: MarshalAs(UnmanagedType.Bool)]
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr lpdwProcessId);

        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("kernel32.dll")]
        static extern uint GetCurrentThreadId();

        [DllImport("user32.dll")]
        static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool BringWindowToTop(IntPtr hWnd);

        [DllImport("user32.dll")]
        static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        public const int SW_RESTORE = 9;

        private enum WM : uint
        {
            KEYDOWN = 0x0100,
            KEYUP = 0x0101,
            CHAR = 0x0102
        }
        private enum VK : uint
        {
            RETURN = 0x0D,
            TAB = 0x09,
            CONTROL = 0X11,
            SPACE = 0x20
        }

        #region WinAPI Helper

        private static void SendVirtualKey(IntPtr HWND, VK key)
        {
            PostMessage(HWND, (int)WM.KEYDOWN, (IntPtr)key, IntPtr.Zero);
            PostMessage(HWND, (int)WM.KEYUP, (IntPtr)key, IntPtr.Zero);
        }

        private static void ForceWindowToForeground(IntPtr HWND)
        {
            const int SW_SHOW = 5;
            AttachedThreadInputAction(
                () =>
                {
                    BringWindowToTop(HWND);
                    ShowWindow(HWND, SW_SHOW);
                });
        }

        private static void AttachedThreadInputAction(Action action)
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

        private static bool FocusProcess(string procName)
        {
            Process[] objProcesses = Process.GetProcessesByName(procName);
            if (objProcesses.Length > 0)
            {
                IntPtr hWnd = IntPtr.Zero;
                hWnd = objProcesses[0].MainWindowHandle;
                ShowWindowAsync(new HandleRef(null, hWnd), SW_RESTORE);
                SetForegroundWindow(hWnd);
                return true;
            }
            else
                return false;

        }

        #endregion


        public static void VirtualSteamLogger(string username, string password,bool savePassword = false, bool paste2fa = false)
        {
            Automation.RemoveAllEventHandlers();
            if (Utilities.GetSteamRegistryLanguage() != username)
            {
                Utilities.SetSteamRegistryRememberUser(String.Empty);
            }

            Utilities.KillSteamAndConnect(Config.Properties.SteamDirection);
            byte SteamAwaiter = 0;

            Automation.AddAutomationEventHandler(
                WindowPattern.WindowOpenedEvent,
                AutomationElement.RootElement,
                TreeScope.Children,
                (sender, e) =>
                {
                    var element = sender as AutomationElement;

                    if (element.Current.Name.Equals("Steam"))
                    {
                        if (++SteamAwaiter >= 2)
                        {
                            Automation.RemoveAllEventHandlers();
                        }
                    }
                    if (element.Current.Name.Contains("Steam") && element.Current.Name.Length > 5)
                    {
                        Thread.Sleep(500);
                        ForceWindowToForeground((IntPtr)element.Current.NativeWindowHandle);
                        SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                        Thread.Sleep(50);

                        if (Utilities.GetSteamRegistryActiveUser() == 0)
                        {
                            if (String.IsNullOrEmpty(Utilities.GetSteamRegistryRememberUser()))
                            {
                                foreach (char c in username)
                                {
                                    SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                    PostMessage((IntPtr)element.Current.NativeWindowHandle, (int)WM.CHAR, (IntPtr)c, IntPtr.Zero);
                                }
                                Thread.Sleep(100);
                                SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.TAB);
                                Thread.Sleep(100);
                            }

                            foreach (char c in password)
                            {
                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                PostMessage((IntPtr)element.Current.NativeWindowHandle, (int)WM.CHAR, (IntPtr)c, IntPtr.Zero);
                            }

                            if (savePassword)
                            {
                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                Thread.Sleep(100);
                                SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.TAB);
                                Thread.Sleep(100);
                                SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.SPACE);
                            }

                            SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                            Thread.Sleep(100);
                            System.Windows.Forms.SendKeys.SendWait("{ENTER}");

                            if (paste2fa)
                            {
                                Thread.Sleep(2700);
                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                Thread.Sleep(100);
                                System.Windows.Forms.SendKeys.SendWait("^{v}");

                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                Thread.Sleep(100);
                                System.Windows.Forms.SendKeys.SendWait("{ENTER}");
                            }
                            Automation.RemoveAllEventHandlers();

                            if(Config.Properties.AutoClose)
                                App.Current.Dispatcher.InvokeShutdown();
                        }

                    }

                });
        }
    }
}
