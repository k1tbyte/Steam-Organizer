using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;

namespace Steam_Account_Manager.UIExtensions
{
    public partial class ModernPasswordBox : UserControl
    {
        private bool isPreventCallback;
        private RoutedEventHandler savedCallback;

        public static readonly DependencyProperty PasswordProperty =
            DependencyProperty.Register("Password",typeof(string),typeof(ModernPasswordBox),
                new FrameworkPropertyMetadata("", FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, new PropertyChangedCallback(OnPasswordPropertyChanged)));

        public static readonly DependencyProperty PasswordCharProperty =
            DependencyProperty.RegisterAttached("PasswordChar", typeof(char), typeof(char), new PropertyMetadata(default(char)));

        public static readonly DependencyProperty IconKeyColorProperty =
            DependencyProperty.Register("IconKeyColor", typeof(Brush), typeof(ModernPasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.White)));

        public static readonly DependencyProperty BorderColorProperty =
            DependencyProperty.Register("BorderColor", typeof(Brush), typeof(ModernPasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.Transparent)));

        public static readonly DependencyProperty CornerRadiusProperty =
            DependencyProperty.Register("CornerRadius", typeof(CornerRadius), typeof(ModernPasswordBox), new PropertyMetadata(new CornerRadius(8)));

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

            savedCallback = HandlePasswordChanged;
            passwordBox.PasswordChanged += savedCallback;

            var frameworkElement = Content as FrameworkElement;
            frameworkElement.DataContext = this;
        }

        private static void OnPasswordPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs eventArgs)
        {
            ModernPasswordBox bindablePasswordBox = (ModernPasswordBox)d;
            PasswordBox passwordBox = (PasswordBox)bindablePasswordBox.passwordBox;

            if (bindablePasswordBox.isPreventCallback)
                return;
            
            passwordBox.PasswordChanged -= bindablePasswordBox.savedCallback;
            passwordBox.Password = (eventArgs.NewValue != null) ? eventArgs.NewValue.ToString() : "";
            passwordBox.PasswordChanged += bindablePasswordBox.savedCallback;
        }

        private void HandlePasswordChanged(object sender, RoutedEventArgs eventArgs)
        {
            PasswordBox passwordBox = (PasswordBox)sender;

            isPreventCallback = true;
            Password = passwordBox.Password;
            isPreventCallback = false;
        }
    }
}
