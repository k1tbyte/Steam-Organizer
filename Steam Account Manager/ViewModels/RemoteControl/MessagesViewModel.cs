using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using Steam_Account_Manager.Infrastructure.JsonModels;
using Steam_Account_Manager.Infrastructure.Validators;
using System;
using System.Collections.ObjectModel;
using System.Windows.Media;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class Message
    {
        public string Msg { get; set; }
        public string Time { get; set; }
        public string Username { get; set; }
        public Brush MsgBrush { get; set; }
        public Brush TextBrush { get; set; }
    }
    internal class MessagesViewModel : ObservableObject
    {
        public RelayCommand SelectChatCommand { get; set; }
        public RelayCommand LeaveFromChatCommand { get; set; }
        public RelayCommand SendMessageCommand { get; set; }
        public RelayCommand AddAdminIdCommand { get; set; }
        private string TempID, TempAdminID;


        #region Properties
        private string _message;
        public string Message
        {
            get => _message;
            set
            {
                _message = value;
                OnPropertyChanged(nameof(Message));
            }
        }

        private string _errorMsg;
        public string ErrorMsg
        {
            get => _errorMsg;
            set
            {
                _errorMsg = value;
                OnPropertyChanged(nameof(ErrorMsg));
            }
        }

        private string _interlocutorId;
        public string InterlocutorId
        {
            get => _interlocutorId;
            set
            {
                _interlocutorId = value;
                OnPropertyChanged(nameof(InterlocutorId));

            }
        }


        #endregion

        #region Handlers
        private static ulong _selectedChatId;
        public static event EventHandler SelectedChatIdChanged;
        public static ulong SelectedChatId
        {
            get => _selectedChatId;
            set
            {
                _selectedChatId = value;
                SelectedChatIdChanged?.Invoke(null, EventArgs.Empty);
            }
            
        }

        private static bool _isAdminIdValid;
        public static event EventHandler IsAdminIdValidChanged;
        public static bool IsAdminIdValid
        {
            get => _isAdminIdValid;
            set
            {
                _isAdminIdValid = value;
                IsAdminIdValidChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static ObservableCollection<Message> _messages;
        public static event EventHandler MessagesChanged;
        public static ObservableCollection<Message> Messages
        {
            get => _messages;
            set
            {
                _messages = value;
                MessagesChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public static event EventHandler SaveChatLogChanged;
        public static bool SaveChatLog
        {
            get =>  SteamRemoteClient.CurrentUser.Messenger.SaveChatLog;
            set
            {
                SteamRemoteClient.CurrentUser.Messenger.SaveChatLog = value;
                SaveChatLogChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public static event EventHandler EnableCommandsChanged;
        public static bool EnableCommands
        {
            get => SteamRemoteClient.CurrentUser.Messenger.EnableCommands;
            set
            {
                SteamRemoteClient.CurrentUser.Messenger.EnableCommands = value;
                EnableCommandsChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static string _adminId;
        public static event EventHandler AdminIdChanged;
        public static string AdminId
        {
            get => _adminId;
            set
            {
                _adminId = value;
                AdminIdChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static ObservableCollection<Command> _msgCommands;
        public static event EventHandler MsgCommandsChanged;
        public static ObservableCollection<Command> MsgCommands
        {
            get => _msgCommands;
            set
            {
                _msgCommands = value;
                MsgCommandsChanged?.Invoke(null, EventArgs.Empty);
            }
        } 
        #endregion


        public static void InitDefaultCommands()
        {
            MsgCommands.Insert(0, new Command
            {
                Keyword = "/help",
                CommandExecution = "List of available commands",
                MessageAfterExecute = "-"
            });

            MsgCommands.Insert(1, new Command
            {
                Keyword = "/shutdown",
                CommandExecution = "Turns off the app",
                MessageAfterExecute = "App has been closed."
            });

            MsgCommands.Insert(2, new Command
            {
                Keyword = "/pcsleep",
                CommandExecution = "Sends the PC to sleep",
                MessageAfterExecute = "Sleeping mode..."
            });

            MsgCommands.Insert(3, new Command
            {
                Keyword = "/pcshutdown",
                CommandExecution = "Turns off the computer",
                MessageAfterExecute = "Shutting down..."
            });

            MsgCommands.Insert(4, new Command
            {
                Keyword = "/msg (ID) (Messange)",
                CommandExecution = "Sends a message to a friend",
                MessageAfterExecute = "-"
            });

            MsgCommands.Insert(5, new Command
            {
                Keyword = "/idle [GamesIds]",
                CommandExecution = "Launches games from the library",
                MessageAfterExecute = "Idling..."
            });

            MsgCommands.Insert(6, new Command
            {
                Keyword = "/customgame (Name)",
                CommandExecution = "Sets a custom title as a game",
                MessageAfterExecute = "Title setted"
            });

            MsgCommands.Insert(7, new Command
            {
                Keyword = "/stopgame",
                CommandExecution = "Stops game activity",
                MessageAfterExecute = "Game activity stopped."
            });

            MsgCommands.Insert(8, new Command
            {
                Keyword = "/state (mode)",
                CommandExecution = "Setting the profile state",
                MessageAfterExecute = "Game activity stopped."
            });
        }
        public MessagesViewModel()
        {
            Messages = new ObservableCollection<Message>();

            SelectChatCommand = new RelayCommand(o =>
            {
                if (!string.IsNullOrEmpty(ErrorMsg))
                    ErrorMsg = "";
                if (TempID != InterlocutorId)
                {
                    TempID = InterlocutorId;
                    SteamValidator steamValidator = new SteamValidator(InterlocutorId);
                    if (steamValidator.GetSteamLinkType() != SteamValidator.SteamLinkTypes.ErrorType)
                    {
                        SteamRemoteClient.InterlocutorID = SelectedChatId = steamValidator.GetSteamId64Long;
                        InterlocutorId = "";
                        if (Messages.Count != 0)
                            Messages.Clear();
                    }
                    else
                    {
                        ErrorMsg = "Invalid ID";
                    }
                }
              
            });

            LeaveFromChatCommand = new RelayCommand(o =>
            {
                SelectedChatId = 0;
                TempID = "";
                if (Messages.Count != 0)
                    Messages.Clear();
            });

            SendMessageCommand = new RelayCommand(o =>
            {
                if (!String.IsNullOrEmpty(Message))
                {
                    SteamRemoteClient.SendInterlocutorMessage(Message);
                    Message = "";
                }
            });

            AddAdminIdCommand = new RelayCommand(o =>
            {
                if (!string.IsNullOrEmpty(ErrorMsg))
                    ErrorMsg = "";
                if(TempAdminID != AdminId)
                {
                    TempAdminID = AdminId;
                    SteamValidator steamValidator = new SteamValidator(TempAdminID);
                    if (steamValidator.GetSteamLinkType() != SteamValidator.SteamLinkTypes.ErrorType)
                    {
                        SteamRemoteClient.CurrentUser.Messenger.AdminID = steamValidator.SteamId32;
                        IsAdminIdValid = true;
                    }
                    else
                    {
                        ErrorMsg = "Invalid ID";
                        IsAdminIdValid = false;
                    }
                }
            });
        }
    }
}
