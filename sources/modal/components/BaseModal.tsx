import React, { useEffect, useRef } from 'react';
import {
    Modal,
    TouchableWithoutFeedback,
    Animated,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface BaseModalProps {
    visible: boolean;
    onClose?: () => void;
    children: React.ReactNode;
    animationType?: 'fade' | 'slide' | 'none';
    transparent?: boolean;
    closeOnBackdrop?: boolean;
    /** 是否在小屏设备上全屏显示 */
    fullscreenOnSmall?: boolean;
}

export function BaseModal({
    visible,
    onClose,
    children,
    animationType = 'fade',
    transparent = true,
    closeOnBackdrop = true,
    fullscreenOnSmall = false
}: BaseModalProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { rt } = useUnistyles();
    const { width, height } = useWindowDimensions();

    // 小屏幕检测 (lg 断点以下)
    const isSmallScreen = rt.breakpoint === 'xs' || rt.breakpoint === 'sm' || rt.breakpoint === 'md';
    const shouldFullscreen = fullscreenOnSmall && isSmallScreen;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible, fadeAnim]);

    const handleBackdropPress = () => {
        if (closeOnBackdrop && onClose) {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={transparent}
            animationType={animationType}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={[
                    stylesheet.container,
                    shouldFullscreen && stylesheet.containerFullscreen
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {!shouldFullscreen && (
                    <TouchableWithoutFeedback onPress={handleBackdropPress}>
                        <Animated.View
                            style={[
                                stylesheet.backdrop,
                                {
                                    opacity: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 0.5]
                                    })
                                }
                            ]}
                        />
                    </TouchableWithoutFeedback>
                )}

                <Animated.View
                    style={[
                        stylesheet.content,
                        shouldFullscreen && stylesheet.contentFullscreen,
                        shouldFullscreen && { width, height },
                        {
                            opacity: fadeAnim,
                            transform: shouldFullscreen ? [] : [{
                                scale: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.9, 1]
                                })
                            }]
                        }
                    ]}
                >
                    {children}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const stylesheet = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    containerFullscreen: {
        justifyContent: 'flex-start',
        alignItems: 'stretch'
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black'
    },
    content: {
        zIndex: 1
    },
    contentFullscreen: {
        flex: 1,
        backgroundColor: theme.colors.surface
    }
}));