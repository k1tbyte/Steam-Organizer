import React, {FC} from "react";
import type {IAccountProps} from "@/pages/Profile/Profile.tsx";
import {Expander, withStateSaving} from "@/shared/ui/Expander";
import { Icon, SvgIcon} from "@/defines";
import {TextArea} from "@/shared/ui/TextArea";
import {delayedSaveAccounts} from "@/store/accounts";
import {EEconomyBanType} from "@/types/steamPlayerSummary";
import CommunityArea from "./components/CommunityArea";
import Credentials from "./components/Credentials/Credentials";
import {uiStore} from "@/store/local";
import {ProfileBanChip} from "./components/BanChip/BanChip";

const SummariesTab: FC<IAccountProps> = ({acc}) => {

    const noteArea = <Expander {...withStateSaving(nameof(uiStore.store.note))}
                               className="backdrop-primary md:order-none self-start flex-1 min-w-72"
                               icon={<SvgIcon icon={Icon.NoteEdit} size={24}/>} title="Note about account">
        <div className="p-4">
            <TextArea className="grad-chip rounded-xl resize-none"
                      onBlur={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          acc.note = e.target.value
                          delayedSaveAccounts();
                      }}
                      defaultValue={acc.note}
                      autoResize={true} maxRows={10} rows={5} maxLength={200}
                      placeholder="Some information about the account . . ."/>
        </div>
    </Expander>

    if (!acc.id) {
        return (
            <div className="grid md:grid-cols-2 gap-3 mt-3">
                <Credentials acc={acc}/>
                {noteArea}
            </div>
        )
    }

    return (
        <div className="flex flex-col md:grid grid-cols-3 gap-3 mb-3">
            <div className="row-span-2 col-span-2 order-last md:order-none">
                {
                    (acc.getYears() > 0 || acc.gamesCount) &&
                    <Expander className="backdrop-primary mb-3"
                              {...withStateSaving(nameof(uiStore.store.community))}
                              icon={<SvgIcon icon={Icon.BadgeAward} size={24}/>} title="Community">
                        <CommunityArea acc={acc}/>
                    </Expander>
                }
                <div className="flex flex-wrap items-start justify-stretch  gap-3">
                    <Credentials acc={acc}/>
                    {noteArea}
                </div>

            </div>

            <Expander className="backdrop-primary"
                      {...withStateSaving(nameof(uiStore.store.bans))}
                      icon={<SvgIcon icon={Icon.Block} size={24}/>} title="Bans">
                <div className="p-4 space-y-5">
                    <ProfileBanChip name="VAC ban" banned={acc.vacBansCount}
                             banDescription={acc.getVacBanInfo()}/>
                    <ProfileBanChip name="Game ban" banned={acc.gameBansCount}
                             banDescription={acc.getGameBanInfo()}/>
                    <ProfileBanChip name="Community ban" banned={acc.haveCommunityBan}
                             banDescription={acc.getCommunityBanInfo()}/>
                    <ProfileBanChip name="Trade ban" banned={acc.economyBan}
                             banDescription={acc.getTradeBanInfo()}/>
                </div>
            </Expander>
        </div>
    );
}

export default SummariesTab;