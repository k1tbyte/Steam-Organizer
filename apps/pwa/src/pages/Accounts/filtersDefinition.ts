import {EFilterType, FiltersDefinition} from "@/components/FilterInput/types";
import {Account} from "@/entity/account";

export const accountsFilters = [
    [
        {
            label: "Search by",
            type: EFilterType.Search,
            fields: [
                {
                    name: "Nickname",
                    prop: nameof(Account.prototype.nickname)
                },
                {
                    name: "Login",
                    prop: nameof(Account.prototype.login)
                },
                {
                    name: "Note",
                    prop: nameof(Account.prototype.note)
                },
                {
                    name: "Phone",
                    prop: nameof(Account.prototype.phone)
                }
            ]
        },
        {
            type: EFilterType.Flags,
            fields: [
                {
                    name: "Economy banned",
                    prop: nameof(Account.prototype.economyBan)
                },
                {
                    name: "Community banned",
                    prop: nameof(Account.prototype.haveCommunityBan)
                },
                {
                    name: "VAC banned",
                    prop: nameof(Account.prototype.vacBansCount)
                },
                {
                    name: "Game banned",
                    prop: nameof(Account.prototype.gameBansCount)
                }
            ]
        }
    ],
    [
        {
            label: "Order by",
            type: EFilterType.Order,
            fields: [
                {
                    name: "Created date",
                    prop: nameof(Account.prototype.id)
                },
                {
                    name: "Added date",
                    prop: nameof(Account.prototype.addedDate)
                },
                {
                    name: "Last update",
                    prop: nameof(Account.prototype.lastUpdateDate)
                },
                {
                    name: "Level",
                    prop: nameof(Account.prototype.steamLevel)
                }
            ]
        },
    ]
] satisfies FiltersDefinition