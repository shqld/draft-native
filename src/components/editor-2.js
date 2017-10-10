// @flow
import React from 'react'
import { View, TextInput, Text, Button } from 'react-native'

import { EditorState, ContentState, SelectionState, Modifier, RichUtils, insertTextIntoContentState } from '../lib/draft-js'
import * as ChangeType from '../lib/editor-change-type'
import { selectionToSelectionState } from '../lib/selection-fns'

import Renderer from './renderer'

/**
 * Nativeの都合上、スタイルを変えたあとにもう一度forceSelectionする必要がある。
 */

type Props = {}
type State = {
    editorState: EditorState
}
type Selection = {
    start: number,
    end: number,
}

export default class Editor extends React.Component {
    constructor(props: Props) {
        super(props)

        this.state = {
            editorState: EditorState.createEmpty(),
            selection: {},
        }

        this.selection = { start: 0, end: 0 }
        this.shouldSelectionUpdate = true
        this.latestContent = this.state.editorState.getCurrentContent()

        this.onSelectionChange = this.buildHandler(this.onSelectionChange)
        this.onTextInput = this.buildHandler(this.onTextInput)
    }

    selection: Selection
    shouldSelectionUpdate: boolean
    latestContent: ContentState

    toggleHeader = () => {
        const latestEditorState = EditorState.push(
            this.state.editorState,
            this.latestContent,
            'apply-entity'
        )

        const editorState = RichUtils.toggleBlockType(
            latestEditorState,
            'header-one'
        )

        this.latestContent = editorState.getCurrentContent()
        const currentSelection = this.state.selection
        const selection = {
            start: currentSelection.start - 1,
            end: currentSelection.end - 1,
        }
        this.setState({ editorState, selection }, () => { this.setState({ selection: currentSelection }) })
    }

    toggleInlineStyle = (style) => {
        let editorState = RichUtils.toggleInlineStyle(
            this.state.editorState,
            style
        )

        this.setState({ editorState })
    }

    onSelectionChange = ({ selection }) => {
        // if (!this.shouldSelectionUpdate) {
        //     this.shouldSelectionUpdate = true
        //     this.selection = selection

        //     return
        // }

        this.setState({ selection })

        const { editorState } = this.state

        const selectionState = selectionToSelectionState(
            this.selection,
            selection,
            editorState.getSelection(),
            editorState.getCurrentContent()
        )
        // const content = editorState.getCurrentContent()
        // console.time('find')
        // let acc = 0
        // const anchorBlock = content.getBlockMap().find(block => {
        //     acc += block.getLength()
        //     if (acc >= selection.start) {
        //         return true
        //     }
        //     return false
        // })
        // console.timeEnd('find')
        // console.log(anchorBlock.toJS())

        this.shouldSelectionUpdate = true
        this.selection = selection

        return EditorState.acceptSelection(
            editorState,
            selectionState,
        )
    }

    onTextInput = ({ text, previousText, range }) => {
        const { editorState } = this.state
        this.shouldSelectionUpdate = false

        if (previousText && text) {
            /**
             * 文字置換(変換も)
             */
            if (previousText === text) return

            const selectionState = selectionToSelectionState(
                this.selection,
                range,
                editorState.getSelection(),
                editorState.getCurrentContent()
            )

            const contentState =
                Modifier.replaceText(
                    editorState.getCurrentContent(),
                    selectionState,
                    text
                )

            return EditorState.push(
                editorState,
                contentState,
                ChangeType.APPLY_ENTITY
            )
        }
        else if (text === '\n') {
            /**
             * 改行
             */
            let contentState =
                Modifier.insertText(
                    editorState.getCurrentContent(),
                    editorState.getSelection(),
                    '\n'
                )

            const newEditorState = EditorState.push(
                editorState,
                contentState,
                ChangeType.INSERT_CHARACTERS
            )

            contentState =
                Modifier.splitBlock(
                    contentState,
                    newEditorState.getSelection()
                )
    
            return EditorState.push(
                newEditorState,
                contentState,
                ChangeType.SPLIT_BLOCK
            )
        }
        else if (previousText) {
            /**
             * 削除
             */
            const selectionState = selectionToSelectionState(
                this.selection,
                range,
                editorState.getSelection(),
                editorState.getCurrentContent()
            )

            const contentState =
                Modifier.removeRange(
                    editorState.getCurrentContent(),
                    selectionState
                )
    
            return EditorState.push(
                editorState,
                contentState,
                ChangeType.REMOVE_RANGE
            )
        }
        else {
            /**
             * 挿入
             */
            // const inlineStyleOverride = editorState.getInlineStyleOverride()
            const contentState = Modifier.insertText(
                this.latestContent,
                editorState.getSelection(),
                text
            )

            this.latestContent = contentState

            // return EditorState.push(
            //     editorState,
            //     contentState,
            //     'apply-entity'
            // )
        }
    }

    buildHandler = (handler) => ({ nativeEvent }) => {
        const editorState = handler(nativeEvent)
        if (editorState) {

            console.log(editorState.toJS())
            // this.latestContent = editorState.getCurrentContent()
            this.setState({ editorState })
        }
    }

    render() {

        return (
            <View style={{ flex: 1, paddingTop: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <Button title="H1" onPress={this.toggleHeader} style={{ width: 80, height: 30 }} />
                    <Button title="Underline" onPress={() => this.toggleInlineStyle('ITALIC')} style={{ width: 80, height: 30 }} />
                    <Button title="Bold" onPress={() => this.toggleInlineStyle('BOLD')} style={{ width: 80, height: 30 }} />
                </View>
                <TextInput
                    multiline
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{ flex: 1, paddingTop: 30, padding: 10, fontSize: 15 }}
                    onSelectionChange={this.onSelectionChange}
                    onTextInput={this.onTextInput}
                    selection={this.state.selection}
                >
                    <Renderer
                        editorState={this.state.editorState}
                    />
                </TextInput>
            </View>
        )
    }
}
