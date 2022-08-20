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
                var workingDir = Directory.GetParent(Environment.CurrentDirectory).Parent.FullName;
                DotEnv.Load(Path.Combine(workingDir, "Keys.env"));
                Infrastructure.Config.GetInstance();

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

                    cryptoKeyWindow.ShowDialog();
                }

            }
            else
            {
                Application.Current.Shutdown();
            }
        }
    }
}
