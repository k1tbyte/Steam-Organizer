using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.ViewModels.View;
using System;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Windows;

namespace Steam_Account_Manager
{
    public partial class App : Application
    {
        static readonly Mutex Mutex = new Mutex(true, "Steam Account Manager");
        public static readonly uint Version = 208;
        public static readonly string WorkingDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        public static new MainWindow MainWindow;
        public static bool IsShuttingDown { get; set; }

        [STAThread]
        protected override void OnStartup(StartupEventArgs e)
        {
            try
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

                            MainWindow = new MainWindow
                            {
                                WindowStartupLocation = WindowStartupLocation.CenterScreen
                            };
                            MainWindowStart();

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

            catch (Exception exc)
            {
                System.Windows.Forms.MessageBox.Show(exc.ToString());
            }
        }

        public static new void Shutdown()
        {
            IsShuttingDown = true;
            MainWindow?.Dispose();

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
