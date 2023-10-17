using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public partial class SegmentedTextBox : UserControl
    {
        public Action OnFieldsFilled;
        public char[] Segments { get; set; }
        public bool IsCharsHidden { get; set; }
        public int SegmentsCount
        {
            get => Segments.Length;
            set => Items.ItemsSource = Segments = new char[value];
        }

        public string Text => string.Join("",Segments);

        public SegmentedTextBox()
        {
            InitializeComponent();
            Items.DataContext = this;
        }

        internal TextBox GetTextBoxSegment(int index)
        {
            var container = (Items.ItemContainerGenerator.ContainerFromIndex(index) as ContentPresenter);
            return VisualTreeHelper.GetChild(container, 0) as TextBox;
        }

        internal void Unset()
        {
            Segments = new char[Segments.Length];
            for (int i = 0; i < Segments.Length; i++)
            {
                var segment  = GetTextBoxSegment(i);
                segment.Text = null;
            }
        }

        private void TextBox_PreviewTextInput(object sender, TextCompositionEventArgs e)
        {
            var range = (int)e.Text[0];

            var text = range >= 97 ? ((char)(range - 32)).ToString() : e.Text;
            var index = Items.ItemContainerGenerator.IndexFromContainer((sender as FrameworkElement).TemplatedParent);
            Segments[index] =  text[0];

            (sender as TextBox).Text = IsCharsHidden ? "⬤" : text;

            if (Segments.All(o => o != '\0'))
            {
                OnFieldsFilled?.Invoke();
            }
            else if(index != Segments.Length - 1)
            {
                GetTextBoxSegment(++index).Focus();
            }
            e.Handled = true;
        }

        private void TextBox_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            // Whitelist keys (if e.handled != true:  TextBox_PreviewTextInput will be called after return from here)
            if ((e.Key >= Key.D0 && e.Key <= Key.D9) || (e.Key >= Key.A && e.Key <= Key.Z) || (e.Key >= Key.NumPad0 && e.Key <= Key.NumPad9))
            {
                return;
            }

            // Navigation
            var index = Items.ItemContainerGenerator.IndexFromContainer((sender as FrameworkElement).TemplatedParent);
            if (e.Key == Key.Tab || e.Key == Key.Right)
            {
                GetTextBoxSegment(index == Segments.Length - 1 ? 0 : ++index).Focus();
            }
            else if(e.Key == Key.Left)
            {
                GetTextBoxSegment(index == 0 ? Segments.Length - 1 : --index).Focus();
            }

            // Ignore other keys
            e.Handled = true;
        }
    }
}
