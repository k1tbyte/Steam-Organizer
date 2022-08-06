using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using Steam_Account_Manager.Infrastructure;

namespace Steam_Account_Manager
{
    public partial class App : Application
    {
        static Mutex mutex = new Mutex(true, "Steam Account Manager OneAtATime");
        [STAThread]
        protected override void OnStartup(StartupEventArgs e)
        {
            if (mutex.WaitOne(TimeSpan.Zero, true))
            {
                Config config = Config.GetInstance();

                    MainWindow mainWindow = new MainWindow();
                    mainWindow.WindowStartupLocation = System.Windows.WindowStartupLocation.CenterScreen;
                    mainWindow.Show();
            }
            else
            {
                Application.Current.Shutdown();
            }
        }
    }
}
