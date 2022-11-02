using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;

namespace Steam_Account_Manager.ViewModels.View
{
    /// <summary>
    /// Логика взаимодействия для AuthenticatorAddWindow.xaml
    /// </summary>
    public partial class AddAuthenticatorWindow : Window
    {
        public AddAuthenticatorWindow(string login, string password, int accountId)
        {
            InitializeComponent();
            DataContext = new AddAuthenticatorViewModel(login, password, accountId, this);
        }

        private void Border_MouseDown(object sender, MouseButtonEventArgs e)
        {
            this.DragMove();

        }

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
