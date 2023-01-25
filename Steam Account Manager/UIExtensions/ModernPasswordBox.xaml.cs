using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;

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

        private static void PasswordPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is ModernPasswordBox passwordBox)
            {
                passwordBox.UpdatePassword();
            }
        }


        public char PasswordChar
        {
            get
            {
                return (char)GetValue(PasswordCharProperty);
            }
            set
            {
                SetValue(PasswordCharProperty, value);
                passwordBox.PasswordChar = value;
            }
        }

        public string Password
        {
            get { return (string)GetValue(PasswordProperty); }
            set { SetValue(PasswordProperty, value); }
        }

        public ModernPasswordBox() => InitializeComponent();

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
