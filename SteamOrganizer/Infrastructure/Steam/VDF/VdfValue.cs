using System.Collections.Generic;

namespace SteamOrganizer.Infrastructure.Parsers.Vdf
{
    public enum VdfValueType
    {
        Table,
        String,
        Integer,
        Double,
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

    public sealed class VdfDouble : VdfValue
    {
        public VdfDouble(string name) : base(name)               => Type = VdfValueType.Double;
        public VdfDouble(string name, double value) : this(name) => Content = value;
        public double Content { get; set; }
    } 
    #endregion

    public abstract class VdfValue
    {
        public VdfValue(string name) => Name = name;
        public string Name { get; private set; }
        private List<string> comments = new List<string>();
        public VdfValueType Type { get; protected set; }
        public ICollection<string> Comments => comments;
        public VdfValue Parent { get; internal set; }
    }
}
