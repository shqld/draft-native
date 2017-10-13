// @flow
import React from 'react'
import { View, TextInput, Text, Button } from 'react-native'

import { EditorState, ContentState, SelectionState, Modifier, RichUtils } from '../lib/draft-js'
import Block from './block-editor'

type Props = {
    // contentState: ContentState,
    editorState: EditorState,
}

export default class Renderer extends React.Component<Props> {
    shouldComponentUpdate(nextProps: Props): boolean {
        const prevEditorState = this.props.editorState;
        const nextEditorState = nextProps.editorState;
    
        const prevDirectionMap = prevEditorState.getDirectionMap();
        const nextDirectionMap = nextEditorState.getDirectionMap();
    
        // Text direction has changed for one or more blocks. We must re-render.
        if (prevDirectionMap !== nextDirectionMap) {
          return true;
        }
    
        const didHaveFocus = prevEditorState.getSelection().getHasFocus();
        const nowHasFocus = nextEditorState.getSelection().getHasFocus();
    
        if (didHaveFocus !== nowHasFocus) {
          return true;
        }
    
        const nextNativeContent = nextEditorState.getNativelyRenderedContent();
    
        const wasComposing = prevEditorState.isInCompositionMode();
        const nowComposing = nextEditorState.isInCompositionMode();
    
        // If the state is unchanged or we're currently rendering a natively
        // rendered state, there's nothing new to be done.
        if (
          prevEditorState === nextEditorState ||
          (
            nextNativeContent !== null &&
            nextEditorState.getCurrentContent() === nextNativeContent
          ) ||
          (wasComposing && nowComposing)
        ) {
          return false;
        }
    
        const prevContent = prevEditorState.getCurrentContent();
        const nextContent = nextEditorState.getCurrentContent();
        const prevDecorator = prevEditorState.getDecorator();
        const nextDecorator = nextEditorState.getDecorator();
        return (
          wasComposing !== nowComposing ||
          prevContent !== nextContent
        //   prevDecorator !== nextDecorator ||
        //   nextEditorState.mustForceSelection()
        );
    }

    renderChildren() {
        const { editorState } = this.props

        return editorState.getCurrentContent().getBlockMap().map(block => {
            const key = block.getKey()
            return (
                <Block
                    key={key}
                    editorState={editorState}
                    block={block}
                    /* tree={editorState.getBlockTree(key)} */
                />
            )
        }).toArray()
    }

    render() {
        console.log('Renderer', 'renders')
        return (
            <View>
            { this.renderChildren() }
            </View>
        )
    }
}