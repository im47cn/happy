/**
 * Browser voice output settings screen
 *
 * @input browserSpeechRate/Pitch/Volume/SelectedVoice settings, useSpeechSynthesis hook
 * @output Voice output configuration UI with speech rate, pitch, volume, voice selection
 * @pos Settings page - browser TTS output configuration
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import React, { useCallback, useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Text } from '@/components/StyledText';
import { useSettingMutable } from '@/sync/storage';
import { useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';
import { useSpeechSynthesis, type VoiceInfo } from '@/realtime/hooks/useSpeechSynthesis';
import {
    BROWSER_SPEECH_RATE,
    BROWSER_SPEECH_PITCH,
    BROWSER_SPEECH_VOLUME,
    validateSpeechRate,
    validateSpeechPitch,
    validateSpeechVolume,
} from '@/realtime/voiceConfig';

/**
 * Stepper control component for adjusting numeric values
 */
interface StepperProps {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    formatValue?: (value: number) => string;
    disabled?: boolean;
}

function Stepper({ value, min, max, step, onChange, formatValue, disabled }: StepperProps) {
    const { theme } = useUnistyles();

    const canDecrease = value > min;
    const canIncrease = value < max;

    const handleDecrease = () => {
        if (canDecrease) {
            onChange(Math.round((value - step) * 10) / 10);
        }
    };

    const handleIncrease = () => {
        if (canIncrease) {
            onChange(Math.round((value + step) * 10) / 10);
        }
    };

    const displayValue = formatValue ? formatValue(value) : value.toString();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
                onPress={handleDecrease}
                disabled={disabled || !canDecrease}
                style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: theme.colors.surfaceHighest,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled || !canDecrease ? 0.4 : pressed ? 0.7 : 1,
                })}
            >
                <Ionicons name="remove" size={18} color={theme.colors.text} />
            </Pressable>

            <Text style={{
                minWidth: 50,
                textAlign: 'center',
                fontSize: 15,
                fontWeight: '500',
                color: theme.colors.text,
            }}>
                {displayValue}
            </Text>

            <Pressable
                onPress={handleIncrease}
                disabled={disabled || !canIncrease}
                style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: theme.colors.surfaceHighest,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled || !canIncrease ? 0.4 : pressed ? 0.7 : 1,
                })}
            >
                <Ionicons name="add" size={18} color={theme.colors.text} />
            </Pressable>
        </View>
    );
}

