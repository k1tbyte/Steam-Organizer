using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Steam_Account_Manager.Infrastructure;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class MainRemoteControlViewModel : ObservableObject
    {
        public RelayCommand test { get; set; }
        public MainRemoteControlViewModel()
        {
            test = new RelayCommand(o =>
            {
                App.Current.Shutdown();
            });

        }
    }
}
