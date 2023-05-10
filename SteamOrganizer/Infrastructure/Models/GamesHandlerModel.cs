namespace SteamOrganizer.Infrastructure.Models
{
    internal class StatData
    {
        public uint StatNum { get; set; }
        public int BitNum { get; set; }
        public bool IsSet { get; set; }
        public bool Restricted { get; set; }
        public uint Dependency { get; set; }
        public uint DependencyValue { get; set; }
        public string DependencyName { get; set; }
        public string Name { get; set; }
        public uint StatValue { get; set; }
        public string IconHash { get; set; }
        public string IconHashGray { get; set; }
        public string Description { get; set; }
    }

}
