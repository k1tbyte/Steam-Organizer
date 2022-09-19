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

namespace Steam_Account_Manager.Themes.MessageBoxes
{
    /// <summary>
    /// Логика взаимодействия для FlatQueryMessageBoxView.xaml
    /// </summary>
    public partial class FlatQueryMessageBoxView : Window
    {
        public FlatQueryMessageBoxView(string Text)
        {
            InitializeComponent();
            Title.Text = Text;
        }


        private void Yes_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = true;
        }

        private void No_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }
    }
}
