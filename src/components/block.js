// @flow
import React from 'react'
import { EditorState, ContentBlock } from '../lib/draft-js'
import { Text, StyleSheet } from 'react-native'

import Leaf from './leaf'

const defaultStyles = StyleSheet.create({
    'header-one': {
        fontSize: 30,
    }
})

type Props = {
    // tree: Object,
    block: ContentBlock,
}

class Block extends React.Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
        return (
            this.props.block !== nextProps.block ||
            this.props.tree !== nextProps.tree
        )
    }

    renderChildren() {
        const { tree, block } = this.props

        const blockKey = block.getKey();
        const text = block.getText();
        const lastLeafSet = tree.size - 1;
        // const hasSelection = isBlockOnSelectionEdge(this.props.selection, blockKey);

        return tree.map((leafSet, ii) => {
            const leavesForLeafSet = leafSet.get('leaves')
            const lastLeaf = leavesForLeafSet.size - 1
            const leaves = leavesForLeafSet.map((leaf, jj) => {
                // const offsetKey = DraftOffsetKey.encode(blockKey, ii, jj)
                const start = leaf.get('start')
                const end = leaf.get('end')
                return (
                    <Leaf
                        // key={offsetKey}
                        key={jj}
                        // offsetKey={offsetKey}
                        block={block}
                        start={start}
                        // selection={hasSelection ? this.props.selection : undefined}
                        // forceSelection={this.props.forceSelection}
                        text={text.slice(start, end)}
                        styleSet={block.getInlineStyleAt(start)}
                        // customStyleMap={this.props.customStyleMap}
                        // customStyleFn={this.props.customStyleFn}
                        // isLast={ii === lastLeafSet && jj === lastLeaf}
                    />
                )
            }).toArray()

            return leaves
        })
    }

    render() {
        const { block } = this.props

        return (
            <Text
                style={defaultStyles[block.getType()]}
            >
                { this.renderChildren() }
                { /*block.getText()*/ }
            </Text>
        )
    }
}

export default Block
