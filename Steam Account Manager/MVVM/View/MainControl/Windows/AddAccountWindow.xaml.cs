using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System.Windows;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.MainControl.Windows
{
    public partial class AddAccountWindow : Window
    {
        public AddAccountWindow()
        {
            InitializeComponent();
            DataContext = new AddAccountViewModel();
        }

        private void CloseEvent(object sender, RoutedEventArgs e)          => this.Close();
        private void BorderDragMove(object sender, MouseButtonEventArgs e) => this.DragMove();
    }
}
