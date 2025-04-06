declare module 'react-native-websocket' {
    export default class WebSocket {
        constructor(url: string);
        onopen: () => void;
        onmessage: (event: MessageEvent) => void;
        onerror: (error: Event) => void;
        onclose: () => void;
        close: () => void;
        send: (data: string) => void;
    }
} 