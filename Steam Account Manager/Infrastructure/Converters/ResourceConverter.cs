using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Data;

namespace Steam_Account_Manager.Infrastructure.Converters
{
    internal class ResourceConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if(parameter != null)
                return App.Current.FindResource(parameter) + " " + value;
            else if(value != null && (value as string).Length > 645)
                return (value as string).Remove(645, (value as string).Length - 645) + " ...";
            
            return value;
        }
        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => throw new NotSupportedException();
    }
}
