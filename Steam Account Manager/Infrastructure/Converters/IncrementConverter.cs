using System;
using System.Globalization;
using System.Windows.Data;

namespace Steam_Account_Manager.Infrastructure.Converters
{
    internal class IncrementConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture) => (int)value+1;
        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => throw new NotSupportedException();
    }
}
