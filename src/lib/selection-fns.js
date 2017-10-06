// @flow
import { SelectionState, ContentState } from './draft-js'
import getKeyOffset from './getKeyOffset'

type Selection = {
    start: number,
    end: number,
}

type SelectionDelta = {
    anchor: number,
    focus: number,
}

const getSelectionDelta = (selectionBefore: Selection, selectionAfter: Selection): SelectionDelta => {
    const anchor = selectionAfter.start - selectionBefore.start
    const focus = selectionAfter.end - selectionBefore.end

    return { anchor, focus }
}

export const selectionToSelectionState = (selectionBefore: Selection, selectionAfter: Selection, selectionState: SelectionState, contentState: ContentState) => {
    const delta = getSelectionDelta(selectionBefore, selectionAfter)

    const anchor = getKeyOffset(
        contentState,
        selectionState.getAnchorKey(),
        selectionState.getAnchorOffset(),
        delta.anchor
    )

    if (selectionAfter.start === selectionAfter.end) {
        return selectionState.merge({
            anchorKey: anchor.key,
            anchorOffset: anchor.offset,
            focusKey: anchor.key,
            focusOffset: anchor.offset,
        })
    }

    const focus = getKeyOffset(
        contentState,
        selectionState.getFocusKey(),
        selectionState.getFocusOffset(),
        delta.focus
    )

    return selectionState.merge({
        anchorKey: anchor.key,
        anchorOffset: anchor.offset,
        focusKey: focus.key,
        focusOffset: focus.offset,
    })
}

export const rangeToSelectionState = (range: Selection, selectionState: SelectionState, contentState: ContentState) => {
    
}