export default function VoiceOutputSettingsScreen() {
    const { theme } = useUnistyles();

    // Settings
    const [browserSpeechRate, setBrowserSpeechRate] = useSettingMutable('browserSpeechRate');
    const [browserSpeechPitch, setBrowserSpeechPitch] = useSettingMutable('browserSpeechPitch');
    const [browserSpeechVolume, setBrowserSpeechVolume] = useSettingMutable('browserSpeechVolume');
    const [browserSelectedVoice, setBrowserSelectedVoice] = useSettingMutable('browserSelectedVoice');

    // Speech synthesis hook
    const {
        isSupported,
        isSpeaking,
        voices,
        speak,
        cancel,
    } = useSpeechSynthesis();

    // Test voice state
    const [isTesting, setIsTesting] = useState(false);

    // Handle rate change
    const handleRateChange = useCallback((value: number) => {
        setBrowserSpeechRate(validateSpeechRate(value));
    }, [setBrowserSpeechRate]);

    // Handle pitch change
    const handlePitchChange = useCallback((value: number) => {
        setBrowserSpeechPitch(validateSpeechPitch(value));
    }, [setBrowserSpeechPitch]);

    // Handle volume change
    const handleVolumeChange = useCallback((value: number) => {
        setBrowserSpeechVolume(validateSpeechVolume(value));
    }, [setBrowserSpeechVolume]);

    // Handle voice selection
    const handleVoiceSelect = useCallback((voiceName: string | null) => {
        setBrowserSelectedVoice(voiceName);
    }, [setBrowserSelectedVoice]);

    // Handle test voice
    const handleTestVoice = useCallback(() => {
        if (isSpeaking) {
            cancel();
            setIsTesting(false);
            return;
        }

        setIsTesting(true);
        speak(t('voice.settings.testVoiceText'), {
            rate: browserSpeechRate,
            pitch: browserSpeechPitch,
            volume: browserSpeechVolume,
            voiceName: browserSelectedVoice,
            onEnd: () => setIsTesting(false),
            onError: () => setIsTesting(false),
        });
    }, [isSpeaking, speak, cancel, browserSpeechRate, browserSpeechPitch, browserSpeechVolume, browserSelectedVoice]);

    // Handle reset to defaults
    const handleReset = useCallback(() => {
        setBrowserSpeechRate(BROWSER_SPEECH_RATE.DEFAULT);
        setBrowserSpeechPitch(BROWSER_SPEECH_PITCH.DEFAULT);
        setBrowserSpeechVolume(BROWSER_SPEECH_VOLUME.DEFAULT);
        setBrowserSelectedVoice(null);
    }, [setBrowserSpeechRate, setBrowserSpeechPitch, setBrowserSpeechVolume, setBrowserSelectedVoice]);

    // Format functions
    const formatRate = (value: number) => `${value.toFixed(1)}x`;
    const formatPitch = (value: number) => value.toFixed(1);
    const formatVolume = (value: number) => `${Math.round(value * 100)}%`;

    // Browser not supported
    if (!isSupported) {
        return (
            <ItemList style={{ paddingTop: 0 }}>
                <ItemGroup
                    title={t('voice.settings.output')}
                    footer={t('voice.settings.browserNotSupportedDescription')}
                >
                    <Item
                        title={t('voice.settings.browserNotSupported')}
                        icon={<Ionicons name="warning-outline" size={29} color={theme.colors.status.error} />}
                        showChevron={false}
                        disabled
                    />
                </ItemGroup>
            </ItemList>
        );
    }

    return (
        <ItemList style={{ paddingTop: 0 }}>
            {/* Speech Rate */}
            <ItemGroup
                title={t('voice.settings.speechRate')}
                footer={t('voice.settings.speechRateDescription')}
            >
                <Item
                    title={t('voice.settings.speechRate')}
                    icon={<Ionicons name="speedometer-outline" size={29} color="#FF9500" />}
                    rightElement={
                        <Stepper
                            value={browserSpeechRate}
                            min={BROWSER_SPEECH_RATE.MIN}
                            max={BROWSER_SPEECH_RATE.MAX}
                            step={BROWSER_SPEECH_RATE.STEP}
                            onChange={handleRateChange}
                            formatValue={formatRate}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {/* Speech Pitch */}
            <ItemGroup
                title={t('voice.settings.speechPitch')}
                footer={t('voice.settings.speechPitchDescription')}
            >
                <Item
                    title={t('voice.settings.speechPitch')}
                    icon={<Ionicons name="musical-notes-outline" size={29} color="#5856D6" />}
                    rightElement={
                        <Stepper
                            value={browserSpeechPitch}
                            min={BROWSER_SPEECH_PITCH.MIN}
                            max={BROWSER_SPEECH_PITCH.MAX}
                            step={BROWSER_SPEECH_PITCH.STEP}
                            onChange={handlePitchChange}
                            formatValue={formatPitch}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {/* Speech Volume */}
            <ItemGroup
                title={t('voice.settings.speechVolume')}
                footer={t('voice.settings.speechVolumeDescription')}
            >
                <Item
                    title={t('voice.settings.speechVolume')}
                    icon={<Ionicons name="volume-high-outline" size={29} color="#34C759" />}
                    rightElement={
                        <Stepper
                            value={browserSpeechVolume}
                            min={BROWSER_SPEECH_VOLUME.MIN}
                            max={BROWSER_SPEECH_VOLUME.MAX}
                            step={BROWSER_SPEECH_VOLUME.STEP}
                            onChange={handleVolumeChange}
                            formatValue={formatVolume}
                        />
                    }
                    showChevron={false}
                />
            </ItemGroup>

            {/* Voice Selection */}
            <ItemGroup
                title={t('voice.settings.selectedVoice')}
                footer={t('voice.settings.selectedVoiceDescription')}
            >
                {/* System Default Option */}
                <Item
                    title={t('voice.settings.systemDefault')}
                    icon={<Ionicons name="phone-portrait-outline" size={29} color="#007AFF" />}
                    rightElement={
                        browserSelectedVoice === null ? (
                            <Ionicons name="checkmark-circle" size={24} color={theme.colors.radio.active} />
                        ) : null
                    }
                    onPress={() => handleVoiceSelect(null)}
                    showChevron={false}
                />

                {/* Voice List */}
                <FlatList<VoiceInfo>
                    data={voices}
                    keyExtractor={(item) => item.voiceURI}
                    renderItem={({ item }) => (
                        <Item
                            title={item.name}
                            subtitle={item.lang + (item.localService ? '' : ' (Online)')}
                            icon={<Ionicons name="mic-outline" size={29} color="#5856D6" />}
                            rightElement={
                                browserSelectedVoice === item.name ? (
                                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.radio.active} />
                                ) : null
                            }
                            onPress={() => handleVoiceSelect(item.name)}
                            showChevron={false}
                        />
                    )}
                    scrollEnabled={false}
                />
            </ItemGroup>

            {/* Test & Reset */}
            <ItemGroup>
                <Item
                    title={isTesting ? t('voice.controls.stopSpeaking') : t('voice.settings.testVoice')}
                    icon={
                        <Ionicons
                            name={isTesting ? 'stop-circle-outline' : 'play-circle-outline'}
                            size={29}
                            color={isTesting ? '#FF3B30' : '#007AFF'}
                        />
                    }
                    onPress={handleTestVoice}
                    showChevron={false}
                />
                <Item
                    title={t('common.reset')}
                    icon={<Ionicons name="refresh-outline" size={29} color={theme.colors.textSecondary} />}
                    onPress={handleReset}
                    showChevron={false}
                />
            </ItemGroup>
        </ItemList>
    );
}
