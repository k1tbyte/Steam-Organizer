using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.MVVM.ViewModels;
using Steam_Account_Manager.Utils;
using System;
using System.Diagnostics;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;

namespace Steam_Account_Manager
{
    public partial class MainWindow : Window
    {
        public static IntPtr WindowHandle { get; private set; }
        public MainWindow()
        {
            InitializeComponent();
            App.Tray = new TrayMenu();
            Closed += (sender, e) =>
            {
                if (App.IsShuttingDown) return;
                App.Shutdown();
            };

            Loaded += (sender, e) => 
            {
                WindowHandle = new WindowInteropHelper(this).Handle;
                HwndSource.FromHwnd(WindowHandle)?.AddHook(new HwndSourceHook(MessagesHandler));
                if (Config.Properties.FreezeMode)
                    LimitMemory();

                if (App.Args == null)
                    return;

                ArgumentsHandler(App.Args);
            };
        }

        private void LimitMemory()
        {
            using (var proc = System.Diagnostics.Process.GetCurrentProcess())
            {
                proc.MaxWorkingSet = proc.MinWorkingSet;
            }
        }

        private static IntPtr MessagesHandler(IntPtr handle, int message, IntPtr wParameter, IntPtr lParameter, ref bool handled)
        {
            var args = Win32.GetMessage(message, lParameter);

            if (args == null)
            {
                return IntPtr.Zero;
            }

            Win32.BringWindowToFront(WindowHandle);
            ArgumentsHandler(args);
            handled = true;
            return IntPtr.Zero;
        }

        private static void ArgumentsHandler(string argument)
        {
            var args = argument.Split(' ');

            if (!args.Any())
                return;

            if(args.Length >= 2 && ulong.TryParse(args[1], out ulong id))
            {
                if (args[0] == "-login")
                {
                    _ = SteamHandler.ConnectToSteam(Config.Accounts.Find(o => o.SteamId64 == id)).ConfigureAwait(false);
                }
                else if (args[0] == "-applaunch" && args.Length == 3 && uint.TryParse(args[2], out uint appid))
                {
                    _ = SteamHandler.ConnectToSteam(Config.Accounts.Find(o => o.SteamId64 == id),$"-applaunch {appid}").ConfigureAwait(false);
                }
            }

        }

        private void BorderDragMove(object sender, MouseButtonEventArgs e) => this.DragMove();
            
        public new void Hide()
        {
            base.Hide();
            WindowState = WindowState.Minimized;
            if (Config.Properties.FreezeMode)
                LimitMemory();
            
        }

        public new void Show()
        {
            base.Show();
            WindowState = WindowState.Normal;
        }

        private void CancellationUpdateEvent(object sender, RoutedEventArgs e) => MainWindowViewModel.CancellationFlag = true;
    }

}