// @flow
import React from 'react'
import { View, TextInput, Text, Button } from 'react-native'

import { EditorState, ContentState, SelectionState, Modifier, RichUtils } from '../lib/draft-js'
import * as ChangeType from '../lib/editor-change-type'
import { selectionToSelectionState } from '../lib/selection-fns'

import Renderer from './renderer'

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
            editorState: EditorState.createEmpty()
        }

        this.selection = { start: 0, end: 0 }
        this.shouldSelectionUpdate = true

        this.onSelectionChange = this.buildHandler(this.onSelectionChange)
        this.onTextInput = this.buildHandler(this.onTextInput)
    }

    selection: Selection
    shouldSelectionUpdate: boolean

    toggleHeader = () => {
        const editorState = RichUtils.toggleBlockType(
            this.state.editorState,
            'header-one'
        )

        this.setState({ editorState })
    }

    toggleInlineStyle = (style) => {
        const editorState = RichUtils.toggleInlineStyle(
            this.state.editorState,
            style
        )

        this.setState({ editorState })
        
    }

    onSelectionChange = ({ selection }) => {
        // console.group('onSelectionChange')
        // console.info(
        //     'selectionState',
        //     this.state.editorState.getSelection().getAnchorOffset(),
        //     this.state.editorState.getSelection().getFocusOffset()
        // )
        // console.info(
        //     'this.selection',
        //     this.selection.start,
        //     this.selection.end
        // )
        // console.info(
        //     'event',
        //     selection.start,
        //     selection.end
        // )

        if (!this.shouldSelectionUpdate) {
            this.shouldSelectionUpdate = true
            this.selection = selection

            // console.info(
            //     'updated this.selection',
            //     this.selection.start,
            //     this.selection.end
            // )
            // console.info(
            //     'selectionState',
            //     this.state.editorState.getSelection().getAnchorOffset(),
            //     this.state.editorState.getSelection().getFocusOffset()
            // )
            // console.groupEnd('onSelectionChange')
            return
        }

        const { editorState } = this.state

        const selectionState = selectionToSelectionState(
            this.selection,
            selection,
            editorState.getSelection(),
            editorState.getCurrentContent()
        )

        this.shouldSelectionUpdate = true
        this.selection = selection

        // console.info(
        //     'updated this.selection',
        //     this.selection.start,
        //     this.selection.end
        // )
        // console.log(
        //     'updated SelectionState',
        //     selectionState.getAnchorOffset(),
        //     selectionState.getFocusOffset(),
        // )
        // console.groupEnd('onSelectionChange')

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
            // console.log('range', range)
            if (previousText === text) return

            const selectionState = selectionToSelectionState(
                this.selection,
                range,
                editorState.getSelection(),
                editorState.getCurrentContent()
            )
            // console.log()

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
            const contentState = Modifier.insertText(
                editorState.getCurrentContent(),
                editorState.getSelection(),
                text
            )
        
            return EditorState.push(
                editorState,
                contentState,
                ChangeType.INSERT_CHARACTERS
            )
        }
    }

    buildHandler = (handler) => ({ nativeEvent }) => {
        // console.log(nativeEvent)
        const editorState = handler(nativeEvent)
        if (editorState) {

            // console.info(
            //     editorState.getCurrentContent().toJS(),
            //     editorState.getSelection().toJS()
            // )

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
                    style={{ flex: 1, paddingTop: 30, padding: 10 }}
                    onSelectionChange={this.onSelectionChange}
                    onTextInput={this.onTextInput}
                >
                    <Renderer
                        editorState={this.state.editorState}
                    />
                </TextInput>
            </View>
        )
    }
}
