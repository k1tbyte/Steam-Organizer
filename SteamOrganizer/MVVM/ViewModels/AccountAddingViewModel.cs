using SteamOrganizer.MVVM.Core;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountAddingViewModel : ObservableObject
    {
        public RelayCommand AddCommand { get; private set; }
            
        public string Login { get; set; }
        public string Password { get; set; }
        public string ID { get; set; }

        private void OnAdding(object param)
        {
        }

        public AccountAddingViewModel()
        {
            AddCommand = new RelayCommand(OnAdding);
        }
    }
}
