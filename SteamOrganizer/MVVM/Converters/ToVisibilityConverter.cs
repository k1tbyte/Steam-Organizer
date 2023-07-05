using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace SteamOrganizer.MVVM.Converters
{
    internal sealed class ToVisibilityConverter : TemplateBooleanConverter<Visibility>
    {
        public ToVisibilityConverter() :
            base(Visibility.Visible, Visibility.Collapsed)
        { }
    }

    internal sealed class ToVisibilityInvertedConverter : TemplateBooleanConverter<Visibility>
    {
        public ToVisibilityInvertedConverter() :
            base(Visibility.Collapsed, Visibility.Visible)
        { } 
    }
}
