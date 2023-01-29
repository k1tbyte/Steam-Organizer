using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.MainControl.Windows
{
    public partial class AddAuthenticatorWindow : Window
    {
        internal AddAuthenticatorWindow(Account acc)
        {
            InitializeComponent();
            DataContext = new AddAuthenticatorViewModel(acc, this);
        }

        private void Border_MouseDown(object sender, MouseButtonEventArgs e) => this.DragMove();
        

        private void buttons_Click(object sender, RoutedEventArgs e)
        {
            buttons.Visibility = Visibility.Hidden;
            add_panel.Visibility = Visibility.Visible;
        }

        private async void Button_Click(object sender, RoutedEventArgs e)
        {
            await Task.Delay(300);
            Login.Text = "";
        }
    }
}
