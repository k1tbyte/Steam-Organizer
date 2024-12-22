
import { BaseVirtualLayout } from "./BaseVirtualLayout.ts";

export class GridLayout extends BaseVirtualLayout {
    private columns: number = NaN;

    protected calculateSizes(): void {
        super.calculateSizes();
        this.columns =  Math.ceil(this.list.clientWidth / this.colWidth);
    }

    public render(): void {
        this.renderDefault(() => this.startRow * this.columns,
            (visibleRows) => (this.startRow * this.columns) + (this.columns * visibleRows))
    }

    protected getSizerHeight(): number {
        const rowCount = Math.ceil(this.source?.length / this.columns);
        return rowCount * this.rowHeight - this.rowGap;
    }
}
