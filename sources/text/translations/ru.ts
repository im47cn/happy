import type { TranslationStructure } from '../_default';

/**
 * Russian plural helper function
 * Russian has 3 plural forms: one, few, many
 * @param options - Object containing count and the three plural forms
 * @returns The appropriate form based on Russian plural rules
 */
function plural({ count, one, few, many }: { count: number; one: string; few: string; many: string }): string {
    const n = Math.abs(count);
    const n10 = n % 10;
    const n100 = n % 100;
    
    // Rule: ends in 1 but not 11
    if (n10 === 1 && n100 !== 11) return one;
    
    // Rule: ends in 2-4 but not 12-14
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
    
    // Rule: everything else (0, 5-9, 11-19, etc.)
    return many;
}

/**
 * Russian translations for the Happy app
 * Must match the exact structure of the English translations
 */
export const ru: TranslationStructure = {
    tabs: {
        // Tab navigation labels
        inbox: 'Входящие',
        sessions: 'Терминалы',
        settings: 'Настройки',
    },

    inbox: {
        // Inbox screen
        emptyTitle: 'Входящие пусты',
        emptyDescription: 'Подключитесь к друзьям, чтобы начать делиться сессиями',
        updates: 'Обновления',
    },

    common: {
        // Simple string constants
        cancel: 'Отмена',
        authenticate: 'Авторизация',
        save: 'Сохранить',
        error: 'Ошибка',
        success: 'Успешно',
        ok: 'ОК',
        continue: 'Продолжить',
        back: 'Назад',
        create: 'Создать',
        rename: 'Переименовать',
        reset: 'Сбросить',
        logout: 'Выйти',
        yes: 'Да',
        no: 'Нет',
        discard: 'Отменить',
        version: 'Версия',
        copied: 'Скопировано',
        copy: 'Копировать',
        scanning: 'Сканирование...',
        urlPlaceholder: 'https://example.com',
        home: 'Главная',
        message: 'Сообщение',
        files: 'Файлы',
        fileViewer: 'Просмотр файла',
        loading: 'Загрузка...',
        retry: 'Повторить',
        delete: 'Удалить',
        edit: 'Редактировать',
    },

    connect: {
        restoreAccount: 'Восстановить аккаунт',
        enterSecretKey: 'Пожалуйста, введите секретный ключ',
        invalidSecretKey: 'Неверный секретный ключ. Проверьте и попробуйте снова.',
        enterUrlManually: 'Ввести URL вручную',
    },

    settings: {
        title: 'Настройки',
        connectedAccounts: 'Подключенные аккаунты',
        connectAccount: 'Подключить аккаунт',
        github: 'GitHub',
        machines: 'Машины',
        features: 'Функции',
        social: 'Социальное',
        account: 'Аккаунт',
        accountSubtitle: 'Управление учётной записью',
        appearance: 'Внешний вид',
        appearanceSubtitle: 'Настройка внешнего вида приложения',
        voiceAssistant: 'Голосовой ассистент',
        voiceAssistantSubtitle: 'Настройка предпочтений голосового взаимодействия',
        featuresTitle: 'Возможности',
        featuresSubtitle: 'Включить или отключить функции приложения',
        notifications: 'Уведомления',
        notificationsSubtitle: 'Управление настройками push-уведомлений',
        developer: 'Разработчик',
        developerTools: 'Инструменты разработчика',
        about: 'О программе',
        aboutFooter: 'Happy Coder — мобильное приложение для работы с Codex и Claude Code. Использует сквозное шифрование, все данные аккаунта хранятся только на вашем устройстве. Не связано с Anthropic.',
        whatsNew: 'Что нового',
        whatsNewSubtitle: 'Посмотреть последние обновления и улучшения',
        reportIssue: 'Сообщить о проблеме',
        privacyPolicy: 'Политика конфиденциальности',
        termsOfService: 'Условия использования',
        eula: 'EULA',
        supportUs: 'Поддержите нас',
        supportUsSubtitlePro: 'Спасибо за вашу поддержку!',
        supportUsSubtitle: 'Поддержать разработку проекта',
        scanQrCodeToAuthenticate: 'Отсканируйте QR-код для авторизации',
        githubConnected: ({ login }: { login: string }) => `Подключен как @${login}`,
        connectGithubAccount: 'Подключить аккаунт GitHub',
        claudeAuthSuccess: 'Успешно подключено к Claude',
        exchangingTokens: 'Обмен токенов...',
        usage: 'Использование',
        usageSubtitle: 'Просмотр использования API и затрат',

        // Dynamic settings messages
        accountConnected: ({ service }: { service: string }) => `Аккаунт ${service} подключен`,
        machineStatus: ({ name, status }: { name: string; status: 'online' | 'offline' }) =>
            `${name} ${status === 'online' ? 'online' : 'offline'}`,
        featureToggled: ({ feature, enabled }: { feature: string; enabled: boolean }) =>
            `${feature} ${enabled ? 'включена' : 'отключена'}`,
    },

    settingsAppearance: {
        // Appearance settings screen
        theme: 'Тема',
        themeDescription: 'Выберите предпочтительную цветовую схему',
        themeOptions: {
            adaptive: 'Адаптивная',
            light: 'Светлая', 
            dark: 'Тёмная',
        },
        themeDescriptions: {
            adaptive: 'Следовать настройкам системы',
            light: 'Всегда использовать светлую тему',
            dark: 'Всегда использовать тёмную тему',
        },
        display: 'Отображение',
        displayDescription: 'Управление макетом и интервалами',
        inlineToolCalls: 'Встроенные вызовы инструментов',
        inlineToolCallsDescription: 'Отображать вызовы инструментов прямо в сообщениях чата',
        expandTodoLists: 'Развернуть списки задач',
        expandTodoListsDescription: 'Показывать все задачи вместо только изменений',
        showLineNumbersInDiffs: 'Показывать номера строк в различиях',
        showLineNumbersInDiffsDescription: 'Отображать номера строк в различиях кода',
        showLineNumbersInToolViews: 'Показывать номера строк в представлениях инструментов',
        showLineNumbersInToolViewsDescription: 'Отображать номера строк в различиях представлений инструментов',
        wrapLinesInDiffs: 'Перенос строк в различиях',
        wrapLinesInDiffsDescription: 'Переносить длинные строки вместо горизонтальной прокрутки в представлениях различий',
        alwaysShowContextSize: 'Всегда показывать размер контекста',
        alwaysShowContextSizeDescription: 'Отображать использование контекста даже когда не близко к лимиту',
        avatarStyle: 'Стиль аватара',
        avatarStyleDescription: 'Выберите внешний вид аватара сессии',
        avatarOptions: {
            pixelated: 'Пиксельная',
            gradient: 'Градиентная',
            brutalist: 'Бруталистская',
        },
        showFlavorIcons: 'Показывать иконки провайдеров ИИ',
        showFlavorIconsDescription: 'Отображать иконки провайдеров ИИ на аватарах сессий',
        compactSessionView: 'Компактный вид сессий',
        compactSessionViewDescription: 'Отображать активные сессии в более компактном виде',
    },

    settingsFeatures: {
        // Features settings screen
        experiments: 'Эксперименты',
        experimentsDescription: 'Включить экспериментальные функции, которые всё ещё разрабатываются. Эти функции могут быть нестабильными или изменяться без предупреждения.',
        experimentalFeatures: 'Экспериментальные функции',
        experimentalFeaturesEnabled: 'Экспериментальные функции включены',
        experimentalFeaturesDisabled: 'Используются только стабильные функции',
        webFeatures: 'Веб-функции',
        webFeaturesDescription: 'Функции, доступные только в веб-версии приложения.',
        commandPalette: 'Command Palette',
        commandPaletteEnabled: 'Нажмите ⌘K для открытия',
        commandPaletteDisabled: 'Быстрый доступ к командам отключён',
        markdownCopyV2: 'Markdown Copy v2',
        markdownCopyV2Subtitle: 'Долгое нажатие открывает модальное окно копирования',
        hideInactiveSessions: 'Скрывать неактивные сессии',
        hideInactiveSessionsSubtitle: 'Показывать в списке только активные чаты',
    },

    errors: {
        networkError: 'Произошла ошибка сети',
        serverError: 'Произошла ошибка сервера',
        unknownError: 'Произошла неизвестная ошибка',
        connectionTimeout: 'Время соединения истекло',
        authenticationFailed: 'Ошибка авторизации',
        permissionDenied: 'Доступ запрещен',
        fileNotFound: 'Файл не найден',
        invalidFormat: 'Неверный формат',
        operationFailed: 'Операция не выполнена',
        tryAgain: 'Пожалуйста, попробуйте снова',
        contactSupport: 'Если проблема сохранится, обратитесь в поддержку',
        sessionNotFound: 'Сессия не найдена',
        voiceSessionFailed: 'Не удалось запустить голосовую сессию',
        voiceServiceUnavailable: 'Голосовой сервис временно недоступен',
        oauthInitializationFailed: 'Не удалось инициализировать процесс OAuth',
        tokenStorageFailed: 'Не удалось сохранить токены аутентификации',
        oauthStateMismatch: 'Ошибка проверки безопасности. Попробуйте снова',
        tokenExchangeFailed: 'Не удалось обменять код авторизации',
        oauthAuthorizationDenied: 'В авторизации отказано',
        webViewLoadFailed: 'Не удалось загрузить страницу аутентификации',
        failedToLoadProfile: 'Не удалось загрузить профиль пользователя',
        userNotFound: 'Пользователь не найден',
        sessionDeleted: 'Сессия была удалена',
        sessionDeletedDescription: 'Эта сессия была окончательно удалена',

        // Error functions with context
        fieldError: ({ field, reason }: { field: string; reason: string }) =>
            `${field}: ${reason}`,
        validationError: ({ field, min, max }: { field: string; min: number; max: number }) =>
            `${field} должно быть от ${min} до ${max}`,
        retryIn: ({ seconds }: { seconds: number }) =>
            `Повторить через ${seconds} ${plural({ count: seconds, one: 'секунду', few: 'секунды', many: 'секунд' })}`,
        errorWithCode: ({ message, code }: { message: string; code: number | string }) =>
            `${message} (Ошибка ${code})`,
        disconnectServiceFailed: ({ service }: { service: string }) => 
            `Не удалось отключить ${service}`,
        connectServiceFailed: ({ service }: { service: string }) =>
            `Не удалось подключить ${service}. Пожалуйста, попробуйте снова.`,
        failedToLoadFriends: 'Не удалось загрузить список друзей',
        failedToAcceptRequest: 'Не удалось принять запрос в друзья',
        failedToRejectRequest: 'Не удалось отклонить запрос в друзья',
        failedToRemoveFriend: 'Не удалось удалить друга',
        searchFailed: 'Поиск не удался. Пожалуйста, попробуйте снова.',
        failedToSendRequest: 'Не удалось отправить запрос в друзья',
        notConnectedToServer: 'Нет подключения к сети. Пожалуйста, проверьте ваше интернет-соединение.',
        // Phase 2: Remote control errors
        controlFailed: 'Ошибка операции управления',
        pauseFailed: 'Не удалось приостановить сессию',
        resumeFailed: 'Не удалось возобновить сессию',
        terminateFailed: 'Не удалось завершить сессию',
        switchModeFailed: 'Не удалось переключить режим',
    },

    newSession: {
        // Used by new-session screen and launch flows
        title: 'Начать новую сессию',
        noMachinesFound: 'Машины не найдены. Сначала запустите сессию Happy на вашем компьютере.',
        allMachinesOffline: 'Все машины находятся offline',
        machineDetails: 'Посмотреть детали машины →',
        directoryDoesNotExist: 'Директория не найдена',
        createDirectoryConfirm: ({ directory }: { directory: string }) => `Директория ${directory} не существует. Хотите создать её?`,
        sessionStarted: 'Сессия запущена',
        sessionStartedMessage: 'Сессия успешно запущена.',
        sessionSpawningFailed: 'Ошибка создания сессии - ID сессии не получен.',
        failedToStart: 'Не удалось запустить сессию. Убедитесь, что daemon запущен на целевой машине.',
        sessionTimeout: 'Время запуска сессии истекло. Машина может работать медленно или daemon не отвечает.',
        notConnectedToServer: 'Нет подключения к серверу. Проверьте интернет-соединение.',
        startingSession: 'Запуск сессии...',
        startNewSessionInFolder: 'Новая сессия здесь',
        noMachineSelected: 'Пожалуйста, выберите машину для запуска сессии',
        noPathSelected: 'Пожалуйста, выберите директорию для запуска сессии',
        sessionType: {
            title: 'Тип сессии',
            simple: 'Простая',
            worktree: 'Worktree',
            comingSoon: 'Скоро будет доступно',
        },
        worktree: {
            creating: ({ name }: { name: string }) => `Создание worktree '${name}'...`,
            notGitRepo: 'Worktree требует наличия git репозитория',
            failed: ({ error }: { error: string }) => `Не удалось создать worktree: ${error}`,
            success: 'Worktree успешно создан',
        }
    },

    sessionHistory: {
        // Used by session history screen
        title: 'История сессий',
        empty: 'Сессии не найдены',
        today: 'Сегодня',
        yesterday: 'Вчера',
        daysAgo: ({ count }: { count: number }) => `${count} ${plural({ count, one: 'день', few: 'дня', many: 'дней' })} назад`,
        viewAll: 'Посмотреть все сессии',
    },

    server: {
        // Used by Server Configuration screen (app/(app)/server.tsx)
        serverConfiguration: 'Настройка сервера',
        enterServerUrl: 'Пожалуйста, введите URL сервера',
        notValidHappyServer: 'Это не валидный сервер Happy',
        changeServer: 'Изменить сервер',
        continueWithServer: 'Продолжить с этим сервером?',
        resetToDefault: 'Сбросить по умолчанию',
        resetServerDefault: 'Сбросить сервер по умолчанию?',
        validating: 'Проверка...',
        validatingServer: 'Проверка сервера...',
        serverReturnedError: 'Сервер вернул ошибку',
        failedToConnectToServer: 'Не удалось подключиться к серверу',
        currentlyUsingCustomServer: 'Сейчас используется пользовательский сервер',
        customServerUrlLabel: 'URL пользовательского сервера',
        advancedFeatureFooter: 'Это расширенная функция. Изменяйте сервер только если знаете, что делаете. Вам нужно будет выйти и войти снова после изменения серверов.',
        scanQrCode: 'Сканировать QR-код',
        protocolLabel: 'Протокол',
        hostnameLabel: 'Имя хоста / IP-адрес',
        portLabel: 'Порт',
        testConnection: 'Проверить подключение',
        connectionSuccess: 'Подключение успешно',
        serverConfigScanned: 'Конфигурация сервера успешно сканирована',
        invalidQrCode: 'Неверный формат QR-кода',
        networkUnavailable: 'Сеть недоступна. Проверьте подключение.',
    },

    sessionInfo: {
        // Used by Session Info screen (app/(app)/session/[id]/info.tsx)
        killSession: 'Завершить сессию',
        killSessionConfirm: 'Вы уверены, что хотите завершить эту сессию?',
        archiveSession: 'Архивировать сессию',
        archiveSessionConfirm: 'Вы уверены, что хотите архивировать эту сессию?',
        happySessionIdCopied: 'ID сессии Happy скопирован в буфер обмена',
        failedToCopySessionId: 'Не удалось скопировать ID сессии Happy',
        happySessionId: 'ID сессии Happy',
        claudeCodeSessionId: 'ID сессии Claude Code',
        claudeCodeSessionIdCopied: 'ID сессии Claude Code скопирован в буфер обмена',
        aiProvider: 'Поставщик ИИ',
        failedToCopyClaudeCodeSessionId: 'Не удалось скопировать ID сессии Claude Code',
        metadataCopied: 'Метаданные скопированы в буфер обмена',
        failedToCopyMetadata: 'Не удалось скопировать метаданные',
        failedToKillSession: 'Не удалось завершить сессию',
        failedToArchiveSession: 'Не удалось архивировать сессию',
        connectionStatus: 'Статус подключения',
        created: 'Создано',
        lastUpdated: 'Последнее обновление',
        sequence: 'Последовательность',
        quickActions: 'Быстрые действия',
        viewMachine: 'Посмотреть машину',
        viewMachineSubtitle: 'Посмотреть детали машины и сессии',
        killSessionSubtitle: 'Немедленно завершить сессию',
        archiveSessionSubtitle: 'Архивировать эту сессию и остановить её',
        metadata: 'Метаданные',
        host: 'Хост',
        path: 'Путь',
        operatingSystem: 'Операционная система',
        processId: 'ID процесса',
        happyHome: 'Домашний каталог Happy',
        copyMetadata: 'Копировать метаданные',
        agentState: 'Состояние агента',
        controlledByUser: 'Управляется пользователем',
        pendingRequests: 'Ожидающие запросы',
        activity: 'Активность',
        thinking: 'Думает',
        thinkingSince: 'Думает с',
        cliVersion: 'Версия CLI',
        cliVersionOutdated: 'Требуется обновление CLI',
        cliVersionOutdatedMessage: ({ currentVersion, requiredVersion }: { currentVersion: string; requiredVersion: string }) =>
            `Установлена версия ${currentVersion}. Обновите до ${requiredVersion} или новее`,
        updateCliInstructions: 'Пожалуйста, выполните npm install -g happy-coder@latest',
        deleteSession: 'Удалить сессию',
        deleteSessionSubtitle: 'Удалить эту сессию навсегда',
        deleteSessionConfirm: 'Удалить сессию навсегда?',
        deleteSessionWarning: 'Это действие нельзя отменить. Все сообщения и данные, связанные с этой сессией, будут удалены навсегда.',
        failedToDeleteSession: 'Не удалось удалить сессию',
        sessionDeleted: 'Сессия успешно удалена',
    },

    sessionsList: {
        // Used by SessionsList component (app/(app)/(tabs)/sessions.tsx)
        searchPlaceholder: 'Поиск сессий...',
        filterBackend: {
            all: 'Все',
            claude: 'Claude',
            codex: 'Codex',
            gemini: 'Gemini',
        },
        filterStatus: {
            all: 'Все статусы',
            active: 'Активные',
            paused: 'Приостановленные',
            offline: 'Офлайн',
        },
        clearFilters: 'Сбросить фильтры',
        menu: {
            rename: 'Переименовать',
            delete: 'Удалить',
            viewDetail: 'Подробнее',
        },
        rename: {
            title: 'Переименовать сессию',
            placeholder: 'Введите название сессии...',
        },
        delete: {
            title: 'Удалить сессию',
            confirm: 'Вы уверены, что хотите удалить эту сессию? Это действие нельзя отменить.',
        },
        empty: {
            title: 'Нет сессий',
            description: 'Подключите CLI, чтобы начать',
            filteredTitle: 'Нет подходящих сессий',
            filteredDescription: 'Попробуйте изменить фильтры',
        },
        noResults: 'Нет сессий, соответствующих поиску',
    },

    components: {
        emptyMainScreen: {
            // Used by EmptyMainScreen component
            readyToCode: 'Готовы к программированию?',
            installCli: 'Установите Happy CLI',
            runIt: 'Запустите его',
            scanQrCode: 'Отсканируйте QR-код',
            openCamera: 'Открыть камеру',
        },
    },

    profile: {
        userProfile: 'Профиль пользователя',
        details: 'Детали',
        firstName: 'Имя',
        lastName: 'Фамилия',
        username: 'Имя пользователя',
        status: 'Статус',
    },

    status: {
        connected: 'подключено',
        connecting: 'подключение',
        disconnected: 'отключено',
        error: 'ошибка',
        online: 'online',
        offline: 'offline',
        lastSeen: ({ time }: { time: string }) => `в сети ${time}`,
        permissionRequired: 'требуется разрешение',
        activeNow: 'Активен сейчас',
        unknown: 'неизвестно',
    },

    time: {
        justNow: 'только что',
        minutesAgo: ({ count }: { count: number }) => `${count} ${plural({ count, one: 'минуту', few: 'минуты', many: 'минут' })} назад`,
        hoursAgo: ({ count }: { count: number }) => `${count} ${plural({ count, one: 'час', few: 'часа', many: 'часов' })} назад`,
    },

    connectionIndicator: {
        title: 'Состояние соединения',
        server: 'Сервер',
        defaultServer: 'Happy Server',
        lastConnected: 'Последнее подключение',
        lastDisconnected: 'Последнее отключение',
        reconnect: 'Переподключиться',
        reconnecting: 'Переподключение...',
    },

    session: {
        inputPlaceholder: 'Введите сообщение...',
        // Phase 2: Remote control
        pause: 'Пауза',
        resume: 'Возобновить',
        paused: 'На паузе',
        terminate: 'Завершить',
        terminateTitle: 'Завершить сессию',
        terminateConfirm: 'Вы уверены, что хотите завершить эту сессию? Это действие нельзя отменить.',
        switchMode: 'Сменить режим',
        switchModeTitle: 'Переключить режим сессии',
        switchModeConfirm: ({ mode }: { mode: string }) => `Переключить сессию в режим ${mode}?`,
        localModeBanner: 'Локальный режим - CLI управляет',
    },

    // Phase 2: Approvals page
    approvals: {
        title: 'Ожидающие одобрения',
        empty: 'Нет ожидающих одобрений',
        emptyDescription: 'Запросы разрешений от ваших CLI-сессий появятся здесь',
        waitingForApproval: 'Ожидает вашего одобрения',
        permissionRequest: 'Запрос разрешения',
        expiresIn: ({ minutes }: { minutes: number }) => `Истекает через ${minutes} ${minutes === 1 ? 'минуту' : 'минут'}`,
        expired: 'Истёк',
        viewSession: 'Просмотр сессии',
    },

    // Phase 2: Approval Dialog Modal
    approvalDialog: {
        approve: 'Одобрить',
        reject: 'Отклонить',
        modify: 'Изменить',
        confirmReject: 'Подтвердить отклонение',
        confirmModify: 'Подтвердить изменение',
        operation: 'Операция',
        riskLevel: 'Уровень риска',
        requestedAt: 'Запрошено',
        parameters: 'Параметры',
        rejectReasonLabel: 'Причина отклонения (необязательно)',
        rejectReasonPlaceholder: 'Введите причину отклонения...',
        modifyParamsLabel: 'Изменённые параметры (JSON)',
        approveError: 'Не удалось одобрить. Попробуйте ещё раз.',
        rejectError: 'Не удалось отклонить. Попробуйте ещё раз.',
        modifyError: 'Не удалось изменить. Попробуйте ещё раз.',
        invalidJson: 'Неверный формат JSON. Проверьте ввод.',
    },

    commandPalette: {
        placeholder: 'Введите команду или поиск...',
    },

    agentInput: {
        permissionMode: {
            title: 'РЕЖИМ РАЗРЕШЕНИЙ',
            default: 'По умолчанию',
            acceptEdits: 'Принимать правки',
            plan: 'Режим планирования',
            bypassPermissions: 'YOLO режим',
            badgeAcceptAllEdits: 'Принимать все правки',
            badgeBypassAllPermissions: 'Обход всех разрешений',
            badgePlanMode: 'Режим планирования',
        },
        agent: {
            claude: 'Claude',
            codex: 'Codex',
            gemini: 'Gemini',
        },
        model: {
            title: 'МОДЕЛЬ',
            configureInCli: 'Настройте модели в настройках CLI',
        },
        codexPermissionMode: {
            title: 'РЕЖИМ РАЗРЕШЕНИЙ CODEX',
            default: 'Настройки CLI',
            readOnly: 'Read Only Mode',
            safeYolo: 'Safe YOLO',
            yolo: 'YOLO',
            badgeReadOnly: 'Только чтение',
            badgeSafeYolo: 'Safe YOLO',
            badgeYolo: 'YOLO',
        },
        geminiPermissionMode: {
            title: 'РЕЖИМ РАЗРЕШЕНИЙ',
            default: 'По умолчанию',
            acceptEdits: 'Принимать правки',
            plan: 'Режим планирования',
            bypassPermissions: 'YOLO режим',
            badgeAcceptAllEdits: 'Принимать все правки',
            badgeBypassAllPermissions: 'Обход всех разрешений',
            badgePlanMode: 'Режим планирования',
        },
        context: {
            remaining: ({ percent }: { percent: number }) => `Осталось ${percent}%`,
        },
        suggestion: {
            fileLabel: 'ФАЙЛ',
            folderLabel: 'ПАПКА',
        },
        noMachinesAvailable: 'Нет машин',
    },

    machineLauncher: {
        showLess: 'Показать меньше',
        showAll: ({ count }: { count: number }) => `Показать все (${count} ${plural({ count, one: 'путь', few: 'пути', many: 'путей' })})`,
        enterCustomPath: 'Ввести свой путь',
        offlineUnableToSpawn: 'Невозможно создать сессию, машина offline',
    },

    sidebar: {
        sessionsTitle: 'Happy',
    },

    toolView: {
        input: 'Входные данные',
        output: 'Результат',
    },

    tools: {
        fullView: {
            description: 'Описание',
            inputParams: 'Входные параметры',
            output: 'Результат',
            error: 'Ошибка',
            completed: 'Инструмент выполнен успешно',
            noOutput: 'Результат не получен',
            running: 'Выполняется...',
            rawJsonDevMode: 'Исходный JSON (режим разработчика)',
        },
        taskView: {
            initializing: 'Инициализация агента...',
            moreTools: ({ count }: { count: number }) => `+${count} ещё ${plural({ count, one: 'инструмент', few: 'инструмента', many: 'инструментов' })}`,
        },
        multiEdit: {
            editNumber: ({ index, total }: { index: number; total: number }) => `Правка ${index} из ${total}`,
            replaceAll: 'Заменить все',
        },
        names: {
            task: 'Задача',
            terminal: 'Терминал',
            searchFiles: 'Поиск файлов',
            search: 'Поиск',
            searchContent: 'Поиск содержимого',
            listFiles: 'Список файлов',
            planProposal: 'Предложение плана',
            readFile: 'Чтение файла',
            editFile: 'Редактирование файла',
            writeFile: 'Запись файла',
            fetchUrl: 'Получение URL',
            readNotebook: 'Чтение блокнота',
            editNotebook: 'Редактирование блокнота',
            todoList: 'Список задач',
            webSearch: 'Веб-поиск',
            reasoning: 'Рассуждение',
            applyChanges: 'Обновить файл',
            viewDiff: 'Текущие изменения файла',
        },
        desc: {
            terminalCmd: ({ cmd }: { cmd: string }) => `Терминал(команда: ${cmd})`,
            searchPattern: ({ pattern }: { pattern: string }) => `Поиск(шаблон: ${pattern})`,
            searchPath: ({ basename }: { basename: string }) => `Поиск(путь: ${basename})`,
            fetchUrlHost: ({ host }: { host: string }) => `Получение URL(адрес: ${host})`,
            editNotebookMode: ({ path, mode }: { path: string; mode: string }) => `Редактирование блокнота(файл: ${path}, режим: ${mode})`,
            todoListCount: ({ count }: { count: number }) => `Список задач(количество: ${count})`,
            webSearchQuery: ({ query }: { query: string }) => `Веб-поиск(запрос: ${query})`,
            grepPattern: ({ pattern }: { pattern: string }) => `grep(шаблон: ${pattern})`,
            multiEditEdits: ({ path, count }: { path: string; count: number }) => `${path} (${count} ${plural({ count, one: 'правка', few: 'правки', many: 'правок' })})`,
            readingFile: ({ file }: { file: string }) => `Чтение ${file}`,
            writingFile: ({ file }: { file: string }) => `Запись ${file}`,
            modifyingFile: ({ file }: { file: string }) => `Изменение ${file}`,
            modifyingFiles: ({ count }: { count: number }) => `Изменение ${count} ${plural({ count, one: 'файла', few: 'файлов', many: 'файлов' })}`,
            modifyingMultipleFiles: ({ file, count }: { file: string; count: number }) => `${file} и ещё ${count}`,
            showingDiff: 'Показ изменений',
        }
    },

    files: {
        searchPlaceholder: 'Поиск файлов...',
        detachedHead: 'отделённый HEAD',
        summary: ({ staged, unstaged }: { staged: number; unstaged: number }) => `${staged} подготовлено • ${unstaged} не подготовлено`,
        notRepo: 'Не является git-репозиторием',
        notUnderGit: 'Эта папка не находится под управлением git',
        searching: 'Поиск файлов...',
        noFilesFound: 'Файлы не найдены',
        noFilesInProject: 'Файлов в проекте нет',
        tryDifferentTerm: 'Попробуйте другой поисковый запрос',
        searchResults: ({ count }: { count: number }) => `Результаты поиска (${count})`,
        projectRoot: 'Корень проекта',
        stagedChanges: ({ count }: { count: number }) => `Подготовленные изменения (${count})`,
        unstagedChanges: ({ count }: { count: number }) => `Неподготовленные изменения (${count})`,
        // File viewer strings
        loadingFile: ({ fileName }: { fileName: string }) => `Загрузка ${fileName}...`,
        binaryFile: 'Бинарный файл',
        cannotDisplayBinary: 'Невозможно отобразить содержимое бинарного файла',
        diff: 'Различия',
        file: 'Файл',
        fileEmpty: 'Файл пустой',
        noChanges: 'Нет изменений для отображения',
    },

    settingsVoice: {
        // Voice settings screen
        languageTitle: 'Язык',
        languageDescription: 'Выберите предпочтительный язык для взаимодействия с голосовым помощником. Эта настройка синхронизируется на всех ваших устройствах.',
        preferredLanguage: 'Предпочтительный язык',
        preferredLanguageSubtitle: 'Язык, используемый для ответов голосового помощника',
        language: {
            searchPlaceholder: 'Поиск языков...',
            title: 'Языки',
            footer: ({ count }: { count: number }) => `Доступно ${count} ${plural({ count, one: 'язык', few: 'языка', many: 'языков' })}`,
            autoDetect: 'Автоопределение',
        }
    },

    settingsAccount: {
        // Account settings screen
        accountInformation: 'Информация об аккаунте',
        status: 'Статус',
        statusActive: 'Активный',
        statusNotAuthenticated: 'Не авторизован',
        anonymousId: 'Анонимный ID',
        publicId: 'Публичный ID',
        notAvailable: 'Недоступно',
        linkNewDevice: 'Привязать новое устройство',
        linkNewDeviceSubtitle: 'Отсканируйте QR-код для привязки устройства',
        profile: 'Профиль',
        name: 'Имя',
        github: 'GitHub',
        tapToDisconnect: 'Нажмите для отключения',
        server: 'Сервер',
        backup: 'Резервная копия',
        backupDescription: 'Ваш секретный ключ - единственный способ восстановить ваш аккаунт. Сохраните его в безопасном месте, например в менеджере паролей.',
        secretKey: 'Секретный ключ',
        tapToReveal: 'Нажмите для показа',
        tapToHide: 'Нажмите для скрытия',
        secretKeyLabel: 'СЕКРЕТНЫЙ КЛЮЧ (НАЖМИТЕ ДЛЯ КОПИРОВАНИЯ)',
        secretKeyCopied: 'Секретный ключ скопирован в буфер обмена. Сохраните его в безопасном месте!',
        secretKeyCopyFailed: 'Не удалось скопировать секретный ключ',
        privacy: 'Конфиденциальность',
        privacyDescription: 'Помогите улучшить приложение, поделившись анонимными данными об использовании. Никакая личная информация не собирается.',
        analytics: 'Аналитика',
        analyticsDisabled: 'Данные не передаются',
        analyticsEnabled: 'Анонимные данные об использовании передаются',
        dangerZone: 'Опасная зона',
        logout: 'Выйти',
        logoutSubtitle: 'Выйти из аккаунта и очистить локальные данные',
        logoutConfirm: 'Вы уверены, что хотите выйти? Убедитесь, что вы сохранили резервную копию секретного ключа!',
    },

    connectButton: {
        authenticate: 'Авторизация терминала',
        authenticateWithUrlPaste: 'Авторизация терминала через URL',
        pasteAuthUrl: 'Вставьте авторизационный URL из терминала',
    },

    updateBanner: {
        updateAvailable: 'Доступно обновление',
        pressToApply: 'Нажмите, чтобы применить обновление',
        whatsNew: 'Что нового',
        seeLatest: 'Посмотреть последние обновления и улучшения',
        nativeUpdateAvailable: 'Доступно обновление приложения',
        tapToUpdateAppStore: 'Нажмите для обновления в App Store',
        tapToUpdatePlayStore: 'Нажмите для обновления в Play Store',
    },

    changelog: {
        // Used by the changelog screen
        version: ({ version }: { version: number }) => `Версия ${version}`,
        noEntriesAvailable: 'Записи журнала изменений недоступны.',
    },

    terminal: {
        // Used by terminal connection screens
        webBrowserRequired: 'Требуется веб-браузер',
        webBrowserRequiredDescription: 'Ссылки подключения терминала можно открывать только в веб-браузере по соображениям безопасности. Используйте сканер QR-кодов или откройте эту ссылку на компьютере.',
        processingConnection: 'Обработка подключения...',
        invalidConnectionLink: 'Неверная ссылка подключения',
        invalidConnectionLinkDescription: 'Ссылка подключения отсутствует или неверна. Проверьте URL и попробуйте снова.',
        connectTerminal: 'Подключить терминал',
        terminalRequestDescription: 'Терминал запрашивает подключение к вашему аккаунту Happy Coder. Это позволит терминалу безопасно отправлять и получать сообщения.',
        connectionDetails: 'Детали подключения',
        publicKey: 'Публичный ключ',
        encryption: 'Шифрование',
        endToEndEncrypted: 'Сквозное шифрование',
        acceptConnection: 'Принять подключение',
        connecting: 'Подключение...',
        reject: 'Отклонить',
        security: 'Безопасность',
        securityFooter: 'Эта ссылка подключения была безопасно обработана в вашем браузере и никогда не отправлялась на сервер. Ваши личные данные останутся в безопасности, и только вы можете расшифровать сообщения.',
        securityFooterDevice: 'Это подключение было безопасно обработано на вашем устройстве и никогда не отправлялось на сервер. Ваши личные данные останутся в безопасности, и только вы можете расшифровать сообщения.',
        clientSideProcessing: 'Обработка на стороне клиента',
        linkProcessedLocally: 'Ссылка обработана локально в браузере',
        linkProcessedOnDevice: 'Ссылка обработана локально на устройстве',
    },

    modals: {
        // Used across connect flows and settings
        authenticateTerminal: 'Авторизация терминала',
        pasteUrlFromTerminal: 'Вставьте URL авторизации из вашего терминала',
        deviceLinkedSuccessfully: 'Устройство успешно связано',
        terminalConnectedSuccessfully: 'Терминал успешно подключен',
        invalidAuthUrl: 'Неверный URL авторизации',
        developerMode: 'Режим разработчика',
        developerModeEnabled: 'Режим разработчика включен',
        developerModeDisabled: 'Режим разработчика отключен',
        disconnectGithub: 'Отключить GitHub',
        disconnectGithubConfirm: 'Вы уверены, что хотите отключить аккаунт GitHub?',
        disconnectService: ({ service }: { service: string }) => 
            `Отключить ${service}`,
        disconnectServiceConfirm: ({ service }: { service: string }) => 
            `Вы уверены, что хотите отключить ${service} от вашего аккаунта?`,
        disconnect: 'Отключить',
        failedToConnectTerminal: 'Не удалось подключить терминал',
        cameraPermissionsRequiredToConnectTerminal: 'Для подключения терминала требуется доступ к камере',
        failedToLinkDevice: 'Не удалось связать устройство',
        cameraPermissionsRequiredToScanQr: 'Для сканирования QR-кодов требуется доступ к камере',
        cameraPermissionsRequired: 'Для сканирования QR-кодов требуется доступ к камере',
    },

    navigation: {
        // Navigation titles and screen headers
        connectTerminal: 'Подключить терминал',
        linkNewDevice: 'Связать новое устройство',
        restoreWithSecretKey: 'Восстановить секретным ключом',
        whatsNew: 'Что нового',
        friends: 'Друзья',
    },

    welcome: {
        // Main welcome screen for unauthenticated users
        title: 'Мобильный клиент Codex и Claude Code',
        subtitle: 'Сквозное шифрование, аккаунт хранится только на вашем устройстве.',
        createAccount: 'Создать аккаунт',
        linkOrRestoreAccount: 'Связать или восстановить аккаунт',
        loginWithMobileApp: 'Войти через мобильное приложение',
    },

    // Phase 6: Biometric Login
    biometricLogin: {
        title: 'Быстрый вход',
        subtitle: 'Используйте биометрическую аутентификацию для быстрого доступа',
        faceId: 'Face ID',
        touchId: 'Touch ID',
        fingerprint: 'Отпечаток пальца',
        biometric: 'Биометрия',
        loginWith: ({ type }: { type: string }) => `Войти через ${type}`,
        usePassword: 'Использовать пароль',
        enableBiometric: 'Включить биометрический вход',
        authenticating: 'Аутентификация...',
        authenticationSuccess: 'Аутентификация успешна',
        authenticationFailed: 'Ошибка аутентификации',
        notAvailable: 'Биометрическая аутентификация недоступна на этом устройстве',
        notEnrolled: 'Биометрические данные не зарегистрированы. Настройте биометрию в настройках устройства.',
        noCredentials: 'Сохранённые учётные данные не найдены. Сначала войдите с паролем.',
        hardwareNotAvailable: 'Биометрическое оборудование недоступно',
        cancelled: 'Аутентификация отменена',
        lockout: 'Слишком много неудачных попыток. Попробуйте позже.',
        setupTitle: 'Включить быстрый вход',
        setupDescription: 'Хотите включить биометрический вход для более быстрого доступа в следующий раз?',
        setupConfirm: 'Включить',
        setupDecline: 'Не сейчас',
        secureStorage: 'Ваши учётные данные надёжно хранятся в связке ключей устройства',
        biometricEnabled: ({ type }: { type: string }) => `Вход через ${type} включён`,
        biometricDisabled: 'Биометрический вход отключён',
    },

    review: {
        // Used by utils/requestReview.ts
        enjoyingApp: 'Нравится приложение?',
        feedbackPrompt: 'Мы будем рады вашему отзыву!',
        yesILoveIt: 'Да, мне нравится!',
        notReally: 'Не совсем'
    },

    items: {
        // Used by Item component for copy toast
        copiedToClipboard: ({ label }: { label: string }) => `${label} скопировано в буфер обмена`
    },

    machine: {
        offlineUnableToSpawn: 'Запуск отключен: машина offline',
        offlineHelp: '• Убедитесь, что компьютер online\n• Выполните `happy daemon status` для диагностики\n• Используете последнюю версию CLI? Обновите командой `npm install -g happy-coder@latest`',
        launchNewSessionInDirectory: 'Запустить новую сессию в папке',
        daemon: 'Daemon',
        status: 'Статус',
        stopDaemon: 'Остановить daemon',
        lastKnownPid: 'Последний известный PID',
        lastKnownHttpPort: 'Последний известный HTTP порт',
        startedAt: 'Запущен в',
        cliVersion: 'Версия CLI',
        daemonStateVersion: 'Версия состояния daemon',
        activeSessions: ({ count }: { count: number }) => `Активные сессии (${count})`,
        machineGroup: 'Машина',
        host: 'Хост',
        machineId: 'ID машины',
        username: 'Имя пользователя',
        homeDirectory: 'Домашний каталог',
        platform: 'Платформа',
        architecture: 'Архитектура',
        lastSeen: 'Последняя активность',
        never: 'Никогда',
        metadataVersion: 'Версия метаданных',
        untitledSession: 'Безымянная сессия',
        back: 'Назад',
    },

    message: {
        switchedToMode: ({ mode }: { mode: string }) => `Переключено в режим ${mode}`,
        unknownEvent: 'Неизвестное событие',
        usageLimitUntil: ({ time }: { time: string }) => `Лимит использования достигнут до ${time}`,
        unknownTime: 'неизвестное время',
        // MessageStream detail modal
        details: 'Детали сообщения',
        id: 'ID сообщения',
        timestamp: 'Метка времени',
        type: 'Тип',
        encryption: 'Шифрование',
        encrypted: 'Зашифровано',
        unencrypted: 'Не зашифровано',
        localId: 'Локальный ID',
    },

    commandQueue: {
        // Command Queue Management
        title: 'Очередь команд',
        empty: 'Очередь пуста',
        emptyDescription: 'Команды появятся здесь, когда ИИ занят',
        count: ({ count }: { count: number }) => `${count} команд${count === 1 ? 'а' : count < 5 ? 'ы' : ''} в очереди`,
        clear: 'Очистить',
        clearTitle: 'Очистить очередь',
        clearConfirm: 'Вы уверены, что хотите очистить все команды в очереди?',
        deleteTitle: 'Удалить команду',
        deleteConfirm: 'Вы уверены, что хотите удалить эту команду?',
        editPlaceholder: 'Редактировать команду...',
        status: {
            pending: 'Ожидание',
            sending: 'Отправка',
            sent: 'Отправлено',
            failed: 'Ошибка',
        },
    },

    codex: {
        // Codex permission dialog buttons
        permissions: {
            yesForSession: 'Да, и не спрашивать для этой сессии',
            stopAndExplain: 'Остановить и объяснить, что делать',
        }
    },

    claude: {
        // Claude permission dialog buttons
        permissions: {
            yesAllowAllEdits: 'Да, разрешить все правки в этой сессии',
            yesForTool: 'Да, больше не спрашивать для этого инструмента',
            noTellClaude: 'Нет, и сказать Claude что делать по-другому',
        }
    },

    settingsLanguage: {
        // Language settings screen
        title: 'Язык',
        description: 'Выберите предпочтительный язык интерфейса приложения. Настройки синхронизируются на всех ваших устройствах.',
        currentLanguage: 'Текущий язык',
        automatic: 'Автоматически',
        automaticSubtitle: 'Определять по настройкам устройства',
        needsRestart: 'Язык изменён',
        needsRestartMessage: 'Приложение нужно перезапустить для применения новых языковых настроек.',
        restartNow: 'Перезапустить',
    },

    textSelection: {
        // Text selection screen
        selectText: 'Выделить диапазон текста',
        title: 'Выделить текст',
        noTextProvided: 'Текст не предоставлен',
        textNotFound: 'Текст не найден или устарел',
        textCopied: 'Текст скопирован в буфер обмена',
        failedToCopy: 'Не удалось скопировать текст в буфер обмена',
        noTextToCopy: 'Нет текста для копирования',
    },

    markdown: {
        // Markdown copy functionality
        codeCopied: 'Код скопирован',
        copyFailed: 'Ошибка копирования',
        mermaidRenderFailed: 'Не удалось отобразить диаграмму mermaid',
    },

    artifacts: {
        // Artifacts feature
        title: 'Артефакты',
        countSingular: '1 артефакт',
        countPlural: ({ count }: { count: number }) => {
            const n = Math.abs(count);
            const n10 = n % 10;
            const n100 = n % 100;
            
            if (n10 === 1 && n100 !== 11) {
                return `${count} артефакт`;
            }
            if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) {
                return `${count} артефакта`;
            }
            return `${count} артефактов`;
        },
        empty: 'Артефактов пока нет',
        emptyDescription: 'Создайте первый артефакт, чтобы начать',
        new: 'Новый артефакт',
        edit: 'Редактировать артефакт',
        delete: 'Удалить',
        updateError: 'Не удалось обновить артефакт. Пожалуйста, попробуйте еще раз.',
        notFound: 'Артефакт не найден',
        discardChanges: 'Отменить изменения?',
        discardChangesDescription: 'У вас есть несохраненные изменения. Вы уверены, что хотите их отменить?',
        deleteConfirm: 'Удалить артефакт?',
        deleteConfirmDescription: 'Это действие нельзя отменить',
        titleLabel: 'ЗАГОЛОВОК',
        titlePlaceholder: 'Введите заголовок для вашего артефакта',
        bodyLabel: 'СОДЕРЖИМОЕ',
        bodyPlaceholder: 'Напишите ваш контент здесь...',
        emptyFieldsError: 'Пожалуйста, введите заголовок или содержимое',
        createError: 'Не удалось создать артефакт. Пожалуйста, попробуйте снова.',
        save: 'Сохранить',
        saving: 'Сохранение...',
        loading: 'Загрузка артефактов...',
        error: 'Не удалось загрузить артефакт',
    },

    friends: {
        // Friends feature
        title: 'Друзья',
        manageFriends: 'Управляйте своими друзьями и связями',
        searchTitle: 'Найти друзей',
        pendingRequests: 'Запросы в друзья',
        myFriends: 'Мои друзья',
        noFriendsYet: 'У вас пока нет друзей',
        findFriends: 'Найти друзей',
        remove: 'Удалить',
        pendingRequest: 'Ожидается',
        sentOn: ({ date }: { date: string }) => `Отправлено ${date}`,
        accept: 'Принять',
        reject: 'Отклонить',
        addFriend: 'Добавить в друзья',
        alreadyFriends: 'Уже в друзьях',
        requestPending: 'Запрос отправлен',
        searchInstructions: 'Введите имя пользователя для поиска друзей',
        searchPlaceholder: 'Введите имя пользователя...',
        searching: 'Поиск...',
        userNotFound: 'Пользователь не найден',
        noUserFound: 'Пользователь с таким именем не найден',
        checkUsername: 'Пожалуйста, проверьте имя пользователя и попробуйте снова',
        howToFind: 'Как найти друзей',
        findInstructions: 'Ищите друзей по имени пользователя. И вы, и ваш друг должны подключить GitHub для отправки запросов в друзья.',
        requestSent: 'Запрос в друзья отправлен!',
        requestAccepted: 'Запрос в друзья принят!',
        requestRejected: 'Запрос в друзья отклонён',
        friendRemoved: 'Друг удалён',
        confirmRemove: 'Удалить из друзей',
        confirmRemoveMessage: 'Вы уверены, что хотите удалить этого друга?',
        cannotAddYourself: 'Вы не можете отправить запрос в друзья самому себе',
        bothMustHaveGithub: 'Оба пользователя должны подключить GitHub, чтобы стать друзьями',
        status: {
            none: 'Не подключен',
            requested: 'Запрос отправлен',
            pending: 'Запрос ожидается',
            friend: 'Друзья',
            rejected: 'Отклонено',
            blocked: 'Заблокирован',  // Phase 7
        },
        acceptRequest: 'Принять запрос',
        removeFriend: 'Удалить из друзей',
        removeFriendConfirm: ({ name }: { name: string }) => `Вы уверены, что хотите удалить ${name} из друзей?`,
        requestSentDescription: ({ name }: { name: string }) => `Ваш запрос в друзья отправлен пользователю ${name}`,
        requestFriendship: 'Отправить запрос в друзья',
        cancelRequest: 'Отменить запрос в друзья',
        cancelRequestConfirm: ({ name }: { name: string }) => `Отменить ваш запрос в друзья к ${name}?`,
        denyRequest: 'Отклонить запрос',
        nowFriendsWith: ({ name }: { name: string }) => `Теперь вы друзья с ${name}`,
        // Phase 7: Blocked users
        blockedUsers: 'Заблокированные пользователи',
        noBlockedUsers: 'Нет заблокированных пользователей',
        blockUser: 'Заблокировать',
        unblockUser: 'Разблокировать',
        blockUserConfirm: ({ name }: { name: string }) => `Вы уверены, что хотите заблокировать ${name}? Они не смогут видеть ваши сессии или отправлять вам запросы.`,
        unblockUserConfirm: ({ name }: { name: string }) => `Вы уверены, что хотите разблокировать ${name}?`,
        userBlocked: ({ name }: { name: string }) => `${name} заблокирован`,
        userUnblocked: ({ name }: { name: string }) => `${name} разблокирован`,
    },

    // Phase 7: Session Sharing
    sessionSharing: {
        mySessions: 'Мои сессии',
        sharedWithMe: 'Доступные мне',
        accessLevel: {
            owner: 'Владелец',
            view: 'Только просмотр',
            collaborate: 'Совместная работа',
        },
        shareSession: 'Поделиться сессией',
        shareWith: ({ name }: { name: string }) => `Поделиться с ${name}`,
        manageSharing: 'Управление доступом',
        viewDescription: 'Только просмотр, без отправки сообщений',
        collaborateDescription: 'Просмотр и отправка сообщений',
        selectFriend: 'Выберите друга для совместного доступа',
        selectPermission: 'Выберите уровень доступа',
        noFriendsToShare: 'Сначала добавьте друзей, чтобы делиться с ними сессиями',
        sharedBy: ({ name }: { name: string }) => `Предоставлена ${name}`,
        sharedWith: ({ name }: { name: string }) => `Доступ открыт для ${name}`,
        sharedWithCount: ({ count }: { count: number }) => `Доступ открыт для ${count} ${count === 1 ? 'человека' : 'человек'}`,
        noSharedSessions: 'Пока никто не поделился с вами сессиями',
        collaborators: 'Участники',
        noCollaborators: 'Эта сессия никому не предоставлена',
        changePermission: 'Изменить права',
        revokeAccess: 'Отозвать доступ',
        revokeAccessConfirm: ({ name }: { name: string }) => `Вы уверены, что хотите отозвать доступ ${name} к этой сессии?`,
        shareCreated: ({ name }: { name: string }) => `Сессия предоставлена ${name}`,
        shareUpdated: ({ name }: { name: string }) => `Права обновлены для ${name}`,
        shareRevoked: ({ name }: { name: string }) => `Доступ отозван для ${name}`,
        shareError: 'Не удалось поделиться сессией',
        readOnlyMode: 'Только просмотр',
        readOnlyDescription: 'Вы можете просматривать эту сессию, но не можете отправлять сообщения',
    },

    usage: {
        // Usage panel strings
        today: 'Сегодня',
        last7Days: 'Последние 7 дней',
        last30Days: 'Последние 30 дней',
        totalTokens: 'Всего токенов',
        totalCost: 'Общая стоимость',
        tokens: 'Токены',
        cost: 'Стоимость',
        usageOverTime: 'Использование во времени',
        byModel: 'По модели',
        noData: 'Данные об использовании недоступны',
    },

    feed: {
        // Feed notifications for friend requests and acceptances
        friendRequestFrom: ({ name }: { name: string }) => `${name} отправил вам запрос в друзья`,
        friendRequestGeneric: 'Новый запрос в друзья',
        friendAccepted: ({ name }: { name: string }) => `Вы теперь друзья с ${name}`,
        friendAcceptedGeneric: 'Запрос в друзья принят',
        // Phase 7: Extended notification types
        unknownUser: 'Неизвестный пользователь',
        session: 'Сессия',
        friendRequestAcceptedConfirm: ({ name }: { name: string }) => `Вы теперь друзья с ${name}`,
        friendRequestRejectedConfirm: ({ name }: { name: string }) => `Запрос в друзья от ${name} отклонён`,
        friendRejected: ({ name }: { name: string }) => `${name} отклонил ваш запрос в друзья`,
        sessionShared: ({ name }: { name: string }) => `${name} поделился с вами сессией`,
        sharePermissionChanged: ({ sessionTitle, accessLevel }: { sessionTitle: string; accessLevel: string }) => `Права доступа к "${sessionTitle}" изменены на ${accessLevel}`,
        shareRevoked: ({ name, sessionTitle }: { name: string; sessionTitle: string }) => `${name} отозвал ваш доступ к "${sessionTitle}"`,
        sessionActivity: ({ name, sessionTitle }: { name: string; sessionTitle: string }) => `${name} отправил сообщение в "${sessionTitle}"`,
    },

    settingsNotifications: {
        // Notifications settings screen
        title: 'Уведомления',
        subtitle: 'Управление настройками push-уведомлений',
        webPush: 'Push-уведомления',
        webPushDescription: 'Получайте уведомления даже когда приложение закрыто. Необходимо разрешение браузера.',
        notSupported: 'Не поддерживается',
        notSupportedDescription: 'Ваш браузер не поддерживает push-уведомления. Попробуйте Chrome, Firefox или Edge.',
        permissionDenied: 'Разрешение отклонено',
        permissionDeniedDescription: 'Push-уведомления заблокированы в настройках браузера. Чтобы включить их, измените разрешение сайта в настройках браузера.',
        permissionRequired: 'Требуется разрешение',
        permissionRequiredDescription: 'Нажмите, чтобы разрешить push-уведомления',
        subscribed: 'Подписан',
        subscribedDescription: 'Вы будете получать push-уведомления',
        unsubscribed: 'Отключено',
        unsubscribedDescription: 'Push-уведомления отключены',
        enableNotifications: 'Включить уведомления',
        disableNotifications: 'Отключить уведомления',
        requestPermission: 'Разрешить уведомления',
        notificationTypes: 'Типы уведомлений',
        notificationTypesDescription: 'Выберите, какие типы уведомлений вы хотите получать',
        approvalRequest: 'Запросы на одобрение',
        approvalRequestDescription: 'Уведомления когда терминал запрашивает разрешение',
        taskComplete: 'Завершение задачи',
        taskCompleteDescription: 'Уведомления когда фоновая задача завершена',
        newMessage: 'Новые сообщения',
        newMessageDescription: 'Уведомления о новых сообщениях в сессии',
        systemNotification: 'Системные оповещения',
        systemNotificationDescription: 'Важные системные оповещения и объявления',
        deviceInfo: 'Информация об устройстве',
        deviceId: 'ID устройства',
        subscriptionFailed: 'Не удалось подписаться на уведомления',
        unsubscriptionFailed: 'Не удалось отписаться от уведомлений',
        updatePreferencesFailed: 'Не удалось обновить настройки уведомлений',
        testNotification: 'Отправить тестовое уведомление',
        testNotificationSent: 'Тестовое уведомление отправлено',
        testNotificationFailed: 'Не удалось отправить тестовое уведомление',
    },

    voice: {
        // Browser Native Voice I/O (Phase 4)
        browser: {
            notWebPlatform: 'Голосовые функции доступны только на веб-платформе',
            outdatedBrowser: 'Пожалуйста, обновите браузер для использования голосовых функций',
            notSupported: 'Ваш браузер не поддерживает голосовые функции',
        },
        errors: {
            browserNotSupported: {
                title: 'Браузер не поддерживается',
                message: 'Ваш браузер не поддерживает распознавание речи. Используйте Chrome, Edge или Safari.',
                suggestion: 'Попробуйте переключиться на поддерживаемый браузер, например Chrome или Edge.',
            },
            microphonePermissionDenied: {
                title: 'Доступ к микрофону запрещён',
                message: 'Разрешение на доступ к микрофону было отклонено. Голосовой ввод требует доступа к микрофону.',
                suggestion: 'Пожалуйста, включите доступ к микрофону в настройках браузера.',
            },
            networkError: {
                title: 'Ошибка сети',
                message: 'Произошла сетевая ошибка при распознавании речи.',
                suggestion: 'Проверьте подключение к интернету и попробуйте снова.',
            },
            noSpeechDetected: {
                title: 'Речь не обнаружена',
                message: 'Речь не была обнаружена. Говорите чётко в микрофон.',
                suggestion: 'Попробуйте говорить громче или приблизьтесь к микрофону.',
            },
            languageNotSupported: {
                title: 'Язык не поддерживается',
                message: 'Выбранный язык не поддерживается вашим браузером.',
                suggestion: 'Попробуйте выбрать другой язык в настройках голоса.',
            },
            synthesisError: {
                title: 'Ошибка синтеза речи',
                message: 'Произошла ошибка при генерации голосового вывода.',
                suggestion: 'Попробуйте снова или выберите другой голос.',
            },
            recognitionAborted: {
                title: 'Распознавание остановлено',
                message: 'Распознавание речи было остановлено.',
                suggestion: 'Нажмите кнопку микрофона, чтобы начать снова.',
            },
            audioCaptureError: {
                title: 'Ошибка захвата аудио',
                message: 'Не удалось захватить аудио с микрофона.',
                suggestion: 'Проверьте, не использует ли микрофон другое приложение.',
            },
            serviceUnavailable: {
                title: 'Сервис недоступен',
                message: 'Сервис распознавания речи временно недоступен.',
                suggestion: 'Подождите немного и попробуйте снова.',
            },
            unknown: {
                title: 'Неизвестная ошибка',
                message: 'Произошла непредвиденная ошибка с голосовыми функциями.',
                suggestion: 'Попробуйте снова. Если проблема сохраняется, обновите страницу.',
            },
        },
        controls: {
            startListening: 'Начать слушать',
            stopListening: 'Остановить прослушивание',
            startSpeaking: 'Читать вслух',
            stopSpeaking: 'Остановить чтение',
            listening: 'Слушаю...',
            speaking: 'Говорю...',
            processing: 'Обработка...',
        },
        settings: {
            title: 'Настройки голоса',
            provider: 'Провайдер голоса',
            providerDescription: 'Выберите предпочтительного провайдера голоса',
            providerBrowser: 'Встроенный браузер',
            providerElevenLabs: 'ElevenLabs',
            input: 'Голосовой ввод',
            inputDescription: 'Включить преобразование речи в текст для голосовых команд',
            inputEnabled: 'Голосовой ввод включён',
            inputDisabled: 'Голосовой ввод выключен',
            output: 'Голосовой вывод',
            outputDescription: 'Включить преобразование текста в речь для ответов',
            outputEnabled: 'Голосовой вывод включён',
            outputDisabled: 'Голосовой вывод выключен',
            recognitionLanguage: 'Язык распознавания',
            recognitionLanguageDescription: 'Язык для распознавания речи',
            recognitionLanguageFooter: ({ count }: { count: number }) => `${count} языков доступно`,
            speechRate: 'Скорость речи',
            speechRateDescription: 'Настройте скорость голосового вывода',
            speechPitch: 'Высота голоса',
            speechPitchDescription: 'Настройте высоту голосового вывода',
            speechVolume: 'Громкость речи',
            speechVolumeDescription: 'Настройте громкость голосового вывода',
            selectedVoice: 'Голос',
            selectedVoiceDescription: 'Выберите голос для речевого вывода',
            systemDefault: 'Системный по умолчанию',
            testVoice: 'Тест голоса',
            testVoiceText: 'Это тест функции преобразования текста в речь.',
            browserNotSupported: 'Голосовые функции браузера не поддерживаются',
            browserNotSupportedDescription: 'Ваш браузер не поддерживает Web Speech API. Используйте Chrome, Edge или Safari.',
        },
    },

    pwa: {
        install: {
            title: 'Установить Happy Coder',
            message: 'Установите Happy Coder для лучшего опыта с офлайн-доступом и push-уведомлениями.',
            installButton: 'Установить',
            notNow: 'Не сейчас',
            installed: 'Приложение установлено',
            installedMessage: 'Happy Coder установлен. Теперь вы можете открыть его с главного экрана.',
        },
        offline: {
            title: 'Вы не в сети',
            message: 'Некоторые функции могут быть ограничены без подключения к сети.',
            reconnecting: 'Переподключение...',
            reconnected: 'Снова в сети',
        },
        update: {
            title: 'Доступно обновление',
            message: 'Доступна новая версия Happy Coder.',
            updateButton: 'Обновить сейчас',
            later: 'Позже',
        },
        notifications: {
            title: 'Push-уведомления',
            description: 'Получайте уведомления о запросах на одобрение и обновлениях.',
            enable: 'Включить уведомления',
            disable: 'Отключить уведомления',
            permissionDenied: 'Уведомления заблокированы',
            permissionDeniedMessage: 'Пожалуйста, включите уведомления в настройках браузера.',
            subscribed: 'Уведомления включены',
            unsubscribed: 'Уведомления отключены',
            preferences: 'Настройки уведомлений',
            approvalRequests: 'Запросы на одобрение',
            approvalRequestsDescription: 'Получать уведомления, когда кто-то запрашивает ваше одобрение',
            taskComplete: 'Задача выполнена',
            taskCompleteDescription: 'Получать уведомления о завершении задач',
            newMessage: 'Новые сообщения',
            newMessageDescription: 'Получать уведомления о новых сообщениях',
            systemAnnouncements: 'Системные объявления',
            systemAnnouncementsDescription: 'Важные обновления и объявления',
            muteAll: 'Отключить все',
            muteAllDescription: 'Временно отключить все уведомления',
        },
    },
} as const;

export type TranslationsRu = typeof ru;
