using System.Windows;

namespace Steam_Account_Manager.Themes.MessageBoxes
{
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
