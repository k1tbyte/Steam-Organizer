export interface ShellNavItem {
    key: string
    label: string
    icon: string
    to?: string
    /** Planned but not built: shown, never active, never clickable. */
    soon?: boolean
}

declare module 'vue-router' {
    interface RouteMeta {
        /** Rail and tab bar entry this page belongs to. */
        nav?: string
        /** Hides the mobile tab bar for a drill-down screen. */
        tabBar?: boolean
    }
}
