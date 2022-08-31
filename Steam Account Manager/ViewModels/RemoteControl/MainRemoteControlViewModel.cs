using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.ViewModels.RemoteControl.View;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class MainRemoteControlViewModel : ObservableObject
    {
        public RelayCommand LoginViewCommand { get; set; }
        public RelayCommand GamesViewCommand { get; set; }
        public RelayCommand MessagesViewCommand { get; set; }
        public RelayCommand FriendsViewCommand { get; set; }

        public LoginView LoginV;
        public GamesView GamesV;
        public FriendsView FriendsV;
        public MessagesView MessagesV;

        private object _currentView;
        public object CurrentView
        {
            get { return _currentView; }
            set
            {
                _currentView = value;
                OnPropertyChanged();
            }
        }

        public MainRemoteControlViewModel()
        {
            LoginV = new LoginView();
            GamesV = new GamesView();
            FriendsV = new FriendsView();
            MessagesV = new MessagesView();

            CurrentView = LoginV;

            LoginViewCommand = new RelayCommand(o =>
            {
                CurrentView = LoginV;
            });

            GamesViewCommand = new RelayCommand(o =>
            {
                CurrentView = GamesV;
            });

            MessagesViewCommand = new RelayCommand(o =>
            {
                CurrentView = MessagesV;
            });

            FriendsViewCommand = new RelayCommand(o =>
            {
                CurrentView = FriendsV;
            });
        }
    }
}
