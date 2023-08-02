using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public partial class SegmentedTextBox : UserControl
    {
        public sealed class TextBoxSegment
        {
            public string Text { get; set; }
        }

        public TextBoxSegment[] Segments { get; private set; }

        public int SegmentsCount
        {
            get => Segments.Length;
            set => Segments = new TextBoxSegment[value];
        }

        public string Text => string.Join(string.Empty, Segments.Select(o => o.Text));

        public SegmentedTextBox()
        {
            InitializeComponent();
            Items.DataContext = this;
        }

        private void FocusContainer(int index)
        {
            var container = (Items.ItemContainerGenerator.ContainerFromIndex(index) as ContentPresenter);
            var child = VisualTreeHelper.GetChild(container, 0) as TextBox;
            child.Focus();
        }

        private void TextBox_PreviewTextInput(object sender, TextCompositionEventArgs e)
        {
            var range = (int)e.Text[0];

            if ((range > 47 && range < 58) || (range > 64 && range < 91) || (range > 96 && range < 123))
            {
                (sender as TextBox).Text       = range >= 97 ? ((char)(range - 32)).ToString() : e.Text;
                var index = Items.ItemContainerGenerator.IndexFromContainer((sender as FrameworkElement).TemplatedParent);
                
                if(index != Segments.Length - 1)
                {
                    FocusContainer(++index);
                }
            }
           
            e.Handled = true;
        }

        private void TextBox_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if ((e.Key >= Key.D0 && e.Key <= Key.D9) || (e.Key >= Key.A && e.Key <= Key.Z) || (e.Key >= Key.NumPad0 && e.Key <= Key.NumPad9))
            {
                return;
            }

            var index = Items.ItemContainerGenerator.IndexFromContainer((sender as FrameworkElement).TemplatedParent);
            if (e.Key == Key.Tab || e.Key == Key.Right)
            {
                FocusContainer(index == Segments.Length - 1 ? 0 : ++index);
            }
            else if(e.Key == Key.Left)
            {
                FocusContainer(index == 0 ? Segments.Length - 1 : --index);
            }

            e.Handled = true;
        }
    }
}
