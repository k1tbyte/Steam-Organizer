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
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace Steam_Account_Manager.Themes
{
    public partial class MainPasswordBox : UserControl
    {
        private bool _isPasswordChanging;

        public static readonly DependencyProperty PasswordProperty =
            DependencyProperty.Register("Password", typeof(string), typeof(MainPasswordBox),
                new FrameworkPropertyMetadata(string.Empty, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault,
                    PasswordPropertyChanged, null, false, UpdateSourceTrigger.PropertyChanged));

        public static readonly DependencyProperty PasswordCharProperty =
        DependencyProperty.RegisterAttached("PasswordChar", typeof(char), typeof(char) , new PropertyMetadata(default(char)));

        private static void PasswordPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is MainPasswordBox passwordBox)
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

        public MainPasswordBox()
        {
            InitializeComponent();
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
