using Steam_Account_Manager.Infrastructure;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class Message
    {
        public string Sender { get; set; }
        public string Recipient { get;  set; }
    }
    internal class MessagesViewModel : ObservableObject
    {
        public ObservableCollection<Message> messages { get; set; }
        public MessagesViewModel()
        {
            messages = new ObservableCollection<Message>();
            messages.Add(new Message
            {
                Sender = "Hello from c#",
                Recipient = ""
            });
            OnPropertyChanged(nameof(messages));
        }
    }
}
