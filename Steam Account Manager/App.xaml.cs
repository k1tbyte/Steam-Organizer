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
        public static readonly uint Version = 111;
        public static bool IsShuttingDown { get; private set; }

        [STAThread]
        protected override void OnStartup(StartupEventArgs e)
        {
            if (Mutex.WaitOne(TimeSpan.Zero, true))
            {
                var config = Infrastructure.Config.GetInstance();
                
                if (config.Password == null)
                {
                    try
                    {
                        Infrastructure.CryptoBase.GetInstance();

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
                App.Shutdown();
            }
        }

        public static new void Shutdown()
        {
            IsShuttingDown = true;
            Application.Current.Shutdown();
        }
    }
}
