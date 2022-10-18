using Steam_Account_Manager.Themes;
using Steam_Account_Manager.Themes.MessageBoxes;
using System;
using System.ComponentModel;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace Steam_Account_Manager
{
    public partial class MainWindow : Window
    {
/*        private System.Windows.Forms.NotifyIcon m_notifyIcon;
        private WindowState m_storedWindowState = WindowState.Normal;
        private TrayMenu trayMenu = new TrayMenu();*/

        public MainWindow()
        {
            InitializeComponent();
            TrayMenu neby = new TrayMenu();
            
            /*  m_notifyIcon = new System.Windows.Forms.NotifyIcon();*/

            /*            m_notifyIcon.Text = "Steam Account Manager";
                        m_notifyIcon.Icon = new System.Drawing.Icon(@"C:\Users\Explyne\source\repos\Steam Account Manager\Steam Account Manager\logo.ico");
                        m_notifyIcon.DoubleClick += new EventHandler(m_notifyIcon_Click);
                        m_notifyIcon.MouseDown += M_notifyIcon_MouseDown;
                        m_notifyIcon.Visible = true;*/
        }

    /*    private void M_notifyIcon_MouseDown(object sender, System.Windows.Forms.MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Right)

            {
                trayMenu.Show();
*//*                ContextMenu menu = (ContextMenu)this.FindResource("NotifierContextMenu");

                menu.IsOpen = true;*//*

            }
           
        }

        void OnClose(object sender, CancelEventArgs args)
        {
            m_notifyIcon.Dispose();
            m_notifyIcon = null;
        }
        private ContextMenuStrip CreateContextMenu()
        {
            var openItem = new ToolStripMenuItem("Open");
            openItem.Click += OpenItemOnClick;
            var exitItem = new ToolStripMenuItem("Exit");
            exitItem.Click += ExitItemOnClick;
            var contextMenu = new ContextMenuStrip { Items = { openItem, exitItem } };
            return contextMenu;
        }


        private void OpenItemOnClick(object sender, EventArgs eventArgs)
        {
            this.WindowState = WindowState.Normal;
        }

        private void ExitItemOnClick(object sender, EventArgs eventArgs)
        {
            App.Shutdown();
        }


        void OnStateChanged(object sender, EventArgs args)
        {
            if (WindowState == WindowState.Minimized)
            {
                Hide();
                if (m_notifyIcon != null)
                    m_notifyIcon.ShowBalloonTip(2000);
            }
            else
                m_storedWindowState = WindowState;
        }
        void OnIsVisibleChanged(object sender, DependencyPropertyChangedEventArgs args)
        {
            CheckTrayIcon();
        }

        void m_notifyIcon_Click(object sender, EventArgs e)
        {
            Show();
            WindowState = m_storedWindowState;
        }
        void CheckTrayIcon()
        {
            ShowTrayIcon(!IsVisible);
        }

        void ShowTrayIcon(bool show)
        {
            if (m_notifyIcon != null)
                m_notifyIcon.Visible = show;
        }*/
        private void Border_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
            {
                this.DragMove();
            }
        }

        private void steamImage_ImageFailed(object sender, ExceptionRoutedEventArgs e)
        {
            var uriSource = new Uri("/Images/user.png", UriKind.Relative);
            steamImage.Source = new BitmapImage(uriSource);
        }

        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {

        }

    }

}