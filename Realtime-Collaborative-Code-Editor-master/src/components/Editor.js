import React, {useEffect, useRef} from 'react';
import {language, cmtheme} from '../../src/atoms';
import {useRecoilValue} from 'recoil';
import ACTIONS from '../actions/Actions';

// CODE MIRROR
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';

// Import your desired themes and modes
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
// Add other mode imports as needed

const Editor = ({ socketRef, roomId, onCodeChange, language, theme }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        editorRef.current = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
            mode: language,
            theme: theme,
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
        });

        editorRef.current.setValue('');

        editorRef.current.on('change', (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            onCodeChange(code);
            if (origin !== 'setValue') {
                socketRef.current.emit('code-change', { roomId, code });
            }
        });

        return () => {
            editorRef.current.toTextArea();
        };
    }, [language, theme, roomId, onCodeChange, socketRef]);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('code-change', ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off('code-change');
            }
        };
    }, [socketRef]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;