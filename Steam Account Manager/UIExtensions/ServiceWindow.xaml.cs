using System.Windows;
using System.Windows.Input;

namespace Steam_Account_Manager.UIExtensions
{
    public partial class ServiceWindow : Window
    {
        public string InnerText
        {
            set => InnerTextBlock.Text = value;
        }

        public string AppendTitleText
        {
            set => Title.Text += " " + value;
        }

        public ServiceWindow(bool update = false)
        {
            InitializeComponent();

            if (update)
            {
                ErorIcon.Visibility = Visibility.Collapsed;
                UpdateIcon.Visibility = Visibility.Visible;
                Title.Text = App.FindString("mv_newUpdate");
            }
            else
            {
                Title.Text = App.FindString("mv_runtimeError");
                AlternativeButton.Visibility = Visibility.Collapsed;
            }
            AlternativeButton.Click += (sender, e) => DialogResult = true;
        }

        private void Button_Click(object sender, RoutedEventArgs e)                    => DialogResult = false;
        private void Copy_Click(object sender, RoutedEventArgs e)                      => Utils.Win32.Clipboard.SetText(InnerTextBlock.Text);
        private void Border_MouseLeftButtonDown(object sender, MouseButtonEventArgs e) => this.DragMove();
        
    }
}
