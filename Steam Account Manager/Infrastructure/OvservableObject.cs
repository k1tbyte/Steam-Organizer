using Steam_Account_Manager.ViewModels;
using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;

namespace Steam_Account_Manager.Infrastructure
{
    class ObservableObject : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler PropertyChanged;
        private static PropertyChangedEventHandler StaticPropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string name = null)
        {
            AccountsViewModel.ConfirmBanner = false;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }

        protected virtual bool Set<T>(ref T field, T value, [CallerMemberName] string PropertyName = null)
        {
            if (Equals(field, value)) return false;
            field = value;
            OnPropertyChanged(PropertyName);
            return true;
        }

        static protected void OnStaticPropertyChanged(string pname)
        {
            System.ComponentModel.PropertyChangedEventArgs e = new System.ComponentModel.PropertyChangedEventArgs(pname);
            System.ComponentModel.PropertyChangedEventHandler h = StaticPropertyChanged;
            if (h != null)
                h(null, e);

        }

        static protected void ShowDialogWindow(Window window)
        {
            window.Owner = Application.Current.MainWindow;
            window.WindowStartupLocation = WindowStartupLocation.CenterOwner;
            window.ShowDialog();

        }
        static protected void ExecuteWindow(object obj)
        {
            Window win = obj as Window;
            win.Close();
        }

        public event EventHandler ClosingRequest;

    }
}