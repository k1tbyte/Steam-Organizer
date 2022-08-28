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

        [STAThread]
        protected override void OnStartup(StartupEventArgs e)
        {
            if (Mutex.WaitOne(TimeSpan.Zero, true))
            {
#if DEBUG
                var workingDir = Directory.GetParent(Environment.CurrentDirectory).Parent.FullName;
                DotEnv.Load(Path.Combine(workingDir, "Keys.env"));
#endif
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
                Application.Current.Shutdown();
            }
        }
    }
}
