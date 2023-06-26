using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.MVVM.ViewModels;
using System.Windows;
using System.Windows.Input;

namespace SteamOrganizer.MVVM.View.Windows
{
    public partial class ShowAuthenticatorWindow : Window
    {
        internal ShowAuthenticatorWindow(Account account)
        {
            InitializeComponent();
            DataContext = new ShowAuthenticatorViewModel(account);
        }

        private void codeCopyButton_Click(object sender, RoutedEventArgs e)      => Utils.Win32.Clipboard.SetText(guardBox.Text);
        private void BorderDragMove(object sender, MouseButtonEventArgs e)       => this.DragMove();
    }

}

