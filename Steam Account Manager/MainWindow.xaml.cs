using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace Steam_Account_Manager
{
    public partial class MainWindow : Window, IDisposable
    {
        TrayMenu trayMenu;
        public MainWindow()
        {
            InitializeComponent();
            trayMenu = new TrayMenu();
            App.Tray = trayMenu;
            AutoRemoteLogged();
        }

        private async void AutoRemoteLogged()
        {
            await App.Current.Dispatcher.InvokeAsync(() =>
            {
             /*   if (Config.Properties.AutoLoginUserID == null)
                    return;

                var desired = Config.Accounts.Find(o => o.SteamId64.GetHashCode() == Config.Properties.AutoLoginUserID.GetHashCode()); //REFACTOR

                if (desired == null)
                {
                    Config.Properties.AutoLoginUserID = null;
                    Config.SaveProperties();
                    return;
                }

                (this.DataContext as MainWindowViewModel).SettingsVm.AutoLoginAccount = desired;
                if (!App.OfflineMode)
                    (this.DataContext as MainWindowViewModel).RemoteControlVm.LoginViewCommand.Execute(Config.Accounts.IndexOf(desired));*/
            });
        }



        public void Dispose()
        {
            trayMenu.Dispose();
        }

        private void Border_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
            {
                this.DragMove();
            }
        }

        public new void Hide()
        {
            base.Hide();
            WindowState = WindowState.Minimized;
        }

        public new void Show()
        {
            base.Show();
            WindowState = WindowState.Normal;
        }
    }

}