using System;
using System.Windows.Data;

namespace Steam_Account_Manager.Infrastructure.Converters
{
    internal class MsgViewToBool : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter,
           System.Globalization.CultureInfo culture)
        {
            if (value is MVVM.View.RemoteControl.Controls.MessagesView)
            {
                return true;
            }
            return false;
        }

        public object ConvertBack(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            if (value is MVVM.View.RemoteControl.Controls.MessagesView)
            {
                return true;
            }
            return false;
        }
    }
}
