/**
 * Voice settings screen
 *
 * @input Settings hooks for voice configuration, browser capabilities
 * @output Voice settings UI with provider selection and browser voice options
 * @pos Settings page - voice I/O configuration entry point
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Switch } from '@/components/Switch';
import { useSettingMutable } from '@/sync/storage';
import { useUnistyles } from 'react-native-unistyles';
import { findLanguageByCode, getLanguageDisplayName, LANGUAGES } from '@/constants/Languages';
import { t } from '@/text';
import { SUPPORTED_RECOGNITION_LANGUAGES, type RecognitionLanguageInfo } from '@/realtime/voiceConfig';
import { checkBrowserVoiceSupport } from '@/utils/browserCapabilities';

export default function VoiceSettingsScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();

    // ElevenLabs settings
    const [voiceAssistantLanguage] = useSettingMutable('voiceAssistantLanguage');

    // Browser voice settings
    const [voiceProvider, setVoiceProvider] = useSettingMutable('voiceProvider');
    const [browserVoiceInputEnabled, setBrowserVoiceInputEnabled] = useSettingMutable('browserVoiceInputEnabled');
    const [browserVoiceOutputEnabled, setBrowserVoiceOutputEnabled] = useSettingMutable('browserVoiceOutputEnabled');
    const [browserRecognitionLanguage] = useSettingMutable('browserRecognitionLanguage');

    // Check browser voice support
    const isWeb = Platform.OS === 'web';
    const browserSupport = isWeb ? checkBrowserVoiceSupport() : null;
    const isBrowserVoiceAvailable = browserSupport?.supported ?? false;

    // Find current languages for display
    const currentElevenLabsLanguage = findLanguageByCode(voiceAssistantLanguage) || LANGUAGES[0];
    const currentRecognitionLanguage: RecognitionLanguageInfo = SUPPORTED_RECOGNITION_LANGUAGES.find(
        (l) => l.code === browserRecognitionLanguage
    ) || SUPPORTED_RECOGNITION_LANGUAGES[0];

    // Provider is browser mode
    const isBrowserProvider = voiceProvider === 'browser';

    return (
        <ItemList style={{ paddingTop: 0 }}>
            {/* Voice Provider Selection - Web Only */}
            {isWeb && isBrowserVoiceAvailable && (
                <ItemGroup
                    title={t('voice.settings.provider')}
                    footer={t('voice.settings.providerDescription')}
                >
                    <Item
                        title={t('voice.settings.providerBrowser')}
                        subtitle={browserSupport?.recognitionSupported && browserSupport?.synthesisSupported
                            ? undefined
                            : browserSupport?.recognitionSupported
                                ? t('voice.settings.inputEnabled')
                                : t('voice.settings.outputEnabled')
                        }
                        icon={<Ionicons name="globe-outline" size={29} color="#34C759" />}
                        selected={isBrowserProvider}
                        onPress={() => setVoiceProvider('browser')}
                        rightElement={
                            isBrowserProvider ? (
                                <Ionicons
                                    name="checkmark"
                                    size={22}
                                    color={theme.colors.radio.active}
                                />
                            ) : undefined
                        }
                    />
                    <Item
                        title={t('voice.settings.providerElevenLabs')}
                        icon={<Ionicons name="sparkles-outline" size={29} color="#AF52DE" />}
                        selected={!isBrowserProvider}
                        onPress={() => setVoiceProvider('elevenlabs')}
                        rightElement={
                            !isBrowserProvider ? (
                                <Ionicons
                                    name="checkmark"
                                    size={22}
                                    color={theme.colors.radio.active}
                                />
                            ) : undefined
                        }
                    />
                </ItemGroup>
            )}

            {/* Browser Voice Input Settings - Web Only, Browser Provider */}
            {isWeb && isBrowserProvider && browserSupport?.recognitionSupported && (
                <ItemGroup
                    title={t('voice.settings.input')}
                    footer={t('voice.settings.inputDescription')}
                >
                    <Item
                        title={t('voice.settings.inputEnabled')}
                        subtitle={browserVoiceInputEnabled
                            ? t('voice.controls.startListening')
                            : t('voice.settings.inputDisabled')
                        }
                        icon={<Ionicons name="mic-outline" size={29} color="#007AFF" />}
                        rightElement={
                            <Switch
                                value={browserVoiceInputEnabled}
                                onValueChange={setBrowserVoiceInputEnabled}
                            />
                        }
                    />
                    {browserVoiceInputEnabled && (
                        <Item
                            title={t('voice.settings.recognitionLanguage')}
                            subtitle={t('voice.settings.recognitionLanguageDescription')}
                            icon={<Ionicons name="language-outline" size={29} color="#5856D6" />}
                            detail={currentRecognitionLanguage.name}
                            onPress={() => router.push('/settings/voice/recognition-language')}
                        />
                    )}
                </ItemGroup>
            )}

            {/* Browser Voice Output Settings - Web Only, Browser Provider */}
            {isWeb && isBrowserProvider && browserSupport?.synthesisSupported && (
                <ItemGroup
                    title={t('voice.settings.output')}
                    footer={t('voice.settings.outputDescription')}
                >
                    <Item
                        title={t('voice.settings.outputEnabled')}
                        subtitle={browserVoiceOutputEnabled
                            ? t('voice.controls.startSpeaking')
                            : t('voice.settings.outputDisabled')
                        }
                        icon={<Ionicons name="volume-high-outline" size={29} color="#FF9500" />}
                        rightElement={
                            <Switch
                                value={browserVoiceOutputEnabled}
                                onValueChange={setBrowserVoiceOutputEnabled}
                            />
                        }
                    />
                    {browserVoiceOutputEnabled && (
                        <Item
                            title={t('voice.settings.selectedVoice')}
                            subtitle={t('voice.settings.selectedVoiceDescription')}
                            icon={<Ionicons name="options-outline" size={29} color="#5856D6" />}
                            onPress={() => router.push('/settings/voice/output')}
                        />
                    )}
                </ItemGroup>
            )}

            {/* Browser Not Supported Warning - Web Only */}
            {isWeb && !isBrowserVoiceAvailable && (
                <ItemGroup
                    title={t('voice.settings.title')}
                    footer={t('voice.settings.browserNotSupportedDescription')}
                >
                    <Item
                        title={t('voice.settings.browserNotSupported')}
                        icon={<Ionicons name="warning-outline" size={29} color={theme.colors.status.error} />}
                        disabled
                    />
                </ItemGroup>
            )}

            {/* ElevenLabs Language Settings - Always shown for ElevenLabs provider or non-web */}
            {(!isWeb || !isBrowserProvider) && (
                <ItemGroup
                    title={t('settingsVoice.languageTitle')}
                    footer={t('settingsVoice.languageDescription')}
                >
                    <Item
                        title={t('settingsVoice.preferredLanguage')}
                        subtitle={t('settingsVoice.preferredLanguageSubtitle')}
                        icon={<Ionicons name="language-outline" size={29} color="#007AFF" />}
                        detail={getLanguageDisplayName(currentElevenLabsLanguage)}
                        onPress={() => router.push('/settings/voice/language')}
                    />
                </ItemGroup>
            )}
        </ItemList>
    );
}
