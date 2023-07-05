using MahApps.Metro.IconPacks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SteamOrganizer.MVVM.Models
{
    internal sealed class Notification
    {
        public string Message { get; set; }
        public Action OnClickAction { get; set; }
        public PackIconMaterialKind Icon { get; set; }
    }
}
