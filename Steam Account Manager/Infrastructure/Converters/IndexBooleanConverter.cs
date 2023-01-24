using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace Steam_Account_Manager.Infrastructure.Converters
{
    internal class IndexByteBooleanConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value == null || parameter == null)
                return false;
            else
                return (byte)value == System.Convert.ToByte(parameter);
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value == null || parameter == null)
                return null;
            else if ((bool)value)
                return System.Convert.ToByte(parameter);
            else
                return DependencyProperty.UnsetValue;
        }
    }
}
