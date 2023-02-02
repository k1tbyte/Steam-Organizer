using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System.Windows;
using System.Windows.Input;

namespace Steam_Account_Manager
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            App.Tray = new TrayMenu();
            Closed += (sender, e) =>
            {
                if (App.IsShuttingDown) return;
                App.Shutdown();
            };
        }

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