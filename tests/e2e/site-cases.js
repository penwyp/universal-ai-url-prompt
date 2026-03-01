'use strict';

const SITE_CASES = [
    {
        platform: 'ChatGPT',
        host: 'chatgpt.com',
        inputMode: 'textarea',
        inputAttributes: 'id="prompt-textarea" data-testid="prompt-textarea"',
        sendButtonAttributes: 'data-testid="send-button" aria-label="Send message"'
    },
    {
        platform: 'Claude',
        host: 'claude.ai',
        inputMode: 'contenteditable',
        inputAttributes: 'data-testid="chat-input" role="textbox"',
        sendButtonAttributes: 'aria-label="Send"'
    },
    {
        platform: 'Gemini',
        host: 'gemini.google.com',
        inputMode: 'contenteditable',
        inputAttributes: 'role="textbox"',
        sendButtonAttributes: 'aria-label="发送"'
    },
    {
        platform: 'Microsoft Copilot',
        host: 'copilot.microsoft.com',
        inputMode: 'textarea',
        inputAttributes: 'id="userInput" aria-label="Message Copilot"',
        sendButtonAttributes: 'type="submit" aria-label="Submit"'
    },
    {
        platform: 'Microsoft Copilot (ContentEditable)',
        host: 'copilot.microsoft.com',
        inputMode: 'contenteditable',
        inputAttributes: 'role="textbox" aria-label="Message Copilot"',
        sendButtonAttributes: 'type="submit" aria-label="Send"'
    },
    {
        platform: 'Perplexity',
        host: 'perplexity.ai',
        inputMode: 'contenteditable',
        inputAttributes: 'id="ask-input" role="textbox" data-lexical-editor="true"',
        sendButtonAttributes: 'aria-label="Submit"'
    },
    {
        platform: 'Grok',
        host: 'grok.com',
        inputMode: 'textarea',
        inputAttributes: 'data-testid="chat-input" placeholder="Ask Grok"',
        sendButtonAttributes: 'data-testid="send-button" aria-label="Send"'
    },
    {
        platform: 'DeepSeek',
        host: 'chat.deepseek.com',
        inputMode: 'textarea',
        inputAttributes: 'id="chat-input" data-testid="chat-input" placeholder="给 DeepSeek 发送消息"',
        sendButtonAttributes: 'data-testid="send-button" aria-label="发送"'
    },
    {
        platform: 'Doubao',
        host: 'doubao.com',
        inputMode: 'textarea',
        inputAttributes: 'data-testid="chat-input" placeholder="和豆包聊聊"',
        sendButtonAttributes: 'aria-label="发送"'
    },
    {
        platform: 'Qwen',
        host: 'chat.qwen.ai',
        inputMode: 'textarea',
        inputAttributes: 'placeholder="Ask Qwen"',
        sendButtonAttributes: 'aria-label="发送"'
    },
    {
        platform: 'Tencent Yuanbao',
        host: 'yuanbao.tencent.com',
        inputMode: 'contenteditable',
        inputAttributes: 'class="ql-editor ql-blank" data-placeholder="和元宝聊聊"',
        sendButtonAttributes: 'aria-label="发送"'
    },
    {
        platform: 'Wenxiaoyan',
        host: 'yiyan.baidu.com',
        inputMode: 'contenteditable',
        inputAttributes: 'role="textbox" class="editable__QRoAFgYA" data-slate-editor="true"',
        sendControlTag: 'div',
        sendButtonAttributes: 'role="button" tabindex="0" class="composer-action__Wxa92 primary-control__8fP2" aria-label="" style="width:36px;height:36px;margin-top:12px;border:1px solid #333;display:inline-flex;"',
        sendButtonText: '>',
        requiresBeforeInputSync: true
    },
    {
        platform: 'Baichuan',
        host: 'ying.baichuan-ai.com',
        inputMode: 'textarea',
        beforeInputMarkup: '<textarea data-e2e-decoy placeholder="请输入关键词搜索" maxlength="200" style="min-height:40px"></textarea><button type="button" class="toolbar-ghost-button">工具</button>',
        inputAttributes: 'placeholder="请输入你的医疗问题..." maxlength="15000" class="bc-scrollbar caret-brand-main"',
        sendButtonAttributes: 'class="group self-end"',
        sendButtonText: ''
    },
    {
        platform: 'DuckDuckGo AI',
        host: 'duck.ai',
        inputMode: 'textarea',
        inputAttributes: 'placeholder="Ask Duck.ai"',
        sendButtonAttributes: 'aria-label="Send"'
    },
    {
        platform: 'HuggingChat',
        host: 'huggingface.co',
        path: '/chat/',
        inputMode: 'textarea',
        inputAttributes: 'placeholder="Ask anything"',
        sendButtonAttributes: 'type="submit" aria-label="Send message" name="submit"'
    },
    {
        platform: 'Kimi',
        host: 'www.kimi.com',
        inputMode: 'contenteditable',
        inputAttributes: 'class="chat-input-editor" role="textbox"',
        sendControlTag: 'div',
        sendButtonAttributes: 'class="send-button-container"',
        useForm: false
    },
    {
        platform: 'Kimi (Moonshot CN Domain)',
        host: 'kimi.moonshot.cn',
        inputMode: 'contenteditable',
        inputAttributes: 'class="chat-input-editor" role="textbox"',
        sendControlTag: 'div',
        sendButtonAttributes: 'class="send-button-container"',
        useForm: false
    },
    {
        platform: 'Poe',
        host: 'poe.com',
        inputMode: 'textarea',
        inputAttributes: 'placeholder="Message Poe"',
        sendButtonAttributes: 'aria-label="Send"'
    },
    {
        platform: 'Mistral Le Chat',
        host: 'chat.mistral.ai',
        inputMode: 'contenteditable',
        inputAttributes: 'class="ProseMirror"',
        beforeInputMarkup: ' <textarea tabindex="-1" aria-hidden="true" style="position:absolute;z-index:-1000;width:100%;height:16px;opacity:0;"></textarea>',
        sendButtonAttributes: 'type="submit" aria-label="Send question"'
    },
    {
        platform: 'Meta AI',
        host: 'meta.ai',
        inputMode: 'textarea',
        inputAttributes: 'placeholder="Ask Meta AI"',
        sendButtonAttributes: 'aria-label="Send"'
    },
    {
        platform: 'ChatGLM',
        host: 'chatglm.cn',
        inputMode: 'textarea',
        inputAttributes: 'placeholder="和 ChatGLM 聊天"',
        sendButtonAttributes: 'aria-label="发送"'
    },
    {
        platform: 'Z.ai',
        host: 'z.ai',
        inputMode: 'textarea',
        inputAttributes: 'placeholder="Ask Z.ai"',
        sendButtonAttributes: 'aria-label="发送"'
    }
];

module.exports = {
    SITE_CASES
};
