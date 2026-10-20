/** Semantic colors every tinted component accepts. */
export type SemanticColor =
    | 'neutral'
    | 'accent'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'

/** Feedback states without the brand accent. */
export type StatusColor = Exclude<SemanticColor, 'accent'>
