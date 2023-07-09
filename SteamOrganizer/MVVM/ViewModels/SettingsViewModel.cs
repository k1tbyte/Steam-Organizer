using SteamOrganizer.MVVM.Core;
using SteamOrganizer.Storages;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class SettingsViewModel : ObservableObject
    {
         public GlobalStorage Config => App.Config;
    }
}
