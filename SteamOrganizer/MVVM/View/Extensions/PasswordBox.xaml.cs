using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class PasswordBox : Border
    {
        public static readonly DependencyProperty ForegroundProperty =
            DependencyProperty.Register("Foreground", typeof(Brush), typeof(PasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.Gray)));

        public static readonly DependencyProperty SelectionBrushProperty =
          DependencyProperty.Register("SelectionBrush", typeof(Brush), typeof(PasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.White)));

        public static readonly DependencyProperty IsPaswordShownProperty =
         DependencyProperty.Register("IsPasswordShown", typeof(bool), typeof(PasswordBox), new FrameworkPropertyMetadata(false, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, new PropertyChangedCallback(OnPasswordStateChanged)));


        public string Password
        {
            get => PassBox.Password;
            set => PassTextBox.Text = PassBox.Password = value;
        }

        public Brush Foreground
        {
            get => (Brush)GetValue(ForegroundProperty);
            set => SetValue(ForegroundProperty, value);
        }

        public Brush SelectionBrush
        {
            get => (Brush)GetValue(SelectionBrushProperty);
            set => SetValue(SelectionBrushProperty, value);
        }


        public bool IsPasswordShown
        {
            get => (bool)GetValue(IsPaswordShownProperty);
            set => SetValue(IsPaswordShownProperty, value);
        }

        private static void OnPasswordStateChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            var passBox = (PasswordBox)d;
            if (passBox.IsPasswordShown)
            {
                passBox.PassTextBox.Visibility = Visibility.Visible;
                passBox.PassBox.Visibility     = Visibility.Collapsed;
            }
            else
            {
                passBox.PassTextBox.Visibility = Visibility.Collapsed;
                passBox.PassBox.Visibility     = Visibility.Visible;
            }
        }

        public PasswordBox()
        {
            InitializeComponent();
            Area.DataContext = this;

            PassBox.PasswordChanged += (sender, e) =>
            {
                this.PassTextBox.Text = PassBox.Password;
            };
        }

    }
}
