/**
 * @file SessionAccessBadge.tsx
 * @input AccessLevel type ('owner' | 'view' | 'collaborate')
 * @output Colored badge indicating session access level
 * @pos Phase 7 Session Sharing - UI badge component
 */

import * as React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';
import { AccessLevel } from '@/sync/sessionShareTypes';

export type SessionAccessBadgeProps = {
    accessLevel: AccessLevel | 'owner';
    size?: 'small' | 'medium';
    testID?: string;
};

const styles = StyleSheet.create(() => ({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    badgeSmall: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    badgeText: {
        ...Typography.default('semiBold'),
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    badgeTextSmall: {
        fontSize: 10,
    },
    // Access level colors
    ownerBadge: {
        backgroundColor: '#007AFF20',
    },
    ownerText: {
        color: '#007AFF',
    },
    viewBadge: {
        backgroundColor: '#8E8E9320',
    },
    viewText: {
        color: '#8E8E93',
    },
    collaborateBadge: {
        backgroundColor: '#34C75920',
    },
    collaborateText: {
        color: '#34C759',
    },
}));

export const SessionAccessBadge = React.memo(function SessionAccessBadge({
    accessLevel,
    size = 'medium',
    testID,
}: SessionAccessBadgeProps) {

    const getBadgeStyle = () => {
        switch (accessLevel) {
            case 'owner':
                return styles.ownerBadge;
            case 'view':
                return styles.viewBadge;
            case 'collaborate':
                return styles.collaborateBadge;
            default:
                return styles.viewBadge;
        }
    };

    const getTextStyle = () => {
        switch (accessLevel) {
            case 'owner':
                return styles.ownerText;
            case 'view':
                return styles.viewText;
            case 'collaborate':
                return styles.collaborateText;
            default:
                return styles.viewText;
        }
    };

    const getLabel = () => {
        switch (accessLevel) {
            case 'owner':
                return t('sessionSharing.accessLevel.owner');
            case 'view':
                return t('sessionSharing.accessLevel.view');
            case 'collaborate':
                return t('sessionSharing.accessLevel.collaborate');
            default:
                return '';
        }
    };

    return (
        <View
            style={[
                styles.badge,
                size === 'small' && styles.badgeSmall,
                getBadgeStyle(),
            ]}
            testID={testID}
        >
            <Text
                style={[
                    styles.badgeText,
                    size === 'small' && styles.badgeTextSmall,
                    getTextStyle(),
                ]}
            >
                {getLabel()}
            </Text>
        </View>
    );
});
