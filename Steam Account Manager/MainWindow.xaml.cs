using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace Steam_Account_Manager
{
    public partial class MainWindow : Window
    {

        public MainWindow()
        {
            InitializeComponent();
        }



        private bool IsMaximize = false;

        private void Border_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
            {
                this.DragMove();
            }
        }


    }


}