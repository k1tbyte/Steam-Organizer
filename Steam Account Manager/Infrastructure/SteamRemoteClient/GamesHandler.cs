using SteamKit2;
using SteamKit2.Internal;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.SteamRemoteClient
{
    internal sealed class GamesHandler : ClientMsgHandler
    {
        internal const byte MaxGamesPlayed = 32;

        public override void HandleMsg(IPacketMsg PacketMsg)
        {
            if (Client == null)
                throw new InvalidOperationException(nameof(Client));

            switch (PacketMsg.MsgType)
            {
                case EMsg.ClientGetUserStatsResponse:
                    var getAchievementsResponse = new ClientMsgProtobuf<CMsgClientGetUserStatsResponse>(PacketMsg);
                    Client.PostCallback(new GetAchievementsCallback(PacketMsg.TargetJobID, getAchievementsResponse.Body));
                    break;
                case EMsg.ClientStoreUserStatsResponse:
                    var setAchievementsResponse = new ClientMsgProtobuf<CMsgClientStoreUserStatsResponse>(PacketMsg);
                    Client.PostCallback(new SetAchievementsCallback(PacketMsg.TargetJobID, setAchievementsResponse.Body));
                    break;
            }

        }

        
        internal async Task PlayGames(IReadOnlyCollection<uint> GameIDs, string gameName = null)
        {
            if (Client == null)
                throw new InvalidOperationException(nameof(Client));

            if (!Client.IsConnected)
                return;

            var request = new ClientMsgProtobuf<CMsgClientGamesPlayed>(EMsg.ClientGamesPlayedWithDataBlob)
            {
                Body =
                {
                    client_os_type = unchecked((uint)SteamRemoteClient.OSType)
                }
            };

            if (!String.IsNullOrEmpty(gameName))
            {
                Client.Send(request);
                await Task.Delay(SteamRemoteClient.CallbackSleep).ConfigureAwait(false);

                request.Body.games_played.Add(
                    new CMsgClientGamesPlayed.GamePlayed
                    {
                        game_extra_info = gameName,
                        game_id = new GameID
                        {
                            AppType = GameID.GameType.Shortcut,
                            ModID = uint.MaxValue
                        }
                    });
            }

            if(GameIDs != null && GameIDs.Count > 0)
            {
                IEnumerable<uint> uniqueValidGameIDs = (GameIDs as ISet<uint> ?? GameIDs.Distinct()).Where(gameID => gameID > 0);

                foreach (uint gameID in uniqueValidGameIDs)
                {
                    if(request.Body.games_played.Count >= MaxGamesPlayed)
                    {
                        if (String.IsNullOrEmpty(gameName))
                            throw new ArgumentOutOfRangeException(nameof(GameIDs));

                        gameName = null;

                        request.Body.games_played.RemoveAt(0);
                    }

                    request.Body.games_played.Add(
                        new CMsgClientGamesPlayed.GamePlayed
                        {
                            game_id = new GameID(gameID)
                        });
                }
            }
            
            Client.Send(request);
        }

        internal abstract class AchievementsCallback<T> : CallbackMsg
        {
            internal readonly T Response;
            internal readonly bool Success;

            internal AchievementsCallback(JobID jobID, T msg, Func<T, EResult> eresultGetter, string error)
            {
                if (jobID == null)
                {
                    throw new ArgumentNullException(nameof(jobID));
                }

                if (msg == null)
                {
                    throw new ArgumentNullException(nameof(msg));
                }

                JobID = jobID;
                Success = eresultGetter(msg) == EResult.OK;
                Response = msg;

                if (!Success)
                {
                    throw new Exception();
                }
            }

        }
        internal sealed class GetAchievementsCallback : AchievementsCallback<CMsgClientGetUserStatsResponse>
        {
            internal GetAchievementsCallback(JobID jobID, CMsgClientGetUserStatsResponse msg)
                : base(jobID, msg, message => (EResult)msg.eresult, "GetAchievements") { }
        }

        internal sealed class SetAchievementsCallback : AchievementsCallback<CMsgClientStoreUserStatsResponse>
        {
            internal SetAchievementsCallback(JobID jobID, CMsgClientStoreUserStatsResponse msg)
                : base(jobID, msg, message => (EResult)msg.eresult, "SetAchievements") { }
        }

        private async Task<GetAchievementsCallback> GetAchievementsResponse(ulong steamId, ulong gameID)
        {
            if (!Client.IsConnected)
            {
                return null;
            }

            ClientMsgProtobuf<CMsgClientGetUserStats> request = new ClientMsgProtobuf<CMsgClientGetUserStats>(EMsg.ClientGetUserStats)
            {
                SourceJobID = Client.GetNextJobID(),
                Body = {
                    game_id =  gameID,
                    steam_id_for_user = steamId,
                }
            };

            Client.Send(request);

            return await new AsyncJob<GetAchievementsCallback>(Client, request.SourceJobID);
        }
    }
}
