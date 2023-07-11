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

        public static readonly DependencyProperty PasswordProperty =
            DependencyProperty.Register("Password", typeof(string), typeof(PasswordBox), new FrameworkPropertyMetadata(null,FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, new PropertyChangedCallback(OnPasswordPropertyChanged)));

        private static bool AllowCallback = true;
        public string Password
        {
            get => (string)GetValue(PasswordProperty);
            set => SetValue(PasswordProperty, value);
            
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

        public void Clear()
        {
            PassBox.Clear();
            PassTextBox.Clear();
        }

        private static void OnPasswordStateChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            var passBox = (PasswordBox)d;

            
            if(e.NewValue is bool show)
            {
                if (show)
                {
                    passBox.PassTextBox.Visibility = Visibility.Visible;
                    passBox.PassBox.Visibility = Visibility.Collapsed;
                }
                else
                {
                    passBox.PassTextBox.Visibility = Visibility.Collapsed;
                    passBox.PassBox.Visibility = Visibility.Visible;
                }
            }
        }

        private static void OnPasswordPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            var passBox = d as PasswordBox;

            if (!AllowCallback)
                return;

            AllowCallback = false;
            passBox.PassBox.Password = e.NewValue as string;
            AllowCallback = true;
            return;
        }

        public PasswordBox()
        {
            InitializeComponent();
            Area.DataContext = this;

            PassBox.PasswordChanged += (sender,e) =>
            {
                if (!AllowCallback)
                    return;

                AllowCallback = false;
                Password = PassBox.Password;
                AllowCallback = true;
            };
        }

    }
}
