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
    public partial class ExceptionMessageView : Window
    {
        public ExceptionMessageView()
        {
            InitializeComponent();
        }

        public void SetMessage(string message)
        {
            exception.Text = message;
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            App.Shutdown();
        }

        private void Copy_Click(object sender, RoutedEventArgs e)
        {
            Clipboard.SetText(exception.Text);
        }

        private void repair_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = repair;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Fixes errors by restoring application files";
        }


        private void repair_MouseLeave(object sender, MouseEventArgs e)
        {
            Popup.Visibility = Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void repair_Click(object sender, RoutedEventArgs e)
        {
            if(System.IO.File.Exists($"{App.WorkingDirectory}\\config.dat"))
              System.IO.File.Delete($"{App.WorkingDirectory}\\config.dat");

            using (System.Diagnostics.Process updater = new System.Diagnostics.Process())
            {
                updater.StartInfo.FileName = $"{App.WorkingDirectory}\\UpdateManager.exe";
                updater.StartInfo.Arguments = "/repair";
                updater.Start();
            }

            App.Shutdown();
        }

        private void Border_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            this.DragMove();
        }
    }
}
