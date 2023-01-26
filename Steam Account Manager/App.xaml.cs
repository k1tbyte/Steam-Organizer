using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.View.MainControl.Windows;
using Steam_Account_Manager.UIExtensions;
using System;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace Steam_Account_Manager
{
    public partial class App : Application
    {
        static readonly Mutex Mutex = new Mutex(true, "Steam Account Manager");
        public static readonly uint Version = 216;
        public static readonly string WorkingDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        public static bool OfflineMode = false;
        public static new MainWindow MainWindow;
        public static TrayMenu Tray;
        private ExceptionWindow ExceptionWnd;
        public static bool IsShuttingDown { get; set; }

        [STAThread]
        protected override async void OnStartup(StartupEventArgs e)
        {
#if !DEBUG
            if (!Mutex.WaitOne(TimeSpan.Zero, true))
            {
                System.Windows.Forms.MessageBox.Show("Mutex already defined!");
                Shutdown();
            }
#endif

            DispatcherUnhandledException += new DispatcherUnhandledExceptionEventHandler(delegate(object sender, DispatcherUnhandledExceptionEventArgs args)
            {
                
                if (ExceptionWnd == null)
                    ExceptionWnd = new ExceptionWindow();

                ExceptionWnd.SetMessage(args.Exception.ToString());
                ExceptionWnd.WindowStartupLocation = WindowStartupLocation.CenterScreen;
                ExceptionWnd.ShowDialog();
            });

            Config.LoadProperties();



            #region Check internet connection
            if (!Utils.Common.CheckInternetConnection())
            {
                ShutdownMode = ShutdownMode.OnExplicitShutdown;
                Utils.Presentation.OpenPopupMessageBox((string)App.Current.FindResource("mv_connectionNotify"));
                await Task.Delay(15000);
                if (!Utils.Common.CheckInternetConnection())
                {
                    Utils.Presentation.OpenPopupMessageBox((string)App.Current.FindResource("mv_autonomyModeNotify"));
                    OfflineMode = true;
                }
                ShutdownMode = ShutdownMode.OnMainWindowClose;
            } 
            #endregion


            Utils.Common.CreateHttpClientFactory();
            if (Config.Properties.Password == null)
            {
                if (Config.LoadAccounts())
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
            Config.SaveProperties();

            if(SteamRemoteClient.IsRunning)
                SteamRemoteClient.Logout();

            MainWindow?.Dispose();
            Mutex.Close();

            Application.Current.Shutdown();
        }

        public static string FindString(string resourceKey) => (string)App.Current.FindResource(resourceKey);

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
