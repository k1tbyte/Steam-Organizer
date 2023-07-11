using MahApps.Metro.IconPacks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public partial class TemplateDecorator : DockPanel
    {
        public static readonly DependencyProperty TitleProperty =
            DependencyProperty.Register("Title", typeof(string), typeof(TemplateDecorator));
        public PackIconMaterialKind Icon
        {
            get => ico.Kind;
            set => ico.Kind = value;
        }

        public string Title
        {
            get => (string)GetValue(TitleProperty);
            set => SetValue(TitleProperty, value);
        }

        public TemplateDecorator()
        {
            InitializeComponent();
            title.DataContext = this;
        }
    }
}
