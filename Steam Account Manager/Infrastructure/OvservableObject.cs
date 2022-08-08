using Steam_Account_Manager.ViewModels;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;

namespace Steam_Account_Manager.Infrastructure
{
    internal class ObservableObject : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler PropertyChanged;
        private static PropertyChangedEventHandler _staticPropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string name = null)
        {
            AccountsViewModel.ConfirmBanner = false;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }

        protected virtual bool Set<T>(ref T field, T value, [CallerMemberName] string propertyName = null)
        {
            if (Equals(field, value)) return false;
            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }

        protected static void OnStaticPropertyChanged(string pname)
        {
            var e = new PropertyChangedEventArgs(pname);
            var h = _staticPropertyChanged;
            if (h != null)
                h(null, e);
        }

        protected static void ShowDialogWindow(Window window)
        {
            window.Owner = Application.Current.MainWindow;
            window.WindowStartupLocation = WindowStartupLocation.CenterOwner;
            window.ShowDialog();
        }

        protected static void ExecuteWindow(object obj)
        {
            var win = obj as Window;
            win.Close();
        }
    }
}