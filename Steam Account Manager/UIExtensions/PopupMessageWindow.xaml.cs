using System;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace Steam_Account_Manager.UIExtensions
{
    public partial class PopupMessageWindow : Window
    {
        public PopupMessageWindow(string Text, bool isError) : base()
        {
            InitializeComponent();
            this.Title.Text = Text;
            if (isError)
            {
                iicon.Kind = MahApps.Metro.IconPacks.PackIconMaterialKind.CloseThick;
                iicon.Foreground = Brushes.PaleVioletRed;
            }
        }

        public new void Show()
        {
            this.Topmost = true;
            base.Show();

            if(App.MainWindow?.IsLoaded == true)
                 this.Owner = App.MainWindow;
            var workingArea = Screen.PrimaryScreen.WorkingArea;

            this.Left = workingArea.Right - this.ActualWidth;
            double top = workingArea.Bottom - this.ActualHeight;

                foreach (Window window in System.Windows.Application.Current.Windows)
                {
                    string windowName = window.GetType().Name;

                    if (windowName.Equals("PopupMessageWindow") && window != this)
                    {
                        window.Topmost = true;
                        top = window.Top - this.ActualHeight;
                    }
                }
            
            this.Top = top -7;
        }

        private new void Close()
        {
            var anim = new ThicknessAnimation(new Thickness(0), new Thickness(300, 0, 0, 0), new Duration(TimeSpan.FromSeconds(1)))
            {
                EasingFunction = new CircleEase { EasingMode = EasingMode.EaseInOut },
            };

            anim.Completed += (obj, ee) =>
            {
                foreach (Window window in System.Windows.Application.Current.Windows)
                {
                    string windowName = window.GetType().Name;

                    if (windowName.Equals("PopupMessageWindow") && window != this)
                    {
                        // Drop down
                        if (window.Top < this.Top)
                        {
                            var dropAnim = new DoubleAnimation(window.Top, window.Top + this.ActualHeight, new Duration(TimeSpan.FromSeconds(0.6)))
                            {
                                EasingFunction = new CircleEase { EasingMode = EasingMode.EaseInOut }
                            };

                            (window as PopupMessageWindow).BeginAnimation(TopProperty, dropAnim);
                        }
                    }
                }

                base.Close();
            };

            mainArea.BeginAnimation(MarginProperty, anim);
        }

        private void NotificationWindowClosed(object sender, EventArgs e)
        {
            if (!this.IsMouseOver)
                Close();
        }

        private void Button_Click(object sender, RoutedEventArgs e) => Close();
        
    }
}
