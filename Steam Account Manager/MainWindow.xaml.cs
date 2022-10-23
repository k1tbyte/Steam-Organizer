using System;
using System.Windows;
using System.Windows.Input;
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

        private void steamImage_ImageFailed(object sender, ExceptionRoutedEventArgs e)
        {
            var uriSource = new Uri("/Images/user.png", UriKind.Relative);
            steamImage.Source = new BitmapImage(uriSource);
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            App.Shutdown();
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