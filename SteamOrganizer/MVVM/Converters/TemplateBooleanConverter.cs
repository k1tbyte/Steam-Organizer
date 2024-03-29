﻿using System;
using System.Collections.Generic;
using System.Globalization;
using System.Windows.Data;

namespace SteamOrganizer.MVVM.Converters
{
    internal class TemplateBooleanConverter<T> : IValueConverter
    {
        public TemplateBooleanConverter(T trueValue, T falseValue)
        {
            True = trueValue;
            False = falseValue;
        }

        public T True { get; set; }
        public T False { get; set; }

        public virtual object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is null)
                return False;

            if (value is bool booleanValue)
            {
                return booleanValue ? True : False;
            }

            if(value is int intValue)
            {
                if(parameter is null)
                    return intValue == 0 ? False : True;

                if(parameter is int param)
                    return intValue > param ? True : False;
            }
                

            //Because object not null
            return True;
        }

        public virtual object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            return value is T t && EqualityComparer<T>.Default.Equals(t, True);
        }
    }
}
