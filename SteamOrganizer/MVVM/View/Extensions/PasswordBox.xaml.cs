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

namespace SteamOrganizer.MVVM.View.Extensions
{
    public partial class PasswordBox : Border
    {
        private string SavedPassword;

        public static readonly DependencyProperty TextProperty =
            DependencyProperty.Register("Text", typeof(string), typeof(PasswordBox));

        public static readonly DependencyProperty ForegroundProperty =
            DependencyProperty.Register("Foreground", typeof(Brush), typeof(PasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.Gray)));

        public static readonly DependencyProperty IsTextHiddenProperty =
                   DependencyProperty.Register("IsTextHidden", typeof(bool), typeof(PasswordBox), new FrameworkPropertyMetadata(false, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, new PropertyChangedCallback(OnPropertyChanged)));

        public string Text
        {
            get => (string)GetValue(TextProperty);
            set => SetValue(TextProperty, value);
        }

        public Brush Foreground
        {
            get => (Brush)GetValue(ForegroundProperty);
            set => SetValue(ForegroundProperty, value);
        }

        public bool IsTextHidden
        {
            get => (bool)GetValue(IsTextHiddenProperty);
            set => SetValue(IsTextHiddenProperty, value);
        }

        

        private static void OnPropertyChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
        {
            var bindablePasswordBox = (PasswordBox)sender;
            bindablePasswordBox.Text = bindablePasswordBox.Text;
        }

        public PasswordBox()
        {
            InitializeComponent();
            PassBox.DataContext = this;
            PassBox.TextChanged += PassBox_TextChanged;
        }

        private StringBuilder GlyphBuilder = new StringBuilder();
        private void PassBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            var textbox = sender as TextBox;
            SavedPassword = textbox.Text;

            if(IsTextHidden && textbox.Text != null)
            {
                GlyphBuilder.Clear();
                for (int i = 0; i < textbox.Text.Length; i++)
                {
                    GlyphBuilder.Append("●");
                }

                PassBox.TextChanged -= PassBox_TextChanged;
                textbox.Text = GlyphBuilder.ToString();
                textbox.CaretIndex = textbox.Text.Length;
                PassBox.TextChanged += PassBox_TextChanged;
            }
        }
    }
}
