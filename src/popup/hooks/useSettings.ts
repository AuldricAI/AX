import { useState, useEffect, useCallback } from 'react';
import type { AXSettings } from '../../lib/types';

const DEFAULT_SETTINGS: AXSettings = {
    llm: {
        provider: 'deepseek',
        apiKey: '',
        model: 'deepseek-chat',
    },
    features: {
        autoCaptureNetwork: true,
        autoCaptureConsole: true
    },
    autoCapture: false,
    theme: 'dark',
    projectSpecs: [],
    projectStage: 'early-dev'
};

export function useSettings() {
    const [settings, setSettings] = useState<AXSettings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (result) => {
            if (result && !result.error) {
                setSettings({ ...DEFAULT_SETTINGS, ...result });
            }
            setIsLoaded(true);
        });
    }, []);

    const saveSettings = useCallback(async (newSettings: AXSettings) => {
        setSettings(newSettings);
        await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', payload: newSettings });
    }, []);

    const hasApiKey = Boolean(settings.llm.apiKey);

    return { settings, saveSettings, isLoaded, hasApiKey };
}
