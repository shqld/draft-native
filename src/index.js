import React, { Component } from 'react'
import {
  StyleSheet,
  View
} from 'react-native'
import Editor from './components/editor-2'

export default class app extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Editor />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
