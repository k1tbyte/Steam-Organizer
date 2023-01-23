using System;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Media;

namespace Steam_Account_Manager.Themes.MessageBoxes
{
    public partial class PopupMessageBoxView : Window
    {
        public PopupMessageBoxView(string Text, bool isError) : base()
        {
            InitializeComponent();
            this.Title.Text = Text;
            if (isError)
            {
                iicon.Kind = MahApps.Metro.IconPacks.PackIconMaterialKind.CloseThick;
                iicon.Foreground = Brushes.PaleVioletRed;
            }

            this.Closed += this.NotificationWindowClosed;
        }

        public new void Show()
        {
            this.Topmost = true;
            base.Show();

            if(App.MainWindow?.IsLoaded == true)
                 this.Owner = App.MainWindow;
            this.Closed += this.NotificationWindowClosed;
            var workingArea = Screen.PrimaryScreen.WorkingArea;

            this.Left = workingArea.Right - this.ActualWidth;
            double top = workingArea.Bottom - this.ActualHeight;

            foreach (Window window in System.Windows.Application.Current.Windows)
            {
                string windowName = window.GetType().Name;

                if (windowName.Equals("NotificationWindow") && window != this)
                {
                    window.Topmost = true;
                    top = window.Top - window.ActualHeight;
                }
            }

            this.Top = top;
        }
        private void ImageMouseUp(object sender,
            System.Windows.Input.MouseButtonEventArgs e)
        {
            this.Close();
        }

        private void DoubleAnimationCompleted(object sender, EventArgs e)
        {
            if (!this.IsMouseOver)
            {
                this.Close();
            }
        }

        private void NotificationWindowClosed(object sender, EventArgs e)
        {
            foreach (Window window in System.Windows.Application.Current.Windows)
            {
                string windowName = window.GetType().Name;

                if (windowName.Equals("NotificationWindow") && window != this)
                {
                    // Adjust any windows that were above this one to drop down
                    if (window.Top < this.Top)
                    {
                        window.Top = window.Top + this.ActualHeight;
                    }
                }
            }
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }
    }
}
