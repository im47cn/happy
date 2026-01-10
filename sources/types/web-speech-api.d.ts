/**
 * @file Web Speech API 类型声明
 * @input W3C Web Speech API 规范
 * @output TypeScript 类型定义
 * @pos 类型声明目录，为浏览器 Speech API 提供类型支持
 *
 * 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 CLAUDE.md。
 */

declare global {
    // ========================================================================
    // SpeechRecognition API Types
    // ========================================================================

    /**
     * SpeechRecognitionAlternative - 语音识别结果的一个备选项
     */
    interface SpeechRecognitionAlternative {
        /** 识别出的文本 */
        readonly transcript: string;
        /** 置信度 (0-1) */
        readonly confidence: number;
    }

    /**
     * SpeechRecognitionResult - 单个识别结果
     */
    interface SpeechRecognitionResult {
        /** 备选项数量 */
        readonly length: number;
        /** 是否为最终结果 */
        readonly isFinal: boolean;
        /** 获取指定索引的备选项 */
        item(index: number): SpeechRecognitionAlternative;
        [index: number]: SpeechRecognitionAlternative;
    }

    /**
     * SpeechRecognitionResultList - 识别结果列表
     */
    interface SpeechRecognitionResultList {
        /** 结果数量 */
        readonly length: number;
        /** 获取指定索引的结果 */
        item(index: number): SpeechRecognitionResult;
        [index: number]: SpeechRecognitionResult;
    }

    /**
     * SpeechRecognitionEvent - 语音识别事件
     */
    interface SpeechRecognitionEvent extends Event {
        /** 结果索引 */
        readonly resultIndex: number;
        /** 识别结果列表 */
        readonly results: SpeechRecognitionResultList;
    }

    /**
     * SpeechRecognitionErrorCode - 错误代码类型
     */
    type SpeechRecognitionErrorCode =
        | 'no-speech'
        | 'aborted'
        | 'audio-capture'
        | 'network'
        | 'not-allowed'
        | 'service-not-allowed'
        | 'bad-grammar'
        | 'language-not-supported';

    /**
     * SpeechRecognitionErrorEvent - 语音识别错误事件
     */
    interface SpeechRecognitionErrorEvent extends Event {
        /** 错误代码 */
        readonly error: SpeechRecognitionErrorCode;
        /** 错误消息 */
        readonly message: string;
    }

    /**
     * SpeechGrammar - 语法定义
     */
    interface SpeechGrammar {
        /** 语法源 URI */
        src: string;
        /** 权重 (0-1) */
        weight: number;
    }

    /**
     * SpeechGrammarList - 语法列表
     */
    interface SpeechGrammarList {
        /** 语法数量 */
        readonly length: number;
        /** 获取指定索引的语法 */
        item(index: number): SpeechGrammar;
        /** 从 URI 添加语法 */
        addFromURI(src: string, weight?: number): void;
        /** 从字符串添加语法 */
        addFromString(string: string, weight?: number): void;
        [index: number]: SpeechGrammar;
    }

    /**
     * SpeechRecognition - 语音识别接口
     */
    interface SpeechRecognition extends EventTarget {
        /** 语法列表 */
        grammars: SpeechGrammarList;
        /** 识别语言 */
        lang: string;
        /** 是否持续识别 */
        continuous: boolean;
        /** 是否返回临时结果 */
        interimResults: boolean;
        /** 最大备选项数量 */
        maxAlternatives: number;

        /** 开始识别 */
        start(): void;
        /** 停止识别 */
        stop(): void;
        /** 中止识别 */
        abort(): void;

        // Event handlers
        onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
        onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
        onend: ((this: SpeechRecognition, ev: Event) => void) | null;
        onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
        onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
        onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
        onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
        onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
        onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
        onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
        onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    }

    /**
     * SpeechRecognition 构造函数接口
     */
    interface SpeechRecognitionConstructor {
        new (): SpeechRecognition;
        prototype: SpeechRecognition;
    }

    // ========================================================================
    // Global window extensions
    // ========================================================================

    /** SpeechRecognition 构造函数（标准） */
    const SpeechRecognition: SpeechRecognitionConstructor | undefined;
    /** SpeechRecognition 构造函数（webkit 前缀，用于 Chrome/Edge） */
    const webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;

    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

export {};
