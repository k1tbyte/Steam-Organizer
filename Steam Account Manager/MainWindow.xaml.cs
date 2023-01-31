using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System;
using System.Diagnostics;
using System.Windows;
using System.Windows.Input;

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
        }

        public void Dispose() => trayMenu.Dispose();
        private void BorderDragMove(object sender, MouseButtonEventArgs e) => this.DragMove();
            
        
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

        private void CancellationUpdateEvent(object sender, RoutedEventArgs e) => MainWindowViewModel.CancellationFlag = true;
    }

}