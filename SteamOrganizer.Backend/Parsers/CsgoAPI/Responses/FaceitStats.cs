﻿using SteamOrganizer.Backend.Parsers.CSGOApi.Responses;
using static SteamOrganizer.Backend.Parsers.CSGOApi.Responses.FaceitPlayerStatsObject;

namespace SteamOrganizer.Backend.Parsers.CsgoAPI.Responses;

public sealed class FaceitStatsObject : FaceitOverallStats
{
    public MapStats[]? Maps { get; set; }
    public int Elo { get; set; }
    public byte SkillLevel { get; set; }
}