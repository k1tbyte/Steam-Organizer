using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace SteamOrganizer.MVVM.Converters
{
    internal class ToBooleanConverter : TemplateBooleanConverter<bool>
    {
        public ToBooleanConverter() :
            base(true, false)
        { }
    }
}
