using Steam_Account_Manager.ViewModels;
using System;
using System.Threading;
using System.Windows;

namespace Steam_Account_Manager
{
    public partial class App : Application
    {
        static readonly Mutex Mutex = new Mutex(true, "Steam Account Manager OneAtATime");
        public string steamPath = "";
        [STAThread]
        protected override void OnStartup(StartupEventArgs e)
        {
            if (Mutex.WaitOne(TimeSpan.Zero, true))
            {
                var mainWindow = new MainWindow
                {
                                
                WindowStartupLocation = WindowStartupLocation.CenterScreen
                    
                };

                mainWindow.Show();
            }
            else
            {
                Application.Current.Shutdown();
            }
        }
    }
}
