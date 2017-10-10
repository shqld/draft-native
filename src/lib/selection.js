const { EditorState, ContentState, SelectionState, Modifier } = require('./draft-js')

export type NativeSelection = {
    start: number,
    end: number,
}

export type AnchorOrFocus = 'anchor' | 'focus'

type PlainSelectionState = {
    anchorKey?: string,
    anchorOffset?: string,
    focusKey?: string,
    focusOffset?: string,
}

/**
 * Selection class handles disparity between currentSelection and selectionState
 */
export default class Selection {
    constructor(selection: NativeSelection) {
        this.currentSelection = selection || { start: 0, end: 0 }
    }

    currentSelection: NativeSelection
    // selectionBefore: NativeSelection
    isCollapsed: boolean
    cache: Object = {}

    toState(editorState: EditorState) {
        const contentState = editorState.getCurrentContent()

        if (this.isCollapsed) {
            const { anchorKey, anchorOffset } =
                this.getPosition(contentState, 'anchor')

            return new SelectionState({
                anchorKey,
                anchorOffset,
                focusKey: anchorKey,
                focusOffset: anchorOffset,
            })
        }

        const { anchorKey, anchorOffset } =
            this.getPosition(contentState, 'anchor')
        const { focusKey, focusOffset } =
            this.getPosition(contentState, 'focus')

        return new SelectionState({
            anchorKey,
            anchorOffset,
            focusKey,
            focusOffset,
        })
    }

    getPosition(
        content: ContentState,
        position: AnchorOrFocus
    ): PlainSelectionState {
        // Cursor position
        const currentSelection = this.getCurrentSelection(position)

        let key
        let offset
        let acc = 0

        content.getBlockMap().some(block => {
            const length = block.getLength()
            if (acc + length > currentSelection) {
                key = block.getKey()
                offset = currentSelection - acc

                return true
            }

            acc += length
            return false
        })

        if (!key) {
            const lastBlock = content.getLastBlock()
            key = lastBlock.getKey()
            offset = lastBlock.getLength()
        }

        return {
            [`${position}Offset`]: offset,
            [`${position}Key`]: key,
        }
    }

    getCurrentSelection(position: AnchorOrFocus) {
        // TODO: isCollapsedをを加味
        return (position === 'anchor')
            ? this.currentSelection['start']
            : this.currentSelection['end']
    }

    // getSelectionBefore(position: AnchorOrFocus) {
    //     // TODO: isCollapsedをを加味
    //     return (position === 'anchor')
    //         ? this.selectionBefore['start']
    //         : this.selectionBefore['end']
    // }

    get isCollapsed() {
        return this.currentSelection.start === this.currentSelection.end
    }

    setSelection(selection: NativeSelection) {
        // this.selectionBefore = this.currentSelection
        this.currentSelection = selection
    }
}
