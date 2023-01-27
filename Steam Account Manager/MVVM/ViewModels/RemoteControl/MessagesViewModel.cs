using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.Infrastructure.Validators;
using Steam_Account_Manager.MVVM.Core;
using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Media;

namespace Steam_Account_Manager.MVVM.ViewModels.RemoteControl
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
        public AsyncRelayCommand AddAdminIdCommand { get; set; }
        public RelayCommand DeleteMsgCommand { get; set; }
        private string TempID, TempAdminID;


        #region Properties

        private string _message;
        public string Message
        {
            get => _message;
            set => SetProperty(ref _message, value);
        }

        private string _errorMsg;
        public string ErrorMsg
        {
            get => _errorMsg;
            set => SetProperty(ref _errorMsg, value);
        }

        private string _interlocutorId;
        public string InterlocutorId
        {
            get => _interlocutorId;
            set => SetProperty(ref _interlocutorId, value);
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
            get => SteamRemoteClient.CurrentUser.Messenger.SaveChatLog;
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
                    var steamValidator = new SteamLinkValidator(InterlocutorId);
                    if (steamValidator.SteamLinkType != SteamLinkValidator.SteamLinkTypes.ErrorType)
                    {
                        SteamRemoteClient.InterlocutorID = SelectedChatId = steamValidator.SteamId64Ulong;
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

            AddAdminIdCommand = new AsyncRelayCommand(async (o) =>
            {
                if (!string.IsNullOrEmpty(ErrorMsg))
                    ErrorMsg = "";
                await Task.Factory.StartNew(() =>
                {
                    if (TempAdminID != AdminId)
                    {
                        TempAdminID = AdminId;
                        var steamValidator = new SteamLinkValidator(TempAdminID);
                        if (steamValidator.SteamLinkType != SteamLinkValidator.SteamLinkTypes.ErrorType)
                        {
                            SteamRemoteClient.CurrentUser.Messenger.AdminID = steamValidator.SteamId32;
                            IsAdminIdValid = true;
                            App.Current.Dispatcher.Invoke(() => { Utils.Presentation.ShakingAnimation(o as System.Windows.FrameworkElement, true); });

                        }
                        else
                        {
                            ErrorMsg = "Invalid ID";
                            IsAdminIdValid = false;
                        }
                    }
                });


            });

            DeleteMsgCommand = new RelayCommand(o =>
            {
                if(o is Command command)
                {
                    MsgCommands.Remove(command);
                    SteamRemoteClient.CurrentUser.Messenger.Commands.Remove(command);
                }
            });
        }
    }
}
