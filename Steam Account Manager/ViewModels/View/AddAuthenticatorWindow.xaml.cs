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
    /// Логика взаимодействия для AuthenticatorAddWindow.xaml
    /// </summary>
    public partial class AddAuthenticatorWindow : Window
    {
        public AddAuthenticatorWindow(string login, string password)
        {
            InitializeComponent();
            DataContext = new AddAuthenticatorViewModel(login, password, this);
        }

        private void Border_MouseDown(object sender, MouseButtonEventArgs e)
        {
            this.DragMove();

        }
    }
}
