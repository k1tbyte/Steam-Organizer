using SteamOrganizer.MVVM.Core;
using SteamOrganizer.Storages;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class SettingsViewModel : ObservableObject
    {
         public GlobalStorage Config => App.Config;
    }
}
