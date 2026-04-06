/**
 * BV Doctor — diagnoses and fixes Vector Storage issues
 * Install, reload ST, check console, then DELETE this extension.
 */
(function () {
    'use strict';

    const TAG = '🩺 [BV-Doctor]';

    function run() {
        console.log(TAG, '=== DIAGNOSTICS START ===');

        // 1. Check fetch
        const fetchStr = window.fetch.toString();
        const fetchPatched = fetchStr.includes('nativeFetch') ||
                             fetchStr.includes('interceptedFetch') ||
                             fetchStr.includes('capturedQueryMulti') ||
                             fetchStr.includes('BetterVectors');

        console.log(TAG, 'window.fetch patched?', fetchPatched);
        if (fetchPatched) {
            console.warn(TAG, '⚠️ FOUND PATCHED FETCH — attempting restore...');
            console.log(TAG, 'Current fetch source:', fetchStr.substring(0, 200));

            // Try to restore from iframe
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                const cleanFetch = iframe.contentWindow.fetch.bind(window);
                document.body.removeChild(iframe);
                window.fetch = cleanFetch;
                console.log(TAG, '✅ fetch RESTORED from iframe');
            } catch (e) {
                console.error(TAG, '❌ Could not restore fetch:', e);
            }
        } else {
            console.log(TAG, '✅ fetch is clean');
        }

        // 2. Check vectors_rearrangeChat
        const vrc = globalThis.vectors_rearrangeChat;
        const vrcType = typeof vrc;
        console.log(TAG, 'vectors_rearrangeChat type:', vrcType);

        if (vrcType === 'function') {
            const vrcStr = vrc.toString();
            const isHooked = vrcStr.includes('betterRearrangeChat') ||
                             vrcStr.includes('BetterVectors') ||
                             vrcStr.includes('originalRearrangeChat') ||
                             vrcStr.includes('capturedQueryMulti');

            if (isHooked) {
                console.warn(TAG, '⚠️ vectors_rearrangeChat is STILL HOOKED by Better Vectors!');
                console.log(TAG, 'Source:', vrcStr.substring(0, 300));
                // Can't restore original easily, but at least log it
                console.warn(TAG, 'Cannot auto-fix hook. Clear browser cache + restart ST.');
            } else {
                console.log(TAG, '✅ vectors_rearrangeChat is original');
            }
        } else {
            console.error(TAG, '❌ vectors_rearrangeChat is MISSING — Vector Storage not loaded!');
        }

        // 3. Check extension settings for remnants
        try {
            const c = SillyTavern.getContext();
            const bvSettings = c.extensionSettings?.['better-vectors'];
            if (bvSettings) {
                console.warn(TAG, '⚠️ better-vectors settings found in extension_settings:', bvSettings);
            } else {
                console.log(TAG, '✅ No better-vectors settings remnants');
            }

            // Check if vectors extension settings exist
            const vs = c.extensionSettings?.vectors;
            if (vs) {
                console.log(TAG, '✅ Vector Storage settings present');
                console.log(TAG, '  source:', vs.source);
                console.log(TAG, '  enabled_chats:', vs.enabled_chats);
                console.log(TAG, '  enabled_files:', vs.enabled_files);
                console.log(TAG, '  enabled_world_info:', vs.enabled_world_info);
            } else {
                console.error(TAG, '❌ Vector Storage settings MISSING');
            }

            // Check disabled extensions
            const disabled = c.extensionSettings?.disabledExtensions || [];
            const vectorsDisabled = disabled.some(x =>
                x.includes('vectors') && !x.includes('better') && !x.includes('doctor')
            );
            if (vectorsDisabled) {
                console.error(TAG, '❌ Vector Storage is in DISABLED extensions list!', disabled.filter(x => x.includes('vector')));
            } else {
                console.log(TAG, '✅ Vector Storage not in disabled list');
            }
        } catch (e) {
            console.error(TAG, 'Could not access ST context:', e.message);
        }

        // 4. Check if better-vectors extension files are still loaded
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const bvScripts = scripts.filter(s => s.src.includes('better-vectors'));
        if (bvScripts.length > 0) {
            console.warn(TAG, '⚠️ better-vectors script tags still in DOM:', bvScripts.map(s => s.src));
        } else {
            console.log(TAG, '✅ No better-vectors scripts in DOM');
        }

        console.log(TAG, '=== DIAGNOSTICS DONE ===');
        console.log(TAG, 'If issues found: clear browser cache, restart ST, delete BV Doctor.');
    }

    // Run after everything has loaded
    $(document).ready(() => setTimeout(run, 3000));
})();
