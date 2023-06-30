using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class HoverButton : Button
    {
        private Brush tempBrush;
        public Brush HoverBackground
        {
            get { return (Brush)GetValue(HoverBackgroundProperty); }
            set { SetValue(HoverBackgroundProperty, value); }
        }
        public static readonly DependencyProperty HoverBackgroundProperty = DependencyProperty.Register(
          "HoverBackground", typeof(Brush), typeof(HoverButton), new PropertyMetadata(Brushes.White));

        public HoverButton()
        {
            InitializeComponent();
            MouseEnter += (o, sender) => { tempBrush = Foreground; Foreground = HoverBackground; };
            MouseLeave += (o, sender) => Foreground = tempBrush;
        }
    }
}
