import { BaseVirtualLayout } from "./BaseVirtualLayout.ts";

export class StackLayout extends BaseVirtualLayout {
    public render(): void {
        this.renderDefault(() => this.startRow, (visibleRows) => this.startRow + visibleRows)
    }

    protected override getSizerHeight(): number {
        return Math.ceil(this.rowHeight * this.source.length) - this.rowGap;
    }
}