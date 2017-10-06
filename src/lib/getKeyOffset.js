// @flow
import { SelectionState, ContentState } from './draft-js'

const getKeyOffset = (contentState: ContentState, currentKey: stirng, currentOffset: number, delta): { key: string, offset: number } => {
    let key = currentKey
    let offset = currentOffset + delta

    // console.log('delta', delta)

    let currentBlockLength = contentState.getBlockForKey(key).getLength()

    // Selecting backward over block
    if (offset < 0) {
        do {
            const beforeBlock = contentState.getBlockBefore(key)
            key = beforeBlock.getKey()
            offset = beforeBlock.getLength() + offset
        } while (offset < 0)
    }
    // Selecting forward over block
    else if (
        contentState.getLastBlock().key !== key
            && offset >= currentBlockLength
    ) {
        do {
            const afterBlock = contentState.getBlockAfter(key)
            key = afterBlock.getKey()
            offset = offset - currentBlockLength

            currentBlockLength = afterBlock.getLength()
        } while (offset > currentBlockLength)
    }

    return { key, offset }
}

export default getKeyOffset
