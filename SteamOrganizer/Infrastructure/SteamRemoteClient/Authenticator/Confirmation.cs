namespace SteamOrganizer.Infrastructure.SteamRemoteClient.Authenticator
{
    public class Confirmation
    {
        public ulong ID { get; set; }
        public ulong Key { get; set; }
        public ulong Creator { get; set; }
        public ConfirmationType Type { get; set; }
        public string ImageURL { get; set; }
        public string Nickname { get; set; }

        public Confirmation(ulong id, ulong key, int type, ulong creator, string imageURL, string nickname)
        {
            this.ID = id;
            this.Key = key;
            this.Creator = creator;
            ImageURL = imageURL;
            Nickname = nickname;

            switch (type)
            {
                case 1:
                    this.Type = ConfirmationType.GenericConfirmation;
                    break;
                case 2:
                    this.Type = ConfirmationType.Trade;
                    break;
                case 3:
                    this.Type = ConfirmationType.MarketSellTransaction;
                    break;
                default:
                    this.Type = ConfirmationType.Unknown;
                    break;
            }
        }

    }
    public enum ConfirmationType
    {
        GenericConfirmation,
        Trade,
        MarketSellTransaction,
        Unknown
    }
}
