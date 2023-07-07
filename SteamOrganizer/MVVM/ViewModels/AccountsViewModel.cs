using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.MVVM.Core;
using System.Collections.ObjectModel;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class AccountsViewModel : ObservableObject
    {
        public ObservableCollection<Account> Accounts { get; set; } = new ObservableCollection<Account>();

        public AccountsViewModel()
        {
            for (int i = 0; i < 8; i++)
            {
                Accounts.Add(new Account() { Name = i.ToString() });
            }
            
        }
    }
}
