namespace SteamOrganizer.MVVM.Converters
{
    internal sealed class ToBooleanConverter : TemplateBooleanConverter<bool>
    {
        public ToBooleanConverter() :
            base(true, false)
        { }
    }
}
