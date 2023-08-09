using System.Collections.Generic;
using System.Linq;
using System;

namespace SteamOrganizer.Infrastructure.Parsers.Vdf
{
    /// <summary>
    /// A VdfValue that represents a table containing other VdfValues
    /// </summary>
    public sealed class VdfTable : VdfValue, IList<VdfValue>
    {
        public VdfTable(string name) : base(name) { }

        private readonly List<VdfValue> values = new List<VdfValue>();
        private readonly Dictionary<string, VdfValue> valuelookup = new Dictionary<string,VdfValue>();

        public int Count                      => values.Count;
        bool ICollection<VdfValue>.IsReadOnly => false;
        public VdfValue this[string name]     => valuelookup[name];

        public int IndexOf(VdfValue item)
        {
            return values.IndexOf(item);
        }

        public void Insert(int index, VdfValue item)
        {

            if(item == null)
            {
                throw new ArgumentNullException("item");
            }
            if(index < 0 || index >= values.Count)
            {
                throw new ArgumentOutOfRangeException("index");
            }
            if(string.IsNullOrEmpty(item.Name))
            {
                throw new ArgumentException("item name cannot be empty or null");
            }
            if (ContainsName(item.Name))
            {
                throw new ArgumentException("a value with name " + item.Name + " already exists in the table");
            }


            item.Parent = this;

            values.Insert(index, item);
            valuelookup.Add(item.Name, item);
        }


        public void RemoveAt(int index)
        {
            var val = values[index];
            values.RemoveAt(index);
            valuelookup.Remove(val.Name);
        }

        public VdfValue this[int index]
        {
            get
            {
                return values[index];
            }
            set
            {
                if(values[index].Name != value.Name)
                {
                    valuelookup.Remove(values[index].Name);
                    valuelookup.Add(value.Name, value);
                }
                else
                {
                valuelookup[value.Name] = value;
                }
                values[index] = value;
            }
        }

        public VdfTable TryGetTable(string name)
        {
            if (!valuelookup.TryGetValue(name, out VdfValue value) || !(value is VdfTable table))
                return null;

            return table;
        }

        public void Add(VdfValue item)
        {
            if (item == null)
            {
                throw new ArgumentNullException("item");
            }
            if (string.IsNullOrEmpty(item.Name))
            {
                throw new ArgumentException("item name cannot be empty or null");
            }
            if (ContainsName(item.Name))
            {
                throw new ArgumentException("a value with name " + item.Name + " already exists in the table");
            }
            
            item.Parent = this;

            values.Add(item);
            valuelookup.Add(item.Name, item);
        }

        public void Clear()
        {
            values.Clear();
            valuelookup.Clear();
        }

        public bool Contains(VdfValue item)
        {
            if (item == null)
            {
                throw new ArgumentNullException("item");
            }
            if (string.IsNullOrEmpty(item.Name))
            {
                throw new ArgumentException("item name cannot be empty or null");
            }

            return valuelookup.ContainsKey(item.Name) && (valuelookup[item.Name] == item);
        }
        
        public bool ContainsName(string name)
        {
            if (name == null)
            {
                throw new ArgumentNullException("name");
            }
            if (string.IsNullOrEmpty(name))
            {
                throw new ArgumentException("name cannot be empty");
            }

            return valuelookup.ContainsKey(name);
        }

        public void CopyTo(VdfValue[] array, int arrayIndex)
        {
            values.CopyTo(array, arrayIndex);
        }

        public IEnumerator<VdfValue> GetEnumerator()
            => values.GetEnumerator();
        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
            => values.GetEnumerator();

        public bool Remove(VdfValue item)
        {
            if (item == null)
            {
                throw new ArgumentNullException("item");
            }
            if (string.IsNullOrEmpty(item.Name))
            {
                throw new ArgumentException("item name cannot be empty or null");
            }
            if(Contains(item))
            {
                valuelookup.Remove(item.Name);
                values.Remove(item);
                return true;
            }
            return false;
        }        
    }
}
