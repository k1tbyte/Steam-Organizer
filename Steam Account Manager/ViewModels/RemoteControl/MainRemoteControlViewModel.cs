using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;
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
            FriendsV = new FriendsView();
            MessagesV = new MessagesView();
            GamesV = new GamesView();

            CurrentView = GamesV;

            LoginViewCommand = new RelayCommand(o =>
            {
                 CurrentView = LoginV;
            });

            GamesViewCommand = new RelayCommand(o =>
            {
                if (LoginViewModel.SuccessLogOn)
                {
                    if (GamesV == null)
                        GamesV = new GamesView();
                    CurrentView = GamesV;
                }
                else
                    (o as RadioButton).IsChecked = true;
            });

            MessagesViewCommand = new RelayCommand(o =>
            {
                if (LoginViewModel.SuccessLogOn)
                    CurrentView = MessagesV;
                else
                    (o as RadioButton).IsChecked = true;
            });

            FriendsViewCommand = new RelayCommand(o =>
            {
                if (LoginViewModel.SuccessLogOn)
                    CurrentView = FriendsV;
                else
                   (o as RadioButton).IsChecked = true;
                
            });
        }
    }
}
