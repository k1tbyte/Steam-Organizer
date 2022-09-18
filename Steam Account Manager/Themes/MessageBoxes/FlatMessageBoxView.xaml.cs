using System.Windows;

namespace Steam_Account_Manager.Themes.MessageBoxes
{
    public partial class FlatMessageBoxView : Window
    {
        public FlatMessageBoxView()
        {
            InitializeComponent();
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }
    }
}
