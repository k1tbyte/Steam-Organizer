﻿using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace Steam_Account_Manager.MVVM.Core
{
    internal class ObservableObject : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string name = null)
        {
            AccountsViewModel.ConfirmBanner = false;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }

        protected virtual bool SetProperty<T>(ref T field, T value, [CallerMemberName] string propertyName = null)
        {
            if (Equals(field, value)) return false;
            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }
    }
}