import * as helper from './helper'
import React, { Component } from 'react'
import {
    StyleSheet,
    PanResponder,
    View,
    Text,
    Dimensions
} from 'react-native'
import Line from './line'
import Circle from './circle'
import PropTypes from 'prop-types';

const Width = Dimensions.get('window').width;
const Height = Dimensions.get('window').height;
const Radius =  Width / 10;
const MarginTop = (Height - Width - Radius * 3)/2;

export default class GesturePassword extends Component {
    constructor(props) {
        super(props);

        this.timer = null;
        this.lastIndex = -1;ß
        this.sequence = '';   // 手势结果
        this.isMoving = false;

        let circles = [];
        let Margin = Radius;
        let top = this.props.top || MarginTop;
        for (let i=0; i < 9; i++) {
            let p = i % 3;
            let q = parseInt(i / 3);
            circles.push({
                isActive: false,
                x: p * (Radius * 2 + Margin) + Margin + Radius,
                y: q * (Radius * 2 + Margin) + Margin + Radius + top
            });
        }

        this.state = {
            circles: circles,
            lines: [],
            top:top
        }
    }

    componentWillMount() {
        this._panResponder = PanResponder.create({
            // 要求成为响应者：
            onStartShouldSetPanResponder: (event, gestureState) => true,
            onStartShouldSetPanResponderCapture: (event, gestureState) => true,
            onMoveShouldSetPanResponder: (event, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (event, gestureState) => true,

            // 开始手势操作
            onPanResponderGrant: (event, gestureState) => {
                this.onStart(event, gestureState);
            },
            // 移动操作
            onPanResponderMove: (event, gestureState) => {
                this.onMove(event, gestureState);
            },
            // 释放手势
            onPanResponderRelease: (event, gestureState) => {
                this.onEnd(event, gestureState);
            }
        })
    }

    render() {
        const { status, wrongColor, rightColor, normalColor,message,children,style,textStyle,textContainerStyle } = this.props;
        let textColor = status === 'wrong' ? wrongColor : rightColor;

        return (
            <View style={[styles.container,style]}>
                <View style={[styles.message,{top:MarginTop/2},textContainerStyle]}>
                    <Text style={[styles.msgText, textStyle, {color: textColor}]}>
                        {message}
                    </Text>
                </View>
                <View style={styles.board} {...this._panResponder.panHandlers}>
                    {this.renderCircles()}
                    {this.renderLines()}
                    <Line ref='line' color={normalColor} />
                </View>

                {children}
            </View>
        )
    }

    renderCircles() {
        let array = [], fill, inner, outer;
        let { normalColor, rightColor, innerCircle, outerCircle } = this.props;

        this.state.circles.forEach(function(c, i) {
            fill = c.isActive;
            inner = !!innerCircle;
            outer = !!outerCircle;

            array.push(
                <Circle key={'c_' + i} fill={fill} color={normalColor} x={c.x} y={c.y} r={Radius} inner={inner} outer={outer} />
            )
        });

        return array;
    }

    renderLines() {
        let array = [];
        let { normalColor } = this.props;
        this.state.lines.forEach(function(l, i) {
            array.push(
                <Line key={'l_' + i} color={normalColor} start={l.start} end={l.end} />
            )
        });

        return array;
    }

    setActive(index) {
        this.state.circles[index].isActive = true;

        let circles = this.state.circles;
        this.setState({circles});
    }

    resetActive() {
        this.state.lines = [];
        for (let i=0; i < 9; i++) {
            this.state.circles[i].isActive = false;
        }

        let circles = this.state.circles;
        this.setState({circles});
        this.props.onReset && this.props.onReset();
    }

    getTouchChar(touch) {
        let x = touch.x;
        let y = touch.y;

        for (let i=0; i < 9; i++) {
            if ( helper.isPointInCircle({x, y}, this.state.circles[i], Radius) ) {
                return String(i);
            }
        }

        return false;
    }

    getCrossChar(char) {
        let middles = '13457', last = String(this.lastIndex);

        if ( middles.indexOf(char) > -1 || middles.indexOf(last) > -1 ) return false;

        let point = helper.getMiddlePoint(this.state.circles[last], this.state.circles[char]);

        for (let i=0; i < middles.length; i++) {
            let index = middles[i];
            if ( helper.isEquals(point, this.state.circles[index]) ) {
                return String(index);
            }
        }

        return false;
    }

    onStart(e, g) {
        let x = e.nativeEvent.pageX ;
        let y = e.nativeEvent.pageY;
        console.log('onStart',x,y)

        let lastChar = this.getTouchChar({x, y});
        if ( lastChar ) {
            this.isMoving = true;
            this.lastIndex = Number(lastChar);
            this.sequence = lastChar;
            this.resetActive();
            this.setActive(this.lastIndex);

            let point = {
                x: this.state.circles[this.lastIndex].x,
                y: this.state.circles[this.lastIndex].y
            };

            this.refs.line.setNativeProps({start: point, end: point});

            this.props.onStart && this.props.onStart();

            if ( this.props.interval>0 ) {
                clearTimeout(this.timer);
            }
        }
    }

    onMove(e, g) {
        let x = e.nativeEvent.pageX ;
        let y = e.nativeEvent.pageY;
        console.log('onMove',x,y)

        if ( this.isMoving ) {
            this.refs.line.setNativeProps({end: {x, y}});

            let lastChar = null;

            if ( !helper.isPointInCircle({x, y}, this.state.circles[this.lastIndex], Radius) ) {
                lastChar = this.getTouchChar({x, y});
            }

            if ( lastChar && this.sequence.indexOf(lastChar) === -1 ) {
                if ( !this.props.allowCross ) {
                    let crossChar = this.getCrossChar(lastChar);

                    if ( crossChar && this.sequence.indexOf(crossChar) === -1 ) {
                        this.sequence += crossChar;
                        this.setActive(Number(crossChar));
                    }
                }

                let lastIndex = this.lastIndex;
                let thisIndex = Number(lastChar);

                this.state.lines.push({
                    start: {
                        x: this.state.circles[lastIndex].x,
                        y: this.state.circles[lastIndex].y
                    },
                    end: {
                        x: this.state.circles[thisIndex].x,
                        y: this.state.circles[thisIndex].y
                    }
                });

                this.lastIndex = Number(lastChar);
                this.sequence += lastChar;

                this.setActive(this.lastIndex);

                let point = {
                    x: this.state.circles[this.lastIndex].x,
                    y: this.state.circles[this.lastIndex].y
                };

                this.refs.line.setNativeProps({start: point});
            }
        }

        if ( this.sequence.length === 9 ) this.onEnd();
    }

    onEnd(e, g) {
        if ( this.isMoving ) {
            let password = helper.getRealPassword(this.sequence);
            this.sequence = '';
            this.lastIndex = -1;
            this.isMoving = false;

            let origin = {x: 0, y: 0};
            this.refs.line.setNativeProps({start: origin, end: origin});

            this.props.onEnd && this.props.onEnd(password);

            if ( this.props.interval>0 ) {
                this.timer = setTimeout(() => this.resetActive(), this.props.interval);
            }
        }
    }
}

GesturePassword.propTypes = {
    message: PropTypes.string,
    normalColor: PropTypes.string,
    rightColor: PropTypes.string,
    wrongColor: PropTypes.string,
    status: PropTypes.oneOf(['right', 'wrong', 'normal']),
    onStart: PropTypes.func,
    onEnd: PropTypes.func,
    onReset: PropTypes.func,
    interval: PropTypes.number,
    allowCross: PropTypes.bool,
    innerCircle: PropTypes.bool,
    outerCircle: PropTypes.bool
};

GesturePassword.defaultProps = {
    message: '',
    normalColor: '#5FA8FC',
    rightColor: '#5FA8FC',
    wrongColor: '#D93609',
    status: 'normal',
    interval: 0,
    allowCross: false,
    innerCircle: true,
    outerCircle: true
};

const styles = StyleSheet.create({
    container:{
        flex:1,
    },
    board: {
        width: Width,
    },
    message: {
        paddingHorizontal: 15,
        alignItems: 'center',
        // top:MarginTop/2,
        position:'absolute',
        width:Width
    },
    msgText: {
        fontSize: 14
    }
});

module.exports = GesturePassword;
