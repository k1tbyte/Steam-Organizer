using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using System.Windows;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class AccountPageViewModel : ObservableObject
    {
        public bool Test { get; set; } = false;
        public Visibility AdditionalControlsVis { get; }

        public Account CurrentAccount { get; }

        public AccountPageViewModel(Account account)
        {
                this.CurrentAccount = account;
            AdditionalControlsVis = account.AccountID == null ? Visibility.Collapsed : Visibility.Visible;
        }
    }
}
