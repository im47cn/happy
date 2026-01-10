/**
 * Browser speech recognition language selection screen
 *
 * @input browserRecognitionLanguage setting, SUPPORTED_RECOGNITION_LANGUAGES
 * @output Language selection list for browser speech recognition
 * @pos Settings page - browser voice input language configuration
 *
 * Update this file's header comments and parent CLAUDE.md when modified.
 */

import React from 'react';
import { FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useSettingMutable } from '@/sync/storage';
import { useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';
import { SUPPORTED_RECOGNITION_LANGUAGES, type RecognitionLanguageInfo } from '@/realtime/voiceConfig';

export default function RecognitionLanguageScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const [browserRecognitionLanguage, setBrowserRecognitionLanguage] = useSettingMutable('browserRecognitionLanguage');

    const handleLanguageSelect = (languageCode: string) => {
        setBrowserRecognitionLanguage(languageCode);
        router.back();
    };

    return (
        <ItemList style={{ paddingTop: 0 }}>
            <ItemGroup
                title={t('voice.settings.recognitionLanguage')}
                footer={t('voice.settings.recognitionLanguageFooter', { count: SUPPORTED_RECOGNITION_LANGUAGES.length })}
            >
                <FlatList<RecognitionLanguageInfo>
                    data={SUPPORTED_RECOGNITION_LANGUAGES as RecognitionLanguageInfo[]}
                    keyExtractor={(item: RecognitionLanguageInfo) => item.code}
                    renderItem={({ item }: { item: RecognitionLanguageInfo }) => (
                        <Item
                            title={item.name}
                            subtitle={item.englishName !== item.name ? item.englishName : item.code}
                            icon={<Ionicons name="language-outline" size={29} color="#5856D6" />}
                            rightElement={
                                browserRecognitionLanguage === item.code ? (
                                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.radio.active} />
                                ) : null
                            }
                            onPress={() => handleLanguageSelect(item.code)}
                            showChevron={false}
                        />
                    )}
                    scrollEnabled={false}
                />
            </ItemGroup>
        </ItemList>
    );
}
