/**
 * TODO
 * - [ ] Fix setState chains => componentDidUpdate etc.
 * 
 * @flow
 */
import React from 'react'
import { View, TextInput, Text, Button, Platform } from 'react-native'

import { EditorState, ContentState, SelectionState, Modifier, RichUtils } from '../lib/draft-js'
import * as ChangeType from '../lib/editor-change-type'
import Selection, { NativeSelection } from '../lib/selection'

import Renderer from './renderer'

const isAndroid = Platform.OS === 'android'

type Props = {}
type State = {
    editorState: EditorState,
}
type TextInputRef = {
    setNativeProps: (nativeProps: NativeProps) => void,
    clear: () => void,
}
type NativeProps = {
    text?: string,
    selection: string,
}

export default class Editor extends React.Component<Props, State> {
    selection: Selection
    shouldSelectionUpdate: boolean
    ref: TextInputRef

    constructor(props: Props) {
        super(props)

        this.state = {
            editorState: EditorState.createEmpty(),
        }

        this.selection = new Selection()
        this.shouldSelectionUpdate = true

        this.onSelectionChange = this.buildHandler(this.onSelectionChange)
        this.onTextInput = this.buildHandler(this.onTextInput)
    }

    clear() { 
        this.ref.clear()
    }

    setNativeProps(nativeProps: NativeProps) {
        this.ref.setNativeProps(nativeProps)
    }

    /**
     * This is a trick for using
     * native rendering of rich text editing
     */
    refreshSelection(currentSelection: NativeSelection) {
        const tmpSelection: NativeSelection = {
            start: currentSelection.start - 1,
            end: currentSelection.end - 1,
        }
        this.setNativeProps({ selection: tmpSelection })
        this.setNativeProps({ selection: currentSelection })
    }

    toggleHeader = () => {
        const editorState = RichUtils.toggleBlockType(
            this.state.editorState,
            'header-one'
        )

        if (isAndroid) return this.setState({ editorState })

        const currentSelection = Object.assign({}, this.selection.currentSelection)

        this.setState({ editorState })
        this.refreshSelection(currentSelection)
    }

    toggleInlineStyle = (style: string) => {
        let editorState = RichUtils.toggleInlineStyle(
            this.state.editorState,
            style
        )

        if (this.state.editorState.getSelection().isCollapsed()) {
            const currentSelection = Object.assign({}, this.selection.currentSelection)

            // this.setState({ editorState }, () => {
            //     this.refreshSelection(currentSelection)
            // })
            this.setState({ editorState })
        } else {
            this.setState({ editorState })
        }
    }

    onSelectionChange = ({ selection }: { selection: NativeSelection }): EditorState => {
        this.shouldSelectionUpdate = true
        this.selection.setSelection(selection)

        // if (!this.shouldSelectionUpdate) return

        const { editorState } = this.state

        return EditorState.set(
            editorState, {
                selection: new Selection(selection).toState(editorState),
            }
        )
    }

    onTextInput = ({ text, previousText, range }: { text: string, previousText: string, range: NativeSelection }): ?EditorState => {
        const { editorState } = this.state
        this.shouldSelectionUpdate = false

        if (previousText && text) {
            /**
             * Replace & composite
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
             * Newline
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
             * Remove
             */
            const contentState: ContentState =
                Modifier.removeRange(
                    editorState.getCurrentContent(),
                    new Selection(range).toState(editorState),
                    'backward'
                )

            return EditorState.push(
                editorState,
                contentState,
                ChangeType.REMOVE_RANGE
            )
        }
        else {
            /**
             * Insert
             */
            const contentState = Modifier.insertText(
                editorState.getCurrentContent(),
                editorState.getSelection(),
                text,
                editorState.getInlineStyleOverride() || editorState.getCurrentInlineStyle()
            )

            const newEditorState = EditorState.set(editorState, {
                currentContent: contentState,
                nativelyRenderedContent: contentState,
                selection: contentState.getSelectionAfter()
            })

            return newEditorState
        }
    }

    buildHandler = (handler: (nativeEvent: Object) => ?EditorState) => ({ nativeEvent }: { nativeEvent: Object}) => {
        const editorState: ?EditorState = handler(nativeEvent)
        if (editorState) {
            this.setState({ editorState })
        }
    }

    render() {
        console.log('render')
        return (
            <View style={{ flex: 1, paddingTop: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <Button title="H1" onPress={this.toggleHeader} style={{ width: 80, height: 30 }} />
                    <Button title="Underline" onPress={() => this.toggleInlineStyle('ITALIC')} style={{ width: 80, height: 30 }} />
                    <Button title="Bold" onPress={() => this.toggleInlineStyle('BOLD')} style={{ width: 80, height: 30 }} />
                </View>
                <TextInput
                    ref={(ref: TextInputRef) => { this.ref = ref }}
                    multiline
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{ flex: 1, paddingTop: 30, padding: 10, fontSize: 15 }}
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
