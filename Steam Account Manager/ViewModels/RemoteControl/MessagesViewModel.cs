using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
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
        private string TempID;

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

        private uint _chatId;
        public uint ChatId
        {
            get => _chatId;
            set
            {
                _chatId = value;
                OnPropertyChanged(nameof(ChatId));
            }
        }

        private bool _isChatSelected;
        public bool IsChatSelected
        {
            get => _isChatSelected;
            set
            {
                _isChatSelected = value;
                OnPropertyChanged(nameof(IsChatSelected));
            }
        } 
        #endregion

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

        public MessagesViewModel()
        {
            Messages = new ObservableCollection<Message>();

            SelectChatCommand = new RelayCommand(o =>
            {
                if (!string.IsNullOrEmpty(ErrorMsg))
                    ErrorMsg = "";
                if (!String.IsNullOrEmpty(InterlocutorId) && TempID != InterlocutorId)
                {
                    TempID = InterlocutorId;
                    SteamValidator steamValidator = new SteamValidator(InterlocutorId);
                    if (steamValidator.GetSteamLinkType() != SteamValidator.SteamLinkTypes.ErrorType)
                    {
                        ChatId = steamValidator.SteamId32;
                        SteamRemoteClient.InterlocutorID = SteamRemoteClient.FindFriendFromSteamID(ChatId);
                        IsChatSelected = true;
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
                IsChatSelected = false;
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
        }
    }
}
