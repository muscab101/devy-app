"use client"

import React from 'react'
import { Tldraw, type Editor } from 'tldraw' 
import 'tldraw/tldraw.css'

interface DrawProps {
    setEditor: (editor: Editor) => void;
}

const Draw = ({ setEditor }: DrawProps) => {
    return (
        /* H-FULL iyo RELATIVE waa muhiim si uusan u baaba'in */
        <div className='relative w-full h-full' style={{ minHeight: '500px' }}>
            <Tldraw 
                persistenceKey='saasify-app'
                onMount={(editor) => {
                    setEditor(editor);
                    // Ka saar gaduudka adoo isticmaalaya (as any)
                    try {
                        (editor as any).user.updateUserPreferences({ isDarkMode: false });
                    } catch (e) {
                        console.log("Dark mode preference error ignored");
                    }
                }}
            />
        </div>
    )
}

export default Draw