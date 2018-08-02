import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'
import PropTypes from 'prop-types';
export default class Circle extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let {color, normalColor, fill, x, y, r, inner, outer} = this.props;
        let r2 = r*2/3;
        return (
            <View style={[styles.outer,
                        {left: x - r2, top: y - r2, width: 2 * r2, height: 2 * r2, borderRadius: r2}, {borderColor: normalColor},
                        fill && {borderColor: color,backgroundColor:'rgba(83,126,239,0.1))'},
                        !outer && {borderWidth: 0}]}>

                {inner && <View style={[
                            !outer && styles.inner,
                            {width: 2 * r / 3, height: 2 * r / 3, borderRadius: r / 3},
                            fill && {backgroundColor: color}
                        ]} />}
            </View>
        )
    }
}

Circle.propTypes = {
    color: PropTypes.string,
    fill: PropTypes.bool,
    x: PropTypes.number,
    y: PropTypes.number,
    r: PropTypes.number,
    inner: PropTypes.bool,
    outer: PropTypes.bool
}

Circle.defaultProps = {
    inner: true,
    outer: true
}

const styles = StyleSheet.create({
    outer: {
        position: 'absolute',
        borderColor: '#8E91A8',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    inner: {
        backgroundColor: '#8E91A8'
    }
})

module.exports = Circle;    // for compatible with require only
