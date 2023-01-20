using System.Windows;
using System.Windows.Input;

namespace Steam_Account_Manager.ViewModels.View
{
    public partial class ShowAuthenticatorWindow : Window
    {
        public ShowAuthenticatorWindow(int accountId)
        {
            InitializeComponent();
            DataContext = new ShowAuthenticatorViewModel(accountId);
        }

        private void Border_MouseDown(object sender, MouseButtonEventArgs e)
        {
            this.DragMove();
        }

        private void deleteAuth_Click(object sender, RoutedEventArgs e)
        {
            confirmDeleteNo.Visibility = Visibility.Visible;
            confirmDeleteYes.Visibility = Visibility.Visible;
        }

        private void confirmDeleteHidden_Click(object sender, RoutedEventArgs e)
        {
            confirmDeleteNo.Visibility = Visibility.Hidden;
            confirmDeleteYes.Visibility = Visibility.Hidden;
        }

        private void codeCopyButton_Click(object sender, RoutedEventArgs e)
        {
            ClipboardNative.SetText(guardBox.Text);
        }
    }

}

