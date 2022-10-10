using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.ViewModels.View;
using System;
using System.IO;
using System.Threading;
using System.Windows;

namespace Steam_Account_Manager
{
    public partial class App : Application
    {
        static readonly Mutex Mutex = new Mutex(true, "Steam Account Manager");
        public static readonly uint Version = 204;
        public static bool IsShuttingDown { get; set; }

        [STAThread]
        protected override void OnStartup(StartupEventArgs e)
        {
            if (Mutex.WaitOne(TimeSpan.Zero, true))
            {
                Config.GetPropertiesInstance();
                Utilities.CreateHttpClientFactory();
                if (Config.Properties.Password == null)
                {
                    try
                    {
                        Config.GetAccountsInstance();

                        var mainWindow = new MainWindow
                        {
                            WindowStartupLocation = WindowStartupLocation.CenterScreen
                        };

                        mainWindow.Show();
                    }
                    catch
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
            else
            {
                Shutdown();
            }
        }

        public static new void Shutdown()
        {
            IsShuttingDown = true;
            Application.Current.Shutdown();
        }
    }
}
