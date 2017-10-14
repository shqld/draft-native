// @flow
import React from 'react'
import { Text, StyleSheet } from 'react-native'
import { ContentBlock, DraftInlineStyle } from '../lib/draft-js'

const styles = StyleSheet.create({
    ITALIC: {
        fontStyle: 'italic',
    },
    BOLD: {
        fontWeight: 'bold',
    },
})

type Props = {
    text: string,
    block: ContentBlock,
    styleSet: DraftInlineStyle,
}

class Leaf extends React.Component<Props> {
    shouldComponentUpdate(nextProps: Props): boolean {
        // const leafNode = ReactDOM.findDOMNode(this.refs.leaf);
        // invariant(leafNode, 'Missing leafNode');

        const result = (
            this.props.text !== nextProps.text ||
            nextProps.styleSet !== this.props.styleSet
        )

        return (
          this.props.text !== nextProps.text ||
          nextProps.styleSet !== this.props.styleSet
        //   nextProps.forceSelection
        );
    }

    render() {
        const {block} = this.props
        let {text} = this.props
    
        // // If the leaf is at the end of its block and ends in a soft newline, append
        // // an extra line feed character. Browsers collapse trailing newline
        // // characters, which leaves the cursor in the wrong place after a
        // // shift+enter. The extra character repairs this.
        // if (text.endsWith('\n') && this.props.isLast) {
        //   text += '\n'
        // }
    
        const {/*customStyleMap, customStyleFn, offsetKey, */styleSet} = this.props
        let styleObj = styleSet.reduce((map, styleName) => {
        //   const mergedStyles = {}
        //   const style = customStyleMap[styleName]
    
        //   if (
        //     style !== undefined &&
        //     map.textDecoration !== style.textDecoration
        //   ) {
        //     // .trim() is necessary for IE9/10/11 and Edge
        //     mergedStyles.textDecoration =
        //       [map.textDecoration, style.textDecoration].join(' ').trim()
        //   }
    
        //   return Object.assign(map, style, mergedStyles)
            map.push(styles[styleName])
            return map
        }, [])

        // if (customStyleFn) {
        //   const newStyles = customStyleFn(styleSet, block)
        //   styleObj = Object.assign(styleObj, newStyles)
        // }
    
        return (
            <Text
                ref="leaf"
                style={styleObj}
            >
                {text}
            </Text>
        )
    }
}

export default Leaf
