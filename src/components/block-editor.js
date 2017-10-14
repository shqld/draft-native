import React from 'react'
import { View, TextInput, Text, Button, Platform } from 'react-native'

import { EditorState, ContentState, SelectionState, ContentBlock, Modifier, RichUtils, insertTextIntoContentState } from '../lib/draft-js'
import * as ChangeType from '../lib/editor-change-type'

import Block from './block'

type Props = {
    onEditorChange: (editorState: EditorState) => void,
    editorState: EditorState,
    getRef: (ref: Object) => void,
    block: ContentBlock,
}

export default class BlockEditor extends React.Component {
    props: Props

    shouldComponentUpdate(nextProps: Props): boolean {
        // if ()
        const prevEditorState = this.props.editorState
        const nextEditorState = nextProps.editorState

        if (prevEditorState.getCurrentContent() === nextEditorState.getCurrentContent()) {
            return false
        }
        return true
    }


    onFocus = () => {
        // this.get
    }

    onSelectionChange = ({ nativeEvent: { selection }}) => {
        const { onEditorChange, editorState, block } = this.props
        const blockKey = block.getKey()

        const selectionState =
            editorState.getSelection().merge({
                anchorKey: blockKey,
                anchorOffset: selection.start,
                focusKey: blockKey,
                focusOffset: selection.end,
            })

        onEditorChange(
            EditorState.set(editorState, {
                selection: selectionState,
            })
        )
    }

    onTextInput = ({ nativeEvent: { text, previousText, range }}) => {
        const { onEditorChange, editorState, block } = this.props
        const blockKey = block.getKey()

        if (range) {
            range = new SelectionState({
                anchorKey: blockKey,
                anchorOffset: range.start,
                focusKey: blockKey,
                focusOffset: range.end,
            })
        }

        if (previousText && text) {
            /**
             * 文字置換(変換も)
             */
            if (previousText === text) return

            const contentState =
                Modifier.replaceText(
                    editorState.getCurrentContent(),
                    range,
                    text
                )

            onEditorChange(
                EditorState.push(
                    editorState,
                    contentState,
                    ChangeType.APPLY_ENTITY
                )
            )
        }
        else if (text === '\n') {
            /**
             * 改行
             */
            // let contentState =
            //     Modifier.insertText(
            //         editorState.getCurrentContent(),
            //         editorState.getSelection(),
            //         '\n'
            //     )

            let contentState = editorState.getCurrentContent()

            contentState =
                Modifier.splitBlock(
                    contentState,
                    editorState.getSelection()
                )
    
            onEditorChange(
                EditorState.push(
                    editorState,
                    contentState,
                    ChangeType.SPLIT_BLOCK
                )
            )
        }
        else if (previousText) {
            /**
             * 削除
             */
            const contentState =
                Modifier.removeRange(
                    editorState.getCurrentContent(),
                    range
                )
    
            onEditorChange(
                EditorState.push(
                    editorState,
                    contentState,
                    ChangeType.REMOVE_RANGE
                )
            )
        }
        else {
            /**
             * 挿入
             */
            const contentState = Modifier.insertText(
                editorState.getCurrentContent(),
                editorState.getSelection(),
                text,
                editorState.getInlineStyleOverride() || editorState.getCurrentInlineStyle()
            )

            onEditorChange(
                EditorState.set(editorState, {
                    currentContent: contentState,
                    nativelyRenderedContent: contentState,
                    selection: contentState.getSelectionAfter()
                })
            )
        }
    }


    render() {
        const { getRef, block, editorState } = this.props
        return (
            <TextInput
                ref={ref => getRef(ref)}
                multiline
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                onSelectionChange={this.onSelectionChange}
                onTextInput={this.onTextInput}
                /* onFocus={this.onFocus} */
                /* selection={this.state.forceSelection} */
            >
                <Block
                    block={block}
                    tree={editorState.getBlockTree(block.getKey())}
                />
            </TextInput>
        )
    }
}
