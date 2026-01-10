/**
 * English translations for the Happy app
 * Values can be:
 * - String constants for static text
 * - Functions with typed object parameters for dynamic text
 */

/**
 * English plural helper function
 * @param options - Object containing count, singular, and plural forms
 * @returns The appropriate form based on count
 */
function plural({ count, singular, plural }: { count: number; singular: string; plural: string }): string {
    return count === 1 ? singular : plural;
}

export const en = {
    tabs: {
        // Tab navigation labels
        inbox: 'Inbox',
        sessions: 'Terminals',
        settings: 'Settings',
    },

    inbox: {
        // Inbox screen
        emptyTitle: 'Empty Inbox',
        emptyDescription: 'Connect with friends to start sharing sessions',
        updates: 'Updates',
    },

    common: {
        // Simple string constants
        cancel: 'Cancel',
        authenticate: 'Authenticate',
        save: 'Save',
        error: 'Error',
        success: 'Success',
        ok: 'OK',
        continue: 'Continue',
        back: 'Back',
        create: 'Create',
        rename: 'Rename',
        reset: 'Reset',
        logout: 'Logout',
        yes: 'Yes',
        no: 'No',
        discard: 'Discard',
        version: 'Version',
        copied: 'Copied',
        copy: 'Copy',
        scanning: 'Scanning...',
        urlPlaceholder: 'https://example.com',
        home: 'Home',
        message: 'Message',
        files: 'Files',
        fileViewer: 'File Viewer',
        loading: 'Loading...',
        retry: 'Retry',
        delete: 'Delete',
        edit: 'Edit',
    },

    profile: {
        userProfile: 'User Profile',
        details: 'Details',
        firstName: 'First Name',
        lastName: 'Last Name',
        username: 'Username',
        status: 'Status',
    },

    status: {
        connected: 'connected',
        connecting: 'connecting',
        disconnected: 'disconnected',
        error: 'error',
        online: 'online',
        offline: 'offline',
        lastSeen: ({ time }: { time: string }) => `last seen ${time}`,
        permissionRequired: 'permission required',
        activeNow: 'Active now',
        unknown: 'unknown',
    },

    time: {
        justNow: 'just now',
        minutesAgo: ({ count }: { count: number }) => `${count} minute${count !== 1 ? 's' : ''} ago`,
        hoursAgo: ({ count }: { count: number }) => `${count} hour${count !== 1 ? 's' : ''} ago`,
    },

    connect: {
        restoreAccount: 'Restore Account',
        enterSecretKey: 'Please enter a secret key',
        invalidSecretKey: 'Invalid secret key. Please check and try again.',
        enterUrlManually: 'Enter URL manually',
    },

    settings: {
        title: 'Settings',
        connectedAccounts: 'Connected Accounts',
        connectAccount: 'Connect account',
        github: 'GitHub',
        machines: 'Machines',
        features: 'Features',
        social: 'Social',
        account: 'Account',
        accountSubtitle: 'Manage your account details',
        appearance: 'Appearance',
        appearanceSubtitle: 'Customize how the app looks',
        voiceAssistant: 'Voice Assistant',
        voiceAssistantSubtitle: 'Configure voice interaction preferences',
        featuresTitle: 'Features',
        featuresSubtitle: 'Enable or disable app features',
        notifications: 'Notifications',
        notificationsSubtitle: 'Manage push notification settings',
        developer: 'Developer',
        developerTools: 'Developer Tools',
        about: 'About',
        aboutFooter: 'Happy Coder is a Codex and Claude Code mobile client. It\'s fully end-to-end encrypted and your account is stored only on your device. Not affiliated with Anthropic.',
        whatsNew: 'What\'s New',
        whatsNewSubtitle: 'See the latest updates and improvements',
        reportIssue: 'Report an Issue',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        eula: 'EULA',
        supportUs: 'Support us',
        supportUsSubtitlePro: 'Thank you for your support!',
        supportUsSubtitle: 'Support project development',
        scanQrCodeToAuthenticate: 'Scan QR code to authenticate',
        githubConnected: ({ login }: { login: string }) => `Connected as @${login}`,
        connectGithubAccount: 'Connect your GitHub account',
        claudeAuthSuccess: 'Successfully connected to Claude',
        exchangingTokens: 'Exchanging tokens...',
        usage: 'Usage',
        usageSubtitle: 'View your API usage and costs',

        // Dynamic settings messages
        accountConnected: ({ service }: { service: string }) => `${service} account connected`,
        machineStatus: ({ name, status }: { name: string; status: 'online' | 'offline' }) =>
            `${name} is ${status}`,
        featureToggled: ({ feature, enabled }: { feature: string; enabled: boolean }) =>
            `${feature} ${enabled ? 'enabled' : 'disabled'}`,
    },

    settingsAppearance: {
        // Appearance settings screen
        theme: 'Theme',
        themeDescription: 'Choose your preferred color scheme',
        themeOptions: {
            adaptive: 'Adaptive',
            light: 'Light', 
            dark: 'Dark',
        },
        themeDescriptions: {
            adaptive: 'Match system settings',
            light: 'Always use light theme',
            dark: 'Always use dark theme',
        },
        display: 'Display',
        displayDescription: 'Control layout and spacing',
        inlineToolCalls: 'Inline Tool Calls',
        inlineToolCallsDescription: 'Display tool calls directly in chat messages',
        expandTodoLists: 'Expand Todo Lists',
        expandTodoListsDescription: 'Show all todos instead of just changes',
        showLineNumbersInDiffs: 'Show Line Numbers in Diffs',
        showLineNumbersInDiffsDescription: 'Display line numbers in code diffs',
        showLineNumbersInToolViews: 'Show Line Numbers in Tool Views',
        showLineNumbersInToolViewsDescription: 'Display line numbers in tool view diffs',
        wrapLinesInDiffs: 'Wrap Lines in Diffs',
        wrapLinesInDiffsDescription: 'Wrap long lines instead of horizontal scrolling in diff views',
        alwaysShowContextSize: 'Always Show Context Size',
        alwaysShowContextSizeDescription: 'Display context usage even when not near limit',
        avatarStyle: 'Avatar Style',
        avatarStyleDescription: 'Choose session avatar appearance',
        avatarOptions: {
            pixelated: 'Pixelated',
            gradient: 'Gradient',
            brutalist: 'Brutalist',
        },
        showFlavorIcons: 'Show AI Provider Icons',
        showFlavorIconsDescription: 'Display AI provider icons on session avatars',
        compactSessionView: 'Compact Session View',
        compactSessionViewDescription: 'Show active sessions in a more compact layout',
    },

    settingsFeatures: {
        // Features settings screen
        experiments: 'Experiments',
        experimentsDescription: 'Enable experimental features that are still in development. These features may be unstable or change without notice.',
        experimentalFeatures: 'Experimental Features',
        experimentalFeaturesEnabled: 'Experimental features enabled',
        experimentalFeaturesDisabled: 'Using stable features only',
        webFeatures: 'Web Features',
        webFeaturesDescription: 'Features available only in the web version of the app.',
        commandPalette: 'Command Palette',
        commandPaletteEnabled: 'Press ⌘K to open',
        commandPaletteDisabled: 'Quick command access disabled',
        markdownCopyV2: 'Markdown Copy v2',
        markdownCopyV2Subtitle: 'Long press opens copy modal',
        hideInactiveSessions: 'Hide inactive sessions',
        hideInactiveSessionsSubtitle: 'Show only active chats in your list',
    },

    settingsNotifications: {
        // Push notification settings screen
        title: 'Notifications',
        subtitle: 'Manage push notification settings',
        webPush: 'Push Notifications',
        webPushDescription: 'Receive notifications even when the app is closed. Only available in web browsers that support push notifications.',

        // Status messages
        notSupported: 'Not Supported',
        notSupportedDescription: 'Your browser does not support push notifications',
        permissionDenied: 'Permission Denied',
        permissionDeniedDescription: 'Push notifications are blocked. Please enable them in your browser settings.',
        permissionRequired: 'Permission Required',
        permissionRequiredDescription: 'Tap to allow push notifications',
        subscribed: 'Subscribed',
        subscribedDescription: 'You will receive push notifications',
        unsubscribed: 'Disabled',
        unsubscribedDescription: 'Push notifications are turned off',

        // Actions
        enableNotifications: 'Enable Notifications',
        disableNotifications: 'Disable Notifications',
        requestPermission: 'Allow Notifications',

        // Notification types
        notificationTypes: 'Notification Types',
        notificationTypesDescription: 'Choose which types of notifications you want to receive',
        approvalRequest: 'Approval Requests',
        approvalRequestDescription: 'Get notified when actions require your approval',
        taskComplete: 'Task Completion',
        taskCompleteDescription: 'Get notified when background tasks complete',
        newMessage: 'New Messages',
        newMessageDescription: 'Get notified when you receive new messages',
        systemNotification: 'System Alerts',
        systemNotificationDescription: 'Important system updates and alerts',

        // Device info
        deviceInfo: 'Device Information',
        deviceId: 'Device ID',

        // Errors
        subscriptionFailed: 'Failed to subscribe to notifications',
        unsubscriptionFailed: 'Failed to unsubscribe from notifications',
        updatePreferencesFailed: 'Failed to update notification preferences',

        // Test notifications
        testNotification: 'Send test notification',
        testNotificationSent: 'Test notification sent',
        testNotificationFailed: 'Failed to send test notification',
    },

    errors: {
        networkError: 'Network error occurred',
        serverError: 'Server error occurred',
        unknownError: 'An unknown error occurred',
        connectionTimeout: 'Connection timed out',
        authenticationFailed: 'Authentication failed',
        permissionDenied: 'Permission denied',
        fileNotFound: 'File not found',
        invalidFormat: 'Invalid format',
        operationFailed: 'Operation failed',
        tryAgain: 'Please try again',
        contactSupport: 'Contact support if the problem persists',
        sessionNotFound: 'Session not found',
        voiceSessionFailed: 'Failed to start voice session',
        voiceServiceUnavailable: 'Voice service is temporarily unavailable',
        oauthInitializationFailed: 'Failed to initialize OAuth flow',
        tokenStorageFailed: 'Failed to store authentication tokens',
        oauthStateMismatch: 'Security validation failed. Please try again',
        tokenExchangeFailed: 'Failed to exchange authorization code',
        oauthAuthorizationDenied: 'Authorization was denied',
        webViewLoadFailed: 'Failed to load authentication page',
        failedToLoadProfile: 'Failed to load user profile',
        userNotFound: 'User not found',
        sessionDeleted: 'Session has been deleted',
        sessionDeletedDescription: 'This session has been permanently removed',

        // Error functions with context
        fieldError: ({ field, reason }: { field: string; reason: string }) =>
            `${field}: ${reason}`,
        validationError: ({ field, min, max }: { field: string; min: number; max: number }) =>
            `${field} must be between ${min} and ${max}`,
        retryIn: ({ seconds }: { seconds: number }) =>
            `Retry in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`,
        errorWithCode: ({ message, code }: { message: string; code: number | string }) =>
            `${message} (Error ${code})`,
        disconnectServiceFailed: ({ service }: { service: string }) => 
            `Failed to disconnect ${service}`,
        connectServiceFailed: ({ service }: { service: string }) =>
            `Failed to connect ${service}. Please try again.`,
        failedToLoadFriends: 'Failed to load friends list',
        failedToAcceptRequest: 'Failed to accept friend request',
        failedToRejectRequest: 'Failed to reject friend request',
        failedToRemoveFriend: 'Failed to remove friend',
        searchFailed: 'Search failed. Please try again.',
        failedToSendRequest: 'Failed to send friend request',
        // Phase 2: Remote control errors
        controlFailed: 'Control operation failed',
        pauseFailed: 'Failed to pause session',
        resumeFailed: 'Failed to resume session',
        terminateFailed: 'Failed to terminate session',
        switchModeFailed: 'Failed to switch mode',
    },

    newSession: {
        // Used by new-session screen and launch flows
        title: 'Start New Session',
        noMachinesFound: 'No machines found. Start a Happy session on your computer first.',
        allMachinesOffline: 'All machines appear offline',
        machineDetails: 'View machine details →',
        directoryDoesNotExist: 'Directory Not Found',
        createDirectoryConfirm: ({ directory }: { directory: string }) => `The directory ${directory} does not exist. Do you want to create it?`,
        sessionStarted: 'Session Started',
        sessionStartedMessage: 'The session has been started successfully.',
        sessionSpawningFailed: 'Session spawning failed - no session ID returned.',
        startingSession: 'Starting session...',
        startNewSessionInFolder: 'New session here',
        failedToStart: 'Failed to start session. Make sure the daemon is running on the target machine.',
        sessionTimeout: 'Session startup timed out. The machine may be slow or the daemon may not be responding.',
        notConnectedToServer: 'Not connected to server. Check your internet connection.',
        noMachineSelected: 'Please select a machine to start the session',
        noPathSelected: 'Please select a directory to start the session in',
        sessionType: {
            title: 'Session Type',
            simple: 'Simple',
            worktree: 'Worktree',
            comingSoon: 'Coming soon',
        },
        worktree: {
            creating: ({ name }: { name: string }) => `Creating worktree '${name}'...`,
            notGitRepo: 'Worktrees require a git repository',
            failed: ({ error }: { error: string }) => `Failed to create worktree: ${error}`,
            success: 'Worktree created successfully',
        }
    },

    sessionHistory: {
        // Used by session history screen
        title: 'Session History',
        empty: 'No sessions found',
        today: 'Today',
        yesterday: 'Yesterday',
        daysAgo: ({ count }: { count: number }) => `${count} ${count === 1 ? 'day' : 'days'} ago`,
        viewAll: 'View all sessions',
    },

    session: {
        inputPlaceholder: 'Type a message ...',
        // Phase 2: Remote control
        pause: 'Pause',
        resume: 'Resume',
        paused: 'Paused',
        terminate: 'Terminate',
        terminateTitle: 'Terminate Session',
        terminateConfirm: 'Are you sure you want to terminate this session? This action cannot be undone.',
        switchMode: 'Switch Mode',
        switchModeTitle: 'Switch Session Mode',
        switchModeConfirm: ({ mode }: { mode: string }) => `Switch session to ${mode} mode?`,
        localModeBanner: 'Local mode - CLI has control',
    },

    // Phase 2: Approvals page
    approvals: {
        title: 'Pending Approvals',
        empty: 'No pending approvals',
        emptyDescription: 'Permission requests from your CLI sessions will appear here',
        waitingForApproval: 'Waiting for your approval',
        permissionRequest: 'Permission Request',
        expiresIn: ({ minutes }: { minutes: number }) => `Expires in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
        expired: 'Expired',
        viewSession: 'View Session',
    },

    commandPalette: {
        placeholder: 'Type a command or search...',
    },

    server: {
        // Used by Server Configuration screen (app/(app)/server.tsx)
        serverConfiguration: 'Server Configuration',
        enterServerUrl: 'Please enter a server URL',
        notValidHappyServer: 'Not a valid Happy Server',
        changeServer: 'Change Server',
        continueWithServer: 'Continue with this server?',
        resetToDefault: 'Reset to Default',
        resetServerDefault: 'Reset server to default?',
        validating: 'Validating...',
        validatingServer: 'Validating server...',
        serverReturnedError: 'Server returned an error',
        failedToConnectToServer: 'Failed to connect to server',
        currentlyUsingCustomServer: 'Currently using custom server',
        customServerUrlLabel: 'Custom Server URL',
        advancedFeatureFooter: "This is an advanced feature. Only change the server if you know what you're doing. You will need to log out and log in again after changing servers."
    },

    sessionInfo: {
        // Used by Session Info screen (app/(app)/session/[id]/info.tsx)
        killSession: 'Kill Session',
        killSessionConfirm: 'Are you sure you want to terminate this session?',
        archiveSession: 'Archive Session',
        archiveSessionConfirm: 'Are you sure you want to archive this session?',
        happySessionIdCopied: 'Happy Session ID copied to clipboard',
        failedToCopySessionId: 'Failed to copy Happy Session ID',
        happySessionId: 'Happy Session ID',
        claudeCodeSessionId: 'Claude Code Session ID',
        claudeCodeSessionIdCopied: 'Claude Code Session ID copied to clipboard',
        aiProvider: 'AI Provider',
        failedToCopyClaudeCodeSessionId: 'Failed to copy Claude Code Session ID',
        metadataCopied: 'Metadata copied to clipboard',
        failedToCopyMetadata: 'Failed to copy metadata',
        failedToKillSession: 'Failed to kill session',
        failedToArchiveSession: 'Failed to archive session',
        connectionStatus: 'Connection Status',
        created: 'Created',
        lastUpdated: 'Last Updated',
        sequence: 'Sequence',
        quickActions: 'Quick Actions',
        viewMachine: 'View Machine',
        viewMachineSubtitle: 'View machine details and sessions',
        killSessionSubtitle: 'Immediately terminate the session',
        archiveSessionSubtitle: 'Archive this session and stop it',
        metadata: 'Metadata',
        host: 'Host',
        path: 'Path',
        operatingSystem: 'Operating System',
        processId: 'Process ID',
        happyHome: 'Happy Home',
        copyMetadata: 'Copy Metadata',
        agentState: 'Agent State',
        controlledByUser: 'Controlled by User',
        pendingRequests: 'Pending Requests',
        activity: 'Activity',
        thinking: 'Thinking',
        thinkingSince: 'Thinking Since',
        cliVersion: 'CLI Version',
        cliVersionOutdated: 'CLI Update Required',
        cliVersionOutdatedMessage: ({ currentVersion, requiredVersion }: { currentVersion: string; requiredVersion: string }) =>
            `Version ${currentVersion} installed. Update to ${requiredVersion} or later`,
        updateCliInstructions: 'Please run npm install -g happy-coder@latest',
        deleteSession: 'Delete Session',
        deleteSessionSubtitle: 'Permanently remove this session',
        deleteSessionConfirm: 'Delete Session Permanently?',
        deleteSessionWarning: 'This action cannot be undone. All messages and data associated with this session will be permanently deleted.',
        failedToDeleteSession: 'Failed to delete session',
        sessionDeleted: 'Session deleted successfully',

    },

    // Used by SessionsList component (sources/components/SessionsList.tsx)
    sessionsList: {
        searchPlaceholder: 'Search sessions...',
        filterBackend: {
            all: 'All Backends',
            claude: 'Claude',
            codex: 'Codex',
            gemini: 'Gemini',
        },
        filterStatus: {
            all: 'All Status',
            active: 'Active',
            paused: 'Paused',
            offline: 'Offline',
        },
        clearFilters: 'Clear Filters',
        menu: {
            rename: 'Rename',
            delete: 'Delete',
            viewDetail: 'View Details',
        },
        rename: {
            title: 'Rename Session',
            placeholder: 'Enter session name...',
        },
        delete: {
            title: 'Delete Session',
            confirm: 'Are you sure you want to delete this session? This action cannot be undone.',
        },
        empty: {
            title: 'No Sessions',
            description: 'Connect a CLI to get started',
            filteredTitle: 'No Matching Sessions',
            filteredDescription: 'Try adjusting your filters',
        },
        noResults: 'No sessions match your search',
    },

    components: {
        emptyMainScreen: {
            // Used by EmptyMainScreen component
            readyToCode: 'Ready to code?',
            installCli: 'Install the Happy CLI',
            runIt: 'Run it',
            scanQrCode: 'Scan the QR code',
            openCamera: 'Open Camera',
        },
    },

    agentInput: {
        permissionMode: {
            title: 'PERMISSION MODE',
            default: 'Default',
            acceptEdits: 'Accept Edits',
            plan: 'Plan Mode',
            bypassPermissions: 'Yolo Mode',
            badgeAcceptAllEdits: 'Accept All Edits',
            badgeBypassAllPermissions: 'Bypass All Permissions',
            badgePlanMode: 'Plan Mode',
        },
        agent: {
            claude: 'Claude',
            codex: 'Codex',
            gemini: 'Gemini',
        },
        model: {
            title: 'MODEL',
            configureInCli: 'Configure models in CLI settings',
        },
        codexPermissionMode: {
            title: 'CODEX PERMISSION MODE',
            default: 'CLI Settings',
            readOnly: 'Read Only Mode',
            safeYolo: 'Safe YOLO',
            yolo: 'YOLO',
            badgeReadOnly: 'Read Only Mode',
            badgeSafeYolo: 'Safe YOLO',
            badgeYolo: 'YOLO',
        },
        geminiPermissionMode: {
            title: 'GEMINI PERMISSION MODE',
            default: 'Default',
            acceptEdits: 'Accept Edits',
            plan: 'Plan Mode',
            bypassPermissions: 'Yolo Mode',
            badgeAcceptAllEdits: 'Accept All Edits',
            badgeBypassAllPermissions: 'Bypass All Permissions',
            badgePlanMode: 'Plan Mode',
        },
        context: {
            remaining: ({ percent }: { percent: number }) => `${percent}% left`,
        },
        suggestion: {
            fileLabel: 'FILE',
            folderLabel: 'FOLDER',
        },
        noMachinesAvailable: 'No machines',
    },

    machineLauncher: {
        showLess: 'Show less',
        showAll: ({ count }: { count: number }) => `Show all (${count} paths)`,
        enterCustomPath: 'Enter custom path',
        offlineUnableToSpawn: 'Unable to spawn new session, offline',
    },

    sidebar: {
        sessionsTitle: 'Happy',
    },

    toolView: {
        input: 'Input',
        output: 'Output',
    },

    tools: {
        fullView: {
            description: 'Description',
            inputParams: 'Input Parameters',
            output: 'Output',
            error: 'Error',
            completed: 'Tool completed successfully',
            noOutput: 'No output was produced',
            running: 'Tool is running...',
            rawJsonDevMode: 'Raw JSON (Dev Mode)',
        },
        taskView: {
            initializing: 'Initializing agent...',
            moreTools: ({ count }: { count: number }) => `+${count} more ${plural({ count, singular: 'tool', plural: 'tools' })}`,
        },
        multiEdit: {
            editNumber: ({ index, total }: { index: number; total: number }) => `Edit ${index} of ${total}`,
            replaceAll: 'Replace All',
        },
        names: {
            task: 'Task',
            terminal: 'Terminal',
            searchFiles: 'Search Files',
            search: 'Search',
            searchContent: 'Search Content',
            listFiles: 'List Files',
            planProposal: 'Plan proposal',
            readFile: 'Read File',
            editFile: 'Edit File',
            writeFile: 'Write File',
            fetchUrl: 'Fetch URL',
            readNotebook: 'Read Notebook',
            editNotebook: 'Edit Notebook',
            todoList: 'Todo List',
            webSearch: 'Web Search',
            reasoning: 'Reasoning',
            applyChanges: 'Update file',
            viewDiff: 'Current file changes',
        },
        desc: {
            terminalCmd: ({ cmd }: { cmd: string }) => `Terminal(cmd: ${cmd})`,
            searchPattern: ({ pattern }: { pattern: string }) => `Search(pattern: ${pattern})`,
            searchPath: ({ basename }: { basename: string }) => `Search(path: ${basename})`,
            fetchUrlHost: ({ host }: { host: string }) => `Fetch URL(url: ${host})`,
            editNotebookMode: ({ path, mode }: { path: string; mode: string }) => `Edit Notebook(file: ${path}, mode: ${mode})`,
            todoListCount: ({ count }: { count: number }) => `Todo List(count: ${count})`,
            webSearchQuery: ({ query }: { query: string }) => `Web Search(query: ${query})`,
            grepPattern: ({ pattern }: { pattern: string }) => `grep(pattern: ${pattern})`,
            multiEditEdits: ({ path, count }: { path: string; count: number }) => `${path} (${count} edits)`,
            readingFile: ({ file }: { file: string }) => `Reading ${file}`,
            writingFile: ({ file }: { file: string }) => `Writing ${file}`,
            modifyingFile: ({ file }: { file: string }) => `Modifying ${file}`,
            modifyingFiles: ({ count }: { count: number }) => `Modifying ${count} files`,
            modifyingMultipleFiles: ({ file, count }: { file: string; count: number }) => `${file} and ${count} more`,
            showingDiff: 'Showing changes',
        }
    },

    files: {
        searchPlaceholder: 'Search files...',
        detachedHead: 'detached HEAD',
        summary: ({ staged, unstaged }: { staged: number; unstaged: number }) => `${staged} staged • ${unstaged} unstaged`,
        notRepo: 'Not a git repository',
        notUnderGit: 'This directory is not under git version control',
        searching: 'Searching files...',
        noFilesFound: 'No files found',
        noFilesInProject: 'No files in project',
        tryDifferentTerm: 'Try a different search term',
        searchResults: ({ count }: { count: number }) => `Search Results (${count})`,
        projectRoot: 'Project root',
        stagedChanges: ({ count }: { count: number }) => `Staged Changes (${count})`,
        unstagedChanges: ({ count }: { count: number }) => `Unstaged Changes (${count})`,
        // File viewer strings
        loadingFile: ({ fileName }: { fileName: string }) => `Loading ${fileName}...`,
        binaryFile: 'Binary File',
        cannotDisplayBinary: 'Cannot display binary file content',
        diff: 'Diff',
        file: 'File',
        fileEmpty: 'File is empty',
        noChanges: 'No changes to display',
    },

    settingsVoice: {
        // Voice settings screen
        languageTitle: 'Language',
        languageDescription: 'Choose your preferred language for voice assistant interactions. This setting syncs across all your devices.',
        preferredLanguage: 'Preferred Language',
        preferredLanguageSubtitle: 'Language used for voice assistant responses',
        language: {
            searchPlaceholder: 'Search languages...',
            title: 'Languages',
            footer: ({ count }: { count: number }) => `${count} ${plural({ count, singular: 'language', plural: 'languages' })} available`,
            autoDetect: 'Auto-detect',
        }
    },

    settingsAccount: {
        // Account settings screen
        accountInformation: 'Account Information',
        status: 'Status',
        statusActive: 'Active',
        statusNotAuthenticated: 'Not Authenticated',
        anonymousId: 'Anonymous ID',
        publicId: 'Public ID',
        notAvailable: 'Not available',
        linkNewDevice: 'Link New Device',
        linkNewDeviceSubtitle: 'Scan QR code to link device',
        profile: 'Profile',
        name: 'Name',
        github: 'GitHub',
        tapToDisconnect: 'Tap to disconnect',
        server: 'Server',
        backup: 'Backup',
        backupDescription: 'Your secret key is the only way to recover your account. Save it in a secure place like a password manager.',
        secretKey: 'Secret Key',
        tapToReveal: 'Tap to reveal',
        tapToHide: 'Tap to hide',
        secretKeyLabel: 'SECRET KEY (TAP TO COPY)',
        secretKeyCopied: 'Secret key copied to clipboard. Store it in a safe place!',
        secretKeyCopyFailed: 'Failed to copy secret key',
        privacy: 'Privacy',
        privacyDescription: 'Help improve the app by sharing anonymous usage data. No personal information is collected.',
        analytics: 'Analytics',
        analyticsDisabled: 'No data is shared',
        analyticsEnabled: 'Anonymous usage data is shared',
        dangerZone: 'Danger Zone',
        logout: 'Logout',
        logoutSubtitle: 'Sign out and clear local data',
        logoutConfirm: 'Are you sure you want to logout? Make sure you have backed up your secret key!',
    },

    settingsLanguage: {
        // Language settings screen
        title: 'Language',
        description: 'Choose your preferred language for the app interface. This will sync across all your devices.',
        currentLanguage: 'Current Language',
        automatic: 'Automatic',
        automaticSubtitle: 'Detect from device settings',
        needsRestart: 'Language Changed',
        needsRestartMessage: 'The app needs to restart to apply the new language setting.',
        restartNow: 'Restart Now',
    },

    connectButton: {
        authenticate: 'Authenticate Terminal',
        authenticateWithUrlPaste: 'Authenticate Terminal with URL paste',
        pasteAuthUrl: 'Paste the auth URL from your terminal',
    },

    updateBanner: {
        updateAvailable: 'Update available',
        pressToApply: 'Press to apply the update',
        whatsNew: "What's new",
        seeLatest: 'See the latest updates and improvements',
        nativeUpdateAvailable: 'App Update Available',
        tapToUpdateAppStore: 'Tap to update in App Store',
        tapToUpdatePlayStore: 'Tap to update in Play Store',
    },

    changelog: {
        // Used by the changelog screen
        version: ({ version }: { version: number }) => `Version ${version}`,
        noEntriesAvailable: 'No changelog entries available.',
    },

    terminal: {
        // Used by terminal connection screens
        webBrowserRequired: 'Web Browser Required',
        webBrowserRequiredDescription: 'Terminal connection links can only be opened in a web browser for security reasons. Please use the QR code scanner or open this link on a computer.',
        processingConnection: 'Processing connection...',
        invalidConnectionLink: 'Invalid Connection Link',
        invalidConnectionLinkDescription: 'The connection link is missing or invalid. Please check the URL and try again.',
        connectTerminal: 'Connect Terminal',
        terminalRequestDescription: 'A terminal is requesting to connect to your Happy Coder account. This will allow the terminal to send and receive messages securely.',
        connectionDetails: 'Connection Details',
        publicKey: 'Public Key',
        encryption: 'Encryption',
        endToEndEncrypted: 'End-to-end encrypted',
        acceptConnection: 'Accept Connection',
        connecting: 'Connecting...',
        reject: 'Reject',
        security: 'Security',
        securityFooter: 'This connection link was processed securely in your browser and was never sent to any server. Your private data will remain secure and only you can decrypt the messages.',
        securityFooterDevice: 'This connection was processed securely on your device and was never sent to any server. Your private data will remain secure and only you can decrypt the messages.',
        clientSideProcessing: 'Client-Side Processing',
        linkProcessedLocally: 'Link processed locally in browser',
        linkProcessedOnDevice: 'Link processed locally on device',
    },

    modals: {
        // Used across connect flows and settings
        authenticateTerminal: 'Authenticate Terminal',
        pasteUrlFromTerminal: 'Paste the authentication URL from your terminal',
        deviceLinkedSuccessfully: 'Device linked successfully',
        terminalConnectedSuccessfully: 'Terminal connected successfully',
        invalidAuthUrl: 'Invalid authentication URL',
        developerMode: 'Developer Mode',
        developerModeEnabled: 'Developer mode enabled',
        developerModeDisabled: 'Developer mode disabled',
        disconnectGithub: 'Disconnect GitHub',
        disconnectGithubConfirm: 'Are you sure you want to disconnect your GitHub account?',
        disconnectService: ({ service }: { service: string }) => 
            `Disconnect ${service}`,
        disconnectServiceConfirm: ({ service }: { service: string }) => 
            `Are you sure you want to disconnect ${service} from your account?`,
        disconnect: 'Disconnect',
        failedToConnectTerminal: 'Failed to connect terminal',
        cameraPermissionsRequiredToConnectTerminal: 'Camera permissions are required to connect terminal',
        failedToLinkDevice: 'Failed to link device',
        cameraPermissionsRequiredToScanQr: 'Camera permissions are required to scan QR codes'
    },

    navigation: {
        // Navigation titles and screen headers
        connectTerminal: 'Connect Terminal',
        linkNewDevice: 'Link New Device', 
        restoreWithSecretKey: 'Restore with Secret Key',
        whatsNew: "What's New",
        friends: 'Friends',
    },

    welcome: {
        // Main welcome screen for unauthenticated users
        title: 'Codex and Claude Code mobile client',
        subtitle: 'End-to-end encrypted and your account is stored only on your device.',
        createAccount: 'Create account',
        linkOrRestoreAccount: 'Link or restore account',
        loginWithMobileApp: 'Login with mobile app',
    },

    review: {
        // Used by utils/requestReview.ts
        enjoyingApp: 'Enjoying the app?',
        feedbackPrompt: "We'd love to hear your feedback!",
        yesILoveIt: 'Yes, I love it!',
        notReally: 'Not really'
    },

    items: {
        // Used by Item component for copy toast
        copiedToClipboard: ({ label }: { label: string }) => `${label} copied to clipboard`
    },

    machine: {
        launchNewSessionInDirectory: 'Launch New Session in Directory',
        offlineUnableToSpawn: 'Launcher disabled while machine is offline',
        offlineHelp: '• Make sure your computer is online\n• Run `happy daemon status` to diagnose\n• Are you running the latest CLI version? Upgrade with `npm install -g happy-coder@latest`',
        daemon: 'Daemon',
        status: 'Status',
        stopDaemon: 'Stop Daemon',
        lastKnownPid: 'Last Known PID',
        lastKnownHttpPort: 'Last Known HTTP Port',
        startedAt: 'Started At',
        cliVersion: 'CLI Version',
        daemonStateVersion: 'Daemon State Version',
        activeSessions: ({ count }: { count: number }) => `Active Sessions (${count})`,
        machineGroup: 'Machine',
        host: 'Host',
        machineId: 'Machine ID',
        username: 'Username',
        homeDirectory: 'Home Directory',
        platform: 'Platform',
        architecture: 'Architecture',
        lastSeen: 'Last Seen',
        never: 'Never',
        metadataVersion: 'Metadata Version',
        untitledSession: 'Untitled Session',
        back: 'Back',
    },

    message: {
        switchedToMode: ({ mode }: { mode: string }) => `Switched to ${mode} mode`,
        unknownEvent: 'Unknown event',
        usageLimitUntil: ({ time }: { time: string }) => `Usage limit reached until ${time}`,
        unknownTime: 'unknown time',
        // MessageStream detail modal
        details: 'Message Details',
        id: 'Message ID',
        timestamp: 'Timestamp',
        type: 'Type',
        encryption: 'Encryption',
        encrypted: 'Encrypted',
        unencrypted: 'Unencrypted',
        localId: 'Local ID',
    },

    commandQueue: {
        // Command Queue Management
        title: 'Command Queue',
        empty: 'Queue is empty',
        emptyDescription: 'Commands will appear here when you queue them while AI is busy',
        count: ({ count }: { count: number }) => `${count} command${count !== 1 ? 's' : ''} in queue`,
        clear: 'Clear All',
        clearTitle: 'Clear Queue',
        clearConfirm: 'Are you sure you want to clear all queued commands?',
        deleteTitle: 'Delete Command',
        deleteConfirm: 'Are you sure you want to delete this command?',
        editPlaceholder: 'Edit your command...',
        status: {
            pending: 'Pending',
            sending: 'Sending',
            sent: 'Sent',
            failed: 'Failed',
        },
    },

    codex: {
        // Codex permission dialog buttons
        permissions: {
            yesForSession: "Yes, and don't ask for a session",
            stopAndExplain: 'Stop, and explain what to do',
        }
    },

    claude: {
        // Claude permission dialog buttons
        permissions: {
            yesAllowAllEdits: 'Yes, allow all edits during this session',
            yesForTool: "Yes, don't ask again for this tool",
            noTellClaude: 'No, and tell Claude what to do differently',
        }
    },

    textSelection: {
        // Text selection screen
        selectText: 'Select text range',
        title: 'Select Text',
        noTextProvided: 'No text provided',
        textNotFound: 'Text not found or expired',
        textCopied: 'Text copied to clipboard',
        failedToCopy: 'Failed to copy text to clipboard',
        noTextToCopy: 'No text available to copy',
    },

    markdown: {
        // Markdown copy functionality
        codeCopied: 'Code copied',
        copyFailed: 'Copy failed',
        mermaidRenderFailed: 'Failed to render mermaid diagram',
    },

    artifacts: {
        // Artifacts feature
        title: 'Artifacts',
        countSingular: '1 artifact',
        countPlural: ({ count }: { count: number }) => `${count} artifacts`,
        empty: 'No artifacts yet',
        emptyDescription: 'Create your first artifact to get started',
        new: 'New Artifact',
        edit: 'Edit Artifact',
        delete: 'Delete',
        updateError: 'Failed to update artifact. Please try again.',
        notFound: 'Artifact not found',
        discardChanges: 'Discard changes?',
        discardChangesDescription: 'You have unsaved changes. Are you sure you want to discard them?',
        deleteConfirm: 'Delete artifact?',
        deleteConfirmDescription: 'This action cannot be undone',
        titleLabel: 'TITLE',
        titlePlaceholder: 'Enter a title for your artifact',
        bodyLabel: 'CONTENT',
        bodyPlaceholder: 'Write your content here...',
        emptyFieldsError: 'Please enter a title or content',
        createError: 'Failed to create artifact. Please try again.',
        save: 'Save',
        saving: 'Saving...',
        loading: 'Loading artifacts...',
        error: 'Failed to load artifact',
    },

    friends: {
        // Friends feature
        title: 'Friends',
        manageFriends: 'Manage your friends and connections',
        searchTitle: 'Find Friends',
        pendingRequests: 'Friend Requests',
        myFriends: 'My Friends',
        noFriendsYet: "You don't have any friends yet",
        findFriends: 'Find Friends',
        remove: 'Remove',
        pendingRequest: 'Pending',
        sentOn: ({ date }: { date: string }) => `Sent on ${date}`,
        accept: 'Accept',
        reject: 'Reject',
        addFriend: 'Add Friend',
        alreadyFriends: 'Already Friends',
        requestPending: 'Request Pending',
        searchInstructions: 'Enter a username to search for friends',
        searchPlaceholder: 'Enter username...',
        searching: 'Searching...',
        userNotFound: 'User not found',
        noUserFound: 'No user found with that username',
        checkUsername: 'Please check the username and try again',
        howToFind: 'How to Find Friends',
        findInstructions: 'Search for friends by their username. Both you and your friend need to have GitHub connected to send friend requests.',
        requestSent: 'Friend request sent!',
        requestAccepted: 'Friend request accepted!',
        requestRejected: 'Friend request rejected',
        friendRemoved: 'Friend removed',
        confirmRemove: 'Remove Friend',
        confirmRemoveMessage: 'Are you sure you want to remove this friend?',
        cannotAddYourself: 'You cannot send a friend request to yourself',
        bothMustHaveGithub: 'Both users must have GitHub connected to become friends',
        status: {
            none: 'Not connected',
            requested: 'Request sent',
            pending: 'Request pending',
            friend: 'Friends',
            rejected: 'Rejected',
        },
        acceptRequest: 'Accept Request',
        removeFriend: 'Remove Friend',
        removeFriendConfirm: ({ name }: { name: string }) => `Are you sure you want to remove ${name} as a friend?`,
        requestSentDescription: ({ name }: { name: string }) => `Your friend request has been sent to ${name}`,
        requestFriendship: 'Request friendship',
        cancelRequest: 'Cancel friendship request',
        cancelRequestConfirm: ({ name }: { name: string }) => `Cancel your friendship request to ${name}?`,
        denyRequest: 'Deny friendship',
        nowFriendsWith: ({ name }: { name: string }) => `You are now friends with ${name}`,
    },

    usage: {
        // Usage panel strings
        today: 'Today',
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        totalTokens: 'Total Tokens',
        totalCost: 'Total Cost',
        tokens: 'Tokens',
        cost: 'Cost',
        usageOverTime: 'Usage over time',
        byModel: 'By Model',
        noData: 'No usage data available',
    },

    feed: {
        // Feed notifications for friend requests and acceptances
        friendRequestFrom: ({ name }: { name: string }) => `${name} sent you a friend request`,
        friendRequestGeneric: 'New friend request',
        friendAccepted: ({ name }: { name: string }) => `You are now friends with ${name}`,
        friendAcceptedGeneric: 'Friend request accepted',
    },

    voice: {
        // Browser Native Voice I/O (Phase 4)
        // Browser capability messages
        browser: {
            notWebPlatform: 'Voice features are only available on web platform',
            outdatedBrowser: 'Please update your browser to use voice features',
            notSupported: 'Your browser does not support voice features',
        },

        // Voice error messages
        errors: {
            browserNotSupported: {
                title: 'Browser Not Supported',
                message: 'Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.',
                suggestion: 'Try switching to a supported browser like Chrome or Edge.',
            },
            microphonePermissionDenied: {
                title: 'Microphone Access Denied',
                message: 'Microphone permission was denied. Voice input requires microphone access.',
                suggestion: 'Please enable microphone access in your browser settings.',
            },
            networkError: {
                title: 'Network Error',
                message: 'A network error occurred during speech recognition.',
                suggestion: 'Please check your internet connection and try again.',
            },
            noSpeechDetected: {
                title: 'No Speech Detected',
                message: 'No speech was detected. Please speak clearly into the microphone.',
                suggestion: 'Try speaking louder or moving closer to the microphone.',
            },
            languageNotSupported: {
                title: 'Language Not Supported',
                message: 'The selected language is not supported by your browser.',
                suggestion: 'Please try selecting a different language in voice settings.',
            },
            synthesisError: {
                title: 'Speech Synthesis Error',
                message: 'An error occurred while generating speech output.',
                suggestion: 'Please try again or select a different voice.',
            },
            recognitionAborted: {
                title: 'Recognition Stopped',
                message: 'Speech recognition was stopped.',
                suggestion: 'Press the microphone button to start again.',
            },
            audioCaptureError: {
                title: 'Audio Capture Failed',
                message: 'Failed to capture audio from microphone.',
                suggestion: 'Check if another application is using the microphone.',
            },
            serviceUnavailable: {
                title: 'Service Unavailable',
                message: 'The speech recognition service is temporarily unavailable.',
                suggestion: 'Please wait a moment and try again.',
            },
            unknown: {
                title: 'Unknown Error',
                message: 'An unexpected error occurred with voice features.',
                suggestion: 'Please try again. If the problem persists, refresh the page.',
            },
        },

        // Voice controls
        controls: {
            startListening: 'Start listening',
            stopListening: 'Stop listening',
            startSpeaking: 'Read aloud',
            stopSpeaking: 'Stop reading',
            listening: 'Listening...',
            speaking: 'Speaking...',
            processing: 'Processing...',
        },

        // Voice settings
        settings: {
            title: 'Voice Settings',
            provider: 'Voice Provider',
            providerDescription: 'Choose your preferred voice provider',
            providerBrowser: 'Browser Native',
            providerElevenLabs: 'ElevenLabs',
            input: 'Voice Input',
            inputDescription: 'Enable speech-to-text for voice commands',
            inputEnabled: 'Voice input enabled',
            inputDisabled: 'Voice input disabled',
            output: 'Voice Output',
            outputDescription: 'Enable text-to-speech for responses',
            outputEnabled: 'Voice output enabled',
            outputDisabled: 'Voice output disabled',
            recognitionLanguage: 'Recognition Language',
            recognitionLanguageDescription: 'Language for speech recognition',
            recognitionLanguageFooter: ({ count }: { count: number }) => `${count} languages available`,
            speechRate: 'Speech Rate',
            speechRateDescription: 'Adjust the speed of voice output',
            speechPitch: 'Speech Pitch',
            speechPitchDescription: 'Adjust the pitch of voice output',
            speechVolume: 'Speech Volume',
            speechVolumeDescription: 'Adjust the volume of voice output',
            selectedVoice: 'Voice',
            selectedVoiceDescription: 'Choose a voice for speech output',
            systemDefault: 'System Default',
            testVoice: 'Test Voice',
            testVoiceText: 'This is a test of the text-to-speech voice.',
            browserNotSupported: 'Browser voice features are not supported',
            browserNotSupportedDescription: 'Your browser does not support the Web Speech API. Please use Chrome, Edge, or Safari.',
        },
    },

    pwa: {
        install: {
            title: 'Install Happy Coder',
            message: 'Install Happy Coder for a better experience with offline access and push notifications.',
            installButton: 'Install',
            notNow: 'Not Now',
            installed: 'App Installed',
            installedMessage: 'Happy Coder has been installed. You can now access it from your home screen.',
        },
        offline: {
            title: 'You are offline',
            message: 'Some features may be limited while offline.',
            reconnecting: 'Reconnecting...',
            reconnected: 'Back online',
        },
        update: {
            title: 'Update Available',
            message: 'A new version of Happy Coder is available.',
            updateButton: 'Update Now',
            later: 'Later',
        },
        notifications: {
            title: 'Push Notifications',
            description: 'Get notified about approval requests and updates.',
            enable: 'Enable Notifications',
            disable: 'Disable Notifications',
            permissionDenied: 'Notifications are blocked',
            permissionDeniedMessage: 'Please enable notifications in your browser settings.',
            subscribed: 'Notifications enabled',
            unsubscribed: 'Notifications disabled',
            preferences: 'Notification Preferences',
            approvalRequests: 'Approval Requests',
            approvalRequestsDescription: 'Get notified when someone requests your approval',
            taskComplete: 'Task Complete',
            taskCompleteDescription: 'Get notified when tasks are completed',
            newMessage: 'New Messages',
            newMessageDescription: 'Get notified about new messages',
            systemAnnouncements: 'System Announcements',
            systemAnnouncementsDescription: 'Important updates and announcements',
            muteAll: 'Mute All',
            muteAllDescription: 'Temporarily disable all notifications',
        },
    },
} as const;

export type Translations = typeof en;

/**
 * Helper type to recursively convert string literals to string type
 * Preserves functions and handles nested objects up to 4 levels deep
 */
type DeepStringify<T> = T extends string
    ? string
    : T extends (...args: any[]) => string
        ? T
        : T extends object
            ? { readonly [K in keyof T]: DeepStringify<T[K]> }
            : T;

/**
 * Generic translation type that matches the structure of Translations
 * but allows different string values (for other languages)
 */
export type TranslationStructure = {
    readonly [K in keyof Translations]: {
        readonly [P in keyof Translations[K]]: DeepStringify<Translations[K][P]>
    }
};
