using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.MVVM.ViewModels;
using System.Windows;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.Windows
{
    public partial class ShowAuthenticatorWindow : Window
    {
        internal ShowAuthenticatorWindow(Account account)
        {
            InitializeComponent();
            DataContext = new ShowAuthenticatorViewModel(account);
        }

        private void deleteAuth_Click(object sender, RoutedEventArgs e)          => confirmDeleteNo.Visibility = confirmDeleteYes.Visibility = Visibility.Visible;
        private void confirmDeleteHidden_Click(object sender, RoutedEventArgs e) => confirmDeleteYes.Visibility = confirmDeleteNo.Visibility = Visibility.Collapsed;
        private void codeCopyButton_Click(object sender, RoutedEventArgs e)      => Utils.Win32.Clipboard.SetText(guardBox.Text);
        private void BorderDragMove(object sender, MouseButtonEventArgs e)       => this.DragMove();
    }

}

