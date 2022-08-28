using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Automation;


namespace ConsoleProgramm
{
    internal class Program
    {
        [DllImport("user32.dll", ExactSpelling = true, CharSet = CharSet.Auto)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern IntPtr SendMessage(IntPtr hWnd, int Msg, int wParam, IntPtr lParam);

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

        [DllImport("user32.dll", SetLastError = true)]
        static extern IntPtr SetFocus(IntPtr hWnd);

        private enum WM : uint
        {
            KEYDOWN = 0x0100,
            KEYUP = 0x0101,
            CHAR = 0x0102
        }
        public enum VK : uint
        {
            RETURN = 0x0D,
            TAB = 0x09,
            SPACE = 0x20
        }
        public enum SW : int
        {
            SHOW = 5
        }

        public static void ForceWindowToForeground(IntPtr hwnd)
        {
            const int SW_SHOW = 5;
            AttachedThreadInputAction(
                () =>
                {
                    BringWindowToTop(hwnd);
                    ShowWindow(hwnd, SW_SHOW);
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
                else throw new ThreadStateException("AttachThreadInput failed.");
            }
            finally
            {
                if (threadsAttached)
                    AttachThreadInput(foreThread, appThread, false);
            }
        }


        public static void SendCharacter(IntPtr hwnd, char c)
        {
            SendMessage(hwnd, (int)WM.CHAR, c, IntPtr.Zero);
        }
        public static void SendVirtualKey(IntPtr hwnd, VK vk)
        {
            SendMessage(hwnd, (int)WM.KEYDOWN, (int)vk, IntPtr.Zero);
            SendMessage(hwnd, (int)WM.KEYUP, (int)vk, IntPtr.Zero);
        }
        public static Process KillSteamAndConnect(string steamDir= "d:/program files/steam/steam.exe", string args="")
        {
            using (Process processSteamKill = new Process())
            {
                processSteamKill.StartInfo.UseShellExecute = false;
                processSteamKill.StartInfo.CreateNoWindow = true;
                processSteamKill.StartInfo.FileName = "taskkill";
                processSteamKill.StartInfo.Arguments = "/F /T /IM steam.exe";
                processSteamKill.Start();
            };

            System.Threading.Thread.Sleep(2000);
            Process processSteam = new Process();
            processSteam.StartInfo.UseShellExecute = true;
            processSteam.StartInfo.FileName = steamDir;
            processSteam.StartInfo.Arguments = args;
            processSteam.Start();
            return processSteam;    

        }

        private static async Task callback()
        {
            await Task.Factory.StartNew(() =>
            {
                Automation.RemoveAllEventHandlers();
                Process steamProcess = KillSteamAndConnect();
                int steamCount = 0;
                Automation.AddAutomationEventHandler(
                WindowPattern.WindowOpenedEvent,
                AutomationElement.RootElement,
                TreeScope.Children,
                (sender, e) =>
                {
                    var element = sender as AutomationElement;
                    if (element.Current.Name.Equals("Steam"))
                    {
                        if (++steamCount >= 2)
                        {
                            Automation.RemoveAllEventHandlers();
                            Console.WriteLine("cock!");
                        }
                    }
                    if (element.Current.ClassName.Equals("vguiPopupWindow") && element.Current.Name.Contains("Steam") && element.Current.Name.Length > 5)
                    {
                        Thread.Sleep(500);
                        ForceWindowToForeground((IntPtr)element.Current.NativeWindowHandle);
                        SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                        Thread.Sleep(100);
                                foreach (char c in "assaadasda")
                                {
                                    SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                    Thread.Sleep(10);
                                    SendCharacter((IntPtr)element.Current.NativeWindowHandle, c);
                                }
                                Thread.Sleep(100);
                                SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.TAB);
                                Thread.Sleep(100);
                            
                            foreach (char c in "asadasda")
                            {
                                SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                                Thread.Sleep(10);
                                SendCharacter((IntPtr)element.Current.NativeWindowHandle, c);
                            }

                            SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                            Thread.Sleep(100);
                            SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.TAB);
                            Thread.Sleep(100);
                            SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.SPACE);

                            SetForegroundWindow((IntPtr)element.Current.NativeWindowHandle);
                            Thread.Sleep(100);
                            SendVirtualKey((IntPtr)element.Current.NativeWindowHandle, VK.RETURN);
                            Automation.RemoveAllEventHandlers();

                        Console.WriteLine("cockovich");
                    }
                });
            });
        }

        static void Main(string[] args)
        {
            callback().GetAwaiter().GetResult();
            Console.WriteLine("cock");
        }
    }
}
