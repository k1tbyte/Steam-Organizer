using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace Steam_Account_Manager.ViewModels.View
{
    /// <summary>
    /// Логика взаимодействия для ShowAuthenticatorWindo.xaml
    /// </summary>
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

    }

}

