using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.Themes.MessageBoxes;
using Steam_Account_Manager.ViewModels.View;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows;
using System.Windows.Threading;

namespace Steam_Account_Manager
{
    public partial class App : Application
    {
        static readonly Mutex Mutex = new Mutex(true, "Steam Account Manager");
        public static readonly uint Version = 216;
        public static readonly string WorkingDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        public static new MainWindow MainWindow;
        public static TrayMenu Tray;
        private ExceptionMessageView ExceptionWnd;
        public static bool IsShuttingDown { get; set; }

        [STAThread]
        protected override void OnStartup(StartupEventArgs e)
        {
            if (!Mutex.WaitOne(TimeSpan.Zero, true))
            {
                System.Windows.Forms.MessageBox.Show("Mutex already defined!");
                Shutdown();
            }


            DispatcherUnhandledException += new DispatcherUnhandledExceptionEventHandler(delegate(object sender, DispatcherUnhandledExceptionEventArgs args)
            {
                
                if (ExceptionWnd == null)
                    ExceptionWnd = new ExceptionMessageView();

                ExceptionWnd.SetMessage(args.Exception.ToString());
                ExceptionWnd.WindowStartupLocation = WindowStartupLocation.CenterScreen;
                ExceptionWnd.ShowDialog();
            });

            Config.GetPropertiesInstance();
            if (!Utilities.CheckInternetConnection())
                Thread.Sleep(15000);

            Utilities.CreateHttpClientFactory();
            if (Config.Properties.Password == null)
            {
                if (Config.GetAccountsInstance())
                {
                    MainWindow = new MainWindow
                    {
                        WindowStartupLocation = WindowStartupLocation.CenterScreen
                    };
                    MainWindowStart();
                }
                else
                {
                    var cryptoKeyWindow = new CryptoKeyWindow(true)
                    {
                        WindowStartupLocation = WindowStartupLocation.CenterScreen
                    };

                    cryptoKeyWindow.Show();
                }
            }
            else
            {
                var auth = new AuthenticationWindow(true)
                {
                    WindowStartupLocation = WindowStartupLocation.CenterScreen
                };
                auth.Show();
            }
        }

        public static new void Shutdown()
        {
            IsShuttingDown = true;

            if(SteamRemoteClient.IsRunning)
                SteamRemoteClient.Logout();

            MainWindow?.Dispose();
            Mutex.Close();

            Application.Current.Shutdown();
        }

        public static void MainWindowStart()
        {
            if (Config.Properties.MinimizeOnStart)
            {
                MainWindow.WindowState = WindowState.Minimized;
                return;
            }
            MainWindow.Show();
        }
    }
}
