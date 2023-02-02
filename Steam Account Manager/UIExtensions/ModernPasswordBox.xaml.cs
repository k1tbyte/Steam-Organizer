using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;

namespace Steam_Account_Manager.UIExtensions
{
    public partial class ModernPasswordBox : UserControl
    {
        private bool _isPasswordChanging;

        public static readonly DependencyProperty PasswordProperty =
            DependencyProperty.Register("Password", typeof(string), typeof(ModernPasswordBox),
                new FrameworkPropertyMetadata(string.Empty, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault,
                    PasswordPropertyChanged, null, false, UpdateSourceTrigger.PropertyChanged));

        public static readonly DependencyProperty PasswordCharProperty =
            DependencyProperty.RegisterAttached("PasswordChar", typeof(char), typeof(char), new PropertyMetadata(default(char)));

        public static readonly DependencyProperty IconKeyColorProperty =
            DependencyProperty.Register("IconKeyColor", typeof(Brush), typeof(ModernPasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.White)));

        public static readonly DependencyProperty BorderColorProperty =
            DependencyProperty.Register("BorderColor", typeof(Brush), typeof(ModernPasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.Transparent)));

        public static readonly DependencyProperty CornerRadiusProperty =
            DependencyProperty.Register("CornerRadius", typeof(CornerRadius), typeof(ModernPasswordBox), new PropertyMetadata(new CornerRadius(8)));

        private static void PasswordPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is ModernPasswordBox passwordBox)
            {
                passwordBox.UpdatePassword();
            }
        }

        public CornerRadius CornerRadius
        {
            get => (CornerRadius)GetValue(CornerRadiusProperty);
            set { SetValue(CornerRadiusProperty, value); }
        }

        public Brush IconKeyColor
        {
            get => (Brush)GetValue(IconKeyColorProperty);
            set { SetValue(IconKeyColorProperty, value); }
        }

        public Brush BorderColor
        {
            get => (Brush)GetValue(BorderColorProperty);
            set { SetValue(BorderColorProperty, value); }
        }

        public char PasswordChar
        {
            get => (char)GetValue(PasswordCharProperty);
            set
            {
                SetValue(PasswordCharProperty, value);
                passwordBox.PasswordChar = value;
            }
        }

        public string Password
        {
            get => (string)GetValue(PasswordProperty); 
            set { SetValue(PasswordProperty, value); }
        }

        public ModernPasswordBox()
        {
            InitializeComponent();
            var frameworkElement = Content as FrameworkElement;
            if (frameworkElement != null)
                frameworkElement.DataContext = this;
        }

        private void PasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
        {
            _isPasswordChanging = true;
            Password = passwordBox.Password;
            _isPasswordChanging = false;
        }

        private void UpdatePassword()
        {
            if (!_isPasswordChanging)
            {
                passwordBox.Password = Password;
            }
        }
    }
}
