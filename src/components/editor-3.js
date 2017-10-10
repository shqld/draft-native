// @flow
import React from 'react'
import { View, TextInput, Text, Button } from 'react-native'

import { EditorState, ContentState, SelectionState, Modifier, RichUtils, insertTextIntoContentState } from '../lib/draft-js'
import * as ChangeType from '../lib/editor-change-type'
import Selection, { NativeSelection } from '../lib/selection'

import Renderer from './renderer'

/**
 * Nativeの都合上、スタイルを変えたあとにもう一度forceSelectionする必要がある。
 */

type Props = {}
type State = {
    editorState: EditorState,
    nativeSelection: NativeSelection,
}

export default class Editor extends React.Component {
    constructor(props: Props) {
        super(props)

        this.state = {
            editorState: EditorState.createEmpty(),
            forceSelection: null,
        }

        this.selection = new Selection()
        this.shouldSelectionUpdate = true
        this.latestContent = this.state.editorState.getCurrentContent()

        this.onSelectionChange = this.buildHandler(this.onSelectionChange)
        this.onTextInput = this.buildHandler(this.onTextInput)
    }

    selection: Selection
    shouldSelectionUpdate: boolean
    latestContent: ContentState

    toggleHeader = () => {
        const editorState = RichUtils.toggleBlockType(
            this.state.editorState,
            'header-one'
        )

        const { currentSelection } = this.selection

        const tmpSelection = {
            start: currentSelection.start - 1,
            end: currentSelection.end - 1,
        }

        this.setState(
            { editorState, forceSelection: tmpSelection },
            () => this.setState(
                { forceSelection: null }
            )
        )
    }

    toggleInlineStyle = (style) => {
        let editorState = RichUtils.toggleInlineStyle(
            this.state.editorState,
            style
        )

        this.setState({ editorState })

        // const { currentSelection } = this.selection
        
        // const tmpSelection = {
        //     start: currentSelection.start - 1,
        //     end: currentSelection.end - 1,
        // }

        // this.setState(
        //     { editorState, forceSelection: tmpSelection },
        //     () => { this.setState({ forceSelection: null }) }
        // )
    }

    onSelectionChange = ({ selection }) => {
        if (!this.shouldSelectionUpdate) {
            this.shouldSelectionUpdate = true
            this.selection.setSelection(selection)

            return
        }

        this.shouldSelectionUpdate = true

        const { editorState } = this.state

        // const __es = EditorState.set(
        //         editorState, {
        //             selection: new Selection(selection).toState(editorState),
        //         }
        //     )
        // console.log(__es.getCurrentInlineStyle().toJS())
        // console.log(__es.getSelection().toJS())

        return EditorState.set(
            editorState, {
                selection: new Selection(selection).toState(editorState),
            }
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

            const contentState =
                Modifier.replaceText(
                    editorState.getCurrentContent(),
                    new Selection(range).toState(editorState),
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

            contentState =
                Modifier.splitBlock(
                    contentState,
                    contentState.getSelectionAfter()
                )
    
            return EditorState.push(
                editorState,
                contentState,
                ChangeType.SPLIT_BLOCK
            )
        }
        else if (previousText) {
            /**
             * 削除
             */
            const contentState =
                Modifier.removeRange(
                    editorState.getCurrentContent(),
                    new Selection(range).toState(editorState),
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
                text,
                editorState.getCurrentInlineStyle()
            )

            return EditorState.set(editorState, {
                currentContent: contentState,
                selection: contentState.getSelectionAfter()
            })
        }
    }

    buildHandler = (handler) => ({ nativeEvent }) => {
        const editorState = handler(nativeEvent)
        if (editorState) {
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
                    selection={this.state.forceSelection}
                >
                    <Renderer
                        editorState={this.state.editorState}
                    />
                </TextInput>
            </View>
        )
    }
}
