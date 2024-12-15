import React, {FC} from "react";
import type {IAccountProps} from "@/pages/Profile/Profile.tsx";
import {Expander, withStateSaving} from "@/components/primitives/Expander.tsx";
import {Gradients, Icon, SvgIcon} from "src/defines";
import {TextArea} from "@/components/primitives/TextArea.tsx";
import {delayedSaveAccounts} from "@/store/accounts.ts";
import {EEconomyBanType} from "@/types/steamPlayerSummary.ts";
import CommunityArea from "./CommunityArea.tsx";
import CredentialsArea from "./CredentialsArea.tsx";
import {uiStore} from "@/store/local.tsx";

interface IBanChipProps {
    name: string;
    banDescription?: string;
    banned?: boolean | number;
}

const BanChip: FC<IBanChipProps> = ({name, banned, banDescription}) => (
    <div className="grad-chip px-4 py-4 text-sm  rounded-lg flex-y-center flex-wrap justify-between">
        <span className="font-bold letter-space">{name}</span>
        {(banned) ?
            <>
                <SvgIcon className="text-danger" icon={Icon.AlertDecagram} size={32}/>
                <p className="w-full text-xs text-close mr-10">{banDescription}</p>
            </>
            : <SvgIcon fill={Gradients.Success} icon={Icon.CheckDecagram} size={32}/>
        }
    </div>
)

const SummariesTab: FC<IAccountProps> = ({acc}) => {

    const noteArea = <Expander {...withStateSaving(nameof(uiStore.store.note))}
                               className="backdrop-primary w-full md:order-none self-start"
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
                <CredentialsArea acc={acc}/>
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
                <div className="flex flex-col md:grid grid-cols-2 gap-3">
                    <CredentialsArea acc={acc}/>
                    {noteArea}
                </div>

            </div>

            <Expander className="backdrop-primary"
                      {...withStateSaving(nameof(uiStore.store.bans))}
                      icon={<SvgIcon icon={Icon.Block} size={24}/>} title="Bans">
                <div className="p-4 space-y-5">
                    <BanChip name="VAC ban" banned={acc.vacBansCount}
                             banDescription={`This account has been banned by VAC${
                                 (acc.vacBansCount > 1 ? ` in several games (${acc.vacBansCount})` : "")}`}/>
                    <BanChip name="Game ban" banned={acc.gameBansCount}
                             banDescription={`This account has a game ban${
                                 (acc.gameBansCount > 1 ? ` in several games (${acc.gameBansCount})` : "")
                             }`}/>
                    <BanChip name="Community ban" banned={acc.haveCommunityBan}
                             banDescription="The account is not allowed to interact with the Steam community."/>
                    <BanChip name="Trade ban" banned={acc.economyBan}
                             banDescription={`${(acc.economyBan === EEconomyBanType.Probation ?
                                     "The account is temporarily blocked." : "The account is permanently blocked."
                             )} Trade/exchange/sending of gifts is prohibited on this account`}/>
                </div>
            </Expander>
        </div>
    );
}

export default SummariesTab;