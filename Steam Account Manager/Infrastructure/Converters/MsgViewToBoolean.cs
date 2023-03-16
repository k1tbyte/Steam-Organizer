using System;
using System.Windows.Data;

namespace Steam_Account_Manager.Infrastructure.Converters
{
    internal class MsgViewToBoolean : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter,
           System.Globalization.CultureInfo culture)
        {
          /*  if (value is MVVM.View.Controls.MessagesView)
            {
                return true; NEED TO FIX
            }*/
            return false;
        }

        public object ConvertBack(object value, Type targetType, object parameter,
            System.Globalization.CultureInfo culture)
        {
            /*            if (value is MVVM.View.Controls.MessagesView)
                        {
                            return true; NEED TO FIX
                        }*/
            return false;
        }
    }
}
