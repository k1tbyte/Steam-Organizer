using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.View.MainControl.Windows;
using Steam_Account_Manager.UIExtensions;
using Steam_Account_Manager.Utils;
using System;
using System.IO;
using System.Reflection;
using System.Runtime;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
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

        public static Cursor GrabCursor { get; }     = new Cursor(new MemoryStream(Steam_Account_Manager.Properties.Resources.grab));
        public static Cursor GrabbingCursor { get; } = new Cursor(new MemoryStream(Steam_Account_Manager.Properties.Resources.grabbing));


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
            ProfileOptimization.SetProfileRoot(WorkingDirectory);
            ProfileOptimization.StartProfile("Startup.profile");

            DispatcherUnhandledException += new DispatcherUnhandledExceptionEventHandler(delegate(object sender, DispatcherUnhandledExceptionEventArgs args)
            {
                ExceptionWnd = ExceptionWnd ?? new ExceptionWindow();

                ExceptionWnd.SetMessage(args.Exception.ToString());
                ExceptionWnd.WindowStartupLocation = WindowStartupLocation.CenterScreen;
                ExceptionWnd.ShowDialog();
            });

            Config.LoadProperties();

/*            new CheckAccountWindow().ShowDialog();
            Shutdown();*/

            #region Check internet connection
            if (!Common.CheckInternetConnection())
            {
                ShutdownMode = ShutdownMode.OnExplicitShutdown;
                Presentation.OpenPopupMessageBox(FindString("mv_connectionNotify"));
                await Task.Delay(15000);
                if (!Common.CheckInternetConnection())
                {
                    Presentation.OpenPopupMessageBox(FindString("mv_autonomyModeNotify"));
                    OfflineMode = true;
                }
                ShutdownMode = ShutdownMode.OnMainWindowClose;
            }
            #endregion


            Common.CreateHttpClientFactory();
            if (Config.Properties.Password == null)
            {
                if (Config.LoadAccounts())
                {
                    MainWindow = new MainWindow();
                    MainWindowStart();
                }
                else
                {
                    new CryptoKeyWindow(true).Show();
                }
            }
            else
            {
                new AuthenticationWindow(true).Show();
            }
        }

        public static new void Shutdown()
        {
            IsShuttingDown = true;
            Config.SaveProperties();

            if(SteamRemoteClient.IsRunning)
                SteamRemoteClient.Logout();

            Tray.Dispose();
            GrabCursor.Dispose();
            GrabbingCursor.Dispose();
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
