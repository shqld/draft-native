// @flow
import React from 'react'
import { View, TextInput, Text, Button, Platform } from 'react-native'

import { EditorState, ContentState, SelectionState, Modifier, RichUtils, insertTextIntoContentState } from '../lib/draft-js'
import * as ChangeType from '../lib/editor-change-type'

// import Renderer from './renderer-editor'
import BlockEditor from './block-editor'

const isAndroid = Platform.OS === 'android'

/**
 * ブロックがTextInput
 */

type Props = {}
type State = {
    editorState: EditorState,
    // nativeSelection: NativeSelection,
}

export default class Editor extends React.Component {
    constructor(props: Props) {
        super(props)

        this.state = {
            editorState: EditorState.createEmpty(),
        }
    }

    selection: Selection

    toggleHeader = () => {
        const editorState = RichUtils.toggleBlockType(
            this.state.editorState,
            'header-one'
        )

        if (isAndroid) return this.setState({ editorState })
        // return this.setState({ editorState })

        const currentSelection = Object.assign({}, this.selection.currentSelection)

        console.log(currentSelection)

        const tmpSelection = {
            start: currentSelection.start - 1,
            end: currentSelection.end - 1,
        }
        console.log(tmpSelection)

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

        if (this.state.editorState.getSelection().isCollapsed()) {
            const { currentSelection } = this.selection
            
            const tmpSelection = {
                start: currentSelection.start - 1,
                end: currentSelection.end - 1,
            }
            // console.log(tmpSelection)
    
            this.setState(
                { editorState, forceSelection: tmpSelection },
                () => { this.setState({ forceSelection: null }) }
            )
        } else {
            this.setState({ editorState })
        }
    }

    renderChildren() {
        const { editorState } = this.state
        const blockMap = editorState.getCurrentContent().getBlockMap()
        return blockMap.map(block => {
            const blockKey = block.getKey()

            return (
                <BlockEditor
                    key={blockKey}
                    block={block}
                    editorState={editorState}
                    onEditorChange={newEditorState => {
                        console.log(newEditorState.getCurrentContent().getBlockMap().toJS())
                        this.setState({ editorState: newEditorState })
                    }}
                    getRef={ref => {
                        this.refs[blockKey] = ref
                    }}
                />
            )
        }).toArray()
    }

    render() {
        return (
            <View style={{ flex: 1, paddingTop: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <Button title="H1" onPress={this.toggleHeader} style={{ width: 80, height: 30 }} />
                    <Button title="Underline" onPress={() => this.toggleInlineStyle('ITALIC')} style={{ width: 80, height: 30 }} />
                    <Button title="Bold" onPress={() => this.toggleInlineStyle('BOLD')} style={{ width: 80, height: 30 }} />
                </View>
                <View
                    style={{ flex: 1, paddingTop: 30, padding: 10 }}
                >
                    { this.renderChildren() }
                </View>
            </View>
        )
    }
}
