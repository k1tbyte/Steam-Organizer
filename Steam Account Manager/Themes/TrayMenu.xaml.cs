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
using WinForms = System.Windows.Forms;

namespace Steam_Account_Manager.Themes
{
    public partial class TrayMenu : Window
    {
        private WinForms.NotifyIcon notifier = new WinForms.NotifyIcon();
        public TrayMenu()
        {
            InitializeComponent();
            this.notifier.MouseDown += new WinForms.MouseEventHandler(notifier_MouseDown);

            this.notifier.DoubleClick += Notifier_DoubleClick;
            this.notifier.Icon = new System.Drawing.Icon(@"C:\Users\Explyne\source\repos\Steam Account Manager\Steam Account Manager\logo.ico");
            this.notifier.Visible = true;
            this.MouseLeave += Menu_MouseLeave;
        }

        private void Notifier_DoubleClick(object sender, EventArgs e)
        {
            if(App.Current.MainWindow.WindowState == WindowState.Normal)
            {
                App.Current.MainWindow.WindowState = WindowState.Minimized;
            }
            else
            {
                App.Current.MainWindow.WindowState = WindowState.Normal;
            }
        }

        void notifier_MouseDown(object sender, WinForms.MouseEventArgs e)
        {
            if (e.Button == WinForms.MouseButtons.Right)
            {
                Show();
            }
        }

        public new void Show()
        {
            this.Topmost = true;
            base.Show();

            this.Owner = System.Windows.Application.Current.MainWindow;
            var points = Utilities.GetMousePosition();

            this.Left = points.X - this.ActualWidth+3;
            this.Top = points.Y - this.ActualHeight+3;
        }

        private void Menu_MouseLeave(object sender, MouseEventArgs e)
        {
            this.Hide();
        }


        private void Menu_Close(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("Close");
        }
    }
}
