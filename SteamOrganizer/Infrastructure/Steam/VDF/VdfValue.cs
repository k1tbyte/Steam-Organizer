using System.Collections.Generic;

namespace SteamOrganizer.Infrastructure.Parsers.Vdf
{
    public enum VdfValueType
    {
        Table,
        String,
        Integer,
        Decimal,
    }

    #region Types
    public sealed class VdfString : VdfValue
    {
        public VdfString(string name) : base(name)               => Type = VdfValueType.String;
        public VdfString(string name, string value) : this(name) => Content = value;
        public string Content { get; set; }
    }

    public sealed class VdfInteger : VdfValue
    {
        public VdfInteger(string name) : base(name)            => Type = VdfValueType.Integer;
        public VdfInteger(string name, int value) : this(name) => Content = value;
        public int Content { get; set; }
    }

    public sealed class VdfDecimal : VdfValue
    {
        public VdfDecimal(string name) : base(name)               => Type = VdfValueType.Decimal;
        public VdfDecimal(string name, decimal value) : this(name) => Content = value;
        public decimal Content { get; set; }
    } 
    #endregion

    public abstract class VdfValue
    {
        public VdfValue(string name) => Name = name;
        public string Name { get; }
        public VdfValueType Type { get; protected set; }
        public ICollection<string> Comments { get; } = new List<string>();
        public VdfValue Parent { get; internal set; }
    }
}
