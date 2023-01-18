using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.ViewModels;
using System;
using System.Collections.ObjectModel;
using System.Reflection;
using System.Windows;
using System.Windows.Input;
using WinForms = System.Windows.Forms;

namespace Steam_Account_Manager
{
    public partial class TrayMenu : Window, IDisposable
    {
        private WinForms.NotifyIcon TrayIcon = new WinForms.NotifyIcon();
        private double BaseHeight = 94d;
        public TrayMenu()
        {
            InitializeComponent();
            TrayIcon = new WinForms.NotifyIcon()
            {
                Text = "Steam Account Manager",
                Icon = System.Drawing.Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location),
                Visible = true,

            };

            this.DataContext = new TrayModel();
            this.TrayIcon.MouseDown += new WinForms.MouseEventHandler(notifier_MouseDown);
            this.TrayIcon.DoubleClick += Notifier_DoubleClick;
            this.MouseLeave += Menu_MouseLeave;
        }


        public void Dispose()
        {
            TrayIcon?.Dispose();
            TrayIcon = null;
        }

        public void TrayListUpdate() { (this.DataContext as TrayModel).RecentlyUpdate(); }

        private void HideOrShow()
        {
            if (App.MainWindow.IsVisible)
            {
                App.MainWindow.Hide();
            }
            else
            {
                App.MainWindow.Show();
            }
            this.Hide();
        }

        private void Notifier_DoubleClick(object sender, EventArgs e)
        {
            HideOrShow();
        }

        void notifier_MouseDown(object sender, WinForms.MouseEventArgs e)
        {
            if (e.Button == WinForms.MouseButtons.Right)
            {
                Show();
            }
        }

        public new void Show()
        {
            this.Topmost = true;
            var newHeight = BaseHeight + Config.Properties.RecentlyLoggedUsers.Count * 28;
            if (this.Height != newHeight)
                this.Height = newHeight;

            var points = Utilities.GetMousePosition();

            this.Left = points.X - this.Width + 3;
            this.Top = points.Y - this.Height + 3;
            base.Show();


        }

        private void Menu_MouseLeave(object sender, MouseEventArgs e)
        {
            this.Hide();
        }

        private void Exit_Button_Click(object sender, RoutedEventArgs e)
        {
            App.Shutdown();
        }

        private void ShowOrHide_Click(object sender, RoutedEventArgs e)
        {
            HideOrShow();
        }

        private void Options_Click(object sender, RoutedEventArgs e)
        {
            if (!App.MainWindow.IsVisible)
            {
                App.MainWindow.Show();
            }
            MainWindowViewModel.SettingsViewCommand.Execute(null);
            this.Hide();
        }

        private void box_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if (box.SelectedItem == null) return;
            var idx = Config.Accounts.FindIndex(o => o.SteamId64 == (box.SelectedItem as RecentlyLoggedUser).SteamID64);

            if (idx != -1)
                (AccountsViewModel.AccountTabViews[idx].DataContext as AccountTabViewModel).ConnectToSteamCommand.Execute(null);
            box.UnselectAll();
            this.Hide();
        }
    }

    internal class TrayModel : ObservableObject
    {
        private ObservableCollection<RecentlyLoggedUser> _recently;
        public ObservableCollection<RecentlyLoggedUser> Recently
        {
            get => _recently;
            set
            {
                _recently = value;
            }
        }

        public void RecentlyUpdate()
        {
            Recently = new ObservableCollection<RecentlyLoggedUser>(Config.Properties.RecentlyLoggedUsers);
            OnPropertyChanged(nameof(Recently));
        }
        public TrayModel()
        {
            Recently = new ObservableCollection<RecentlyLoggedUser>(Config.Properties.RecentlyLoggedUsers);
        }
    }
}
