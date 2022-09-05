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

        private bool _isLoggedIn;
        public bool IsLoggedIn
        {
            get => _isLoggedIn;
            set
            {
                _isLoggedIn = value;
                OnPropertyChanged(nameof(IsLoggedIn));
            }
        }

        private object _currentView;
        public object CurrentView
        {
            get => _currentView; 
            set
            {
                _currentView = value;
                OnPropertyChanged();
            }
        }

        

        public MainRemoteControlViewModel()
        {
            LoginV = new LoginView();

            CurrentView = LoginV;

            LoginViewCommand = new RelayCommand(o =>
            {
                 CurrentView = LoginV;

                if (CurrentView != LoginV)
                    CurrentView = LoginV;
            });

            GamesViewCommand = new RelayCommand(o =>
            {
                if (IsLoggedIn = LoginViewModel.SuccessLogOn && CurrentView != GamesV)
                {
                    if (GamesV == null)
                        GamesV = new GamesView();

                    CurrentView = GamesV;
                }
            });

            MessagesViewCommand = new RelayCommand(o =>
            {
                if (IsLoggedIn = LoginViewModel.SuccessLogOn && CurrentView != MessagesV)
                {
                    if (MessagesV == null)
                        MessagesV = new MessagesView();

                    CurrentView = MessagesV;
                }
                    
            });

            FriendsViewCommand = new RelayCommand(o =>
            {
                if (IsLoggedIn = LoginViewModel.SuccessLogOn && CurrentView != FriendsV)
                {
                    if (FriendsV == null)
                        FriendsV = new FriendsView();

                    CurrentView = FriendsV;
                }
            });
        }
    }
}
